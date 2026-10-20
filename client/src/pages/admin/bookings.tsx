import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { adminFetch, getApiUrl } from "@/lib/api-config";
import { 
  Globe,
  MapPin, 
  Users, 
  LogOut,
  TrendingUp,
  Calendar,
  Car,
  Briefcase,
  Settings,
  Search,
  Filter,
  Heart,
  IndianRupee,
  FileText,
  Phone,
  User,
  Trash2,
  X,
  ChevronLeft,
  Image as ImageIcon,
  Navigation,
  Plus,
  Loader2,
  AlertCircle,
} from "lucide-react";
import logo from "@assets/Logos/spotly_full-white.png";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface ParkingSpace {
  id: string;
  customerId: string;
  serviceId: string;
  serviceName: string;
  location: string;
  latitude: number | null;
  longitude: number | null;
  city: string | null;
  comments: string | null;
  status: string;
  date: string;
  time: string;
  bookedAt: string;
  customerName?: string;
  customerMobile?: string;
  interestCount?: number;
}

function isSpotlySpace(comments: string | null) {
  if (!comments) return false;
  const c = comments.toLowerCase();
  return (
    c.includes("public roadside") ||
    c.includes("category: public roadside") ||
    c.includes("by spotly") ||
    c.includes("roadside")
  );
}

function parseComments(comments: string | null) {
  if (!comments) return { rent: "", description: "", photos: [] as string[] };
  let rent = "";
  let description = comments;
  let photos: string[] = [];

  const rentMatch = comments.match(/Rent:\s*₹([\d,]+)\/month/);
  if (rentMatch) {
    rent = rentMatch[1];
  }

  const pipeIndex = comments.indexOf(" | ");
  if (pipeIndex !== -1) {
    description = comments.substring(pipeIndex + 3);
  }

  const photosMatch = description.match(/\[PHOTOS\]([\s\S]*?)\[\/PHOTOS\]/);
  if (photosMatch) {
    description = description.replace(/\[PHOTOS\][\s\S]*?\[\/PHOTOS\]/, "").trim();
    const photosRaw = photosMatch[1].trim();
    try {
      if (photosRaw.startsWith("[")) {
        photos = JSON.parse(photosRaw);
      } else {
        photos = photosRaw.split(",").map(p => p.trim()).filter(Boolean);
      }
    } catch {
      photos = photosRaw.split(",").map(p => p.trim()).filter(Boolean);
    }
  }

  return { rent, description, photos };
}

export default function AdminBookings() {
  const [location, setLocation] = useLocation();
  const [spaces, setSpaces] = useState<ParkingSpace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAllowedPhonesModal, setShowAllowedPhonesModal] = useState(false);
  const [allowedParkingByPhones, setAllowedParkingByPhones] = useState<string[]>([]);
  const [newAllowedPhone, setNewAllowedPhone] = useState("");
  const [isSavingAllowedPhones, setIsSavingAllowedPhones] = useState(false);
  const [phoneError, setPhoneError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [cityToStateMap, setCityToStateMap] = useState<Map<string, string>>(new Map());
  const [stateFilter, setStateFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; id: string | null; serviceName: string }>({ show: false, id: null, serviceName: "" });
  const [photoModal, setPhotoModal] = useState<{
    spaceId: string;
    photos: string[];
    currentIndex: number;
  } | null>(null);
  const [deletePhotoConfirm, setDeletePhotoConfirm] = useState<{
    show: boolean;
    spaceId: string;
    photoUrl: string;
  }>({ show: false, spaceId: "", photoUrl: "" });

  const confirmDelete = (spaceId: string, serviceName: string) => {
    setDeleteConfirm({ show: true, id: spaceId, serviceName });
  };

  const handleDelete = async (spaceId: string) => {
    try {
      const res = await adminFetch(`/api/admin/bookings/${spaceId}`, {
        method: "DELETE"
      });
      if (res.ok) {
        fetchSpaces();
      }
    } catch (error) {
      console.error("Failed to delete booking:", error);
    } finally {
      setDeleteConfirm({ show: false, id: null, serviceName: "" });
    }
  };

  const handleDeletePhoto = async () => {
    if (!deletePhotoConfirm.spaceId || !deletePhotoConfirm.photoUrl) return;
    const { spaceId, photoUrl } = deletePhotoConfirm;

    try {
      const res = await adminFetch(`/api/admin/bookings/${spaceId}/delete-photo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoUrl }),
      });

      if (res.ok) {
        const data = await res.json();
        // Update local spaces state with new comments
        setSpaces(prev => prev.map(space => space.id === spaceId ? { ...space, comments: data.comments } : space));
        
        // Update photoModal state
        if (photoModal && photoModal.spaceId === spaceId) {
          const normTarget = photoUrl.trim().toLowerCase();
          const remainingPhotos = photoModal.photos.filter(p => p.trim().toLowerCase() !== normTarget);
          if (remainingPhotos.length === 0) {
            setPhotoModal(null);
          } else {
            const newIndex = Math.min(photoModal.currentIndex, remainingPhotos.length - 1);
            setPhotoModal({
              ...photoModal,
              photos: remainingPhotos,
              currentIndex: newIndex,
            });
          }
        }
      }
    } catch (error) {
      console.error("Failed to delete photo:", error);
    } finally {
      setDeletePhotoConfirm({ show: false, spaceId: "", photoUrl: "" });
    }
  };

  useEffect(() => {
    const isAdmin = localStorage.getItem("isAdmin");
    if (!isAdmin) {
      setLocation("/admin");
      return;
    }
    fetchSpaces();
  }, []);

  const fetchSpaces = async () => {
    try {
      const [bookingsRes, usersRes, pincodesRes] = await Promise.all([
        adminFetch("/api/admin/bookings"),
        adminFetch("/api/admin/users"),
        adminFetch("/api/admin/pincodes"),
      ]);
      
      if (pincodesRes.ok) {
        const pincodesData = await pincodesRes.json();
        const mapping = new Map<string, string>();
        (pincodesData.pincodes || []).forEach((p: any) => {
          if (p.cityName && p.prefix) {
            mapping.set(p.cityName.toLowerCase(), p.prefix);
          }
        });
        setCityToStateMap(mapping);
      }

      if (bookingsRes.ok) {
        const bookingsData = await bookingsRes.json();
        const usersData = usersRes.ok ? await usersRes.json() : { users: [] };
        const userMap = new Map<string, { name: string; mobile: string }>();
        (usersData.users || []).forEach((u: any) => {
          userMap.set(u.id, { name: u.name, mobile: u.mobile });
        });

        const interestsRes = await adminFetch("/api/interests/counts");
        const interestsData = interestsRes.ok ? await interestsRes.json() : { counts: {} };

        const enrichedSpaces = (bookingsData.bookings || []).map((b: any) => ({
          ...b,
          customerName: userMap.get(b.customerId)?.name || "Unknown",
          customerMobile: userMap.get(b.customerId)?.mobile || "",
          interestCount: interestsData.counts?.[b.id] || 0,
        }));
        setSpaces(enrichedSpaces);
      }

      // Fetch Parking By allowed phones
      try {
        const allowedPhonesRes = await fetch(getApiUrl("/api/settings/parking_by_allowed_phones"));
        if (allowedPhonesRes.ok) {
          const d = await allowedPhonesRes.json();
          if (d.setting && d.setting.value !== undefined && d.setting.value !== null) {
            try {
              const parsed = JSON.parse(d.setting.value);
              if (Array.isArray(parsed)) {
                setAllowedParkingByPhones(parsed.map((p: string) => String(p).trim().replace(/\D/g, "").slice(-10)).filter(Boolean));
              }
            } catch {
              setAllowedParkingByPhones(["7829551049", "9742545584", "7338507767", "9180532078"]);
            }
          } else {
            setAllowedParkingByPhones(["7829551049", "9742545584", "7338507767", "9180532078"]);
          }
        }
      } catch (err) { }
    } catch (error) {
      console.error("Failed to fetch parking spaces:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("isAdmin");
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminLevel");
    setLocation("/admin");
  };

  const handleAddAllowedPhone = async () => {
    setPhoneError("");
    const clean = newAllowedPhone.trim().replace(/\D/g, "").slice(-10);
    if (!clean || clean.length !== 10) {
      setPhoneError("Please enter a valid 10-digit mobile number.");
      return;
    }
    if (allowedParkingByPhones.includes(clean)) {
      setPhoneError("This number is already in the allowed list.");
      return;
    }
    const updated = [...allowedParkingByPhones, clean];
    setAllowedParkingByPhones(updated);
    setNewAllowedPhone("");
    await saveAllowedParkingByPhones(updated);
  };

  const handleDeleteAllowedPhone = async (phoneToDelete: string) => {
    const updated = allowedParkingByPhones.filter((p) => p !== phoneToDelete);
    setAllowedParkingByPhones(updated);
    await saveAllowedParkingByPhones(updated);
  };

  const saveAllowedParkingByPhones = async (list: string[]) => {
    setIsSavingAllowedPhones(true);
    try {
      await adminFetch("/api/admin/settings", {
        method: "POST",
        body: JSON.stringify({
          key: "parking_by_allowed_phones",
          value: JSON.stringify(list),
          description: "Allowed phone numbers for Parking By (Owner / Spotly) field",
        }),
      });
    } catch (err) {
      console.error("Error saving allowed phones:", err);
    } finally {
      setIsSavingAllowedPhones(false);
    }
  };

  const getSpaceState = (space: ParkingSpace) => {
    if (!space.city) return "";
    return cityToStateMap.get(space.city.toLowerCase()) || "";
  };

  const cities = Array.from(new Set(spaces.map(s => s.city).filter(Boolean))) as string[];
  const states = Array.from(new Set(spaces.map(s => getSpaceState(s)).filter(Boolean))) as string[];
  const statuses = Array.from(new Set(spaces.map(s => s.status).filter(Boolean))) as string[];

  const isSpotlyView = location === "/admin/spotly-spaces";

  const filteredSpaces = spaces.filter(space => {
    if (isSpotlyView && !isSpotlySpace(space.comments)) return false;
    if (!isSpotlyView && isSpotlySpace(space.comments)) return false;

    const matchesSearch = searchQuery === "" || 
      space.serviceName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      space.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      space.customerName?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCity = cityFilter === "" || space.city === cityFilter;
    const matchesState = stateFilter === "" || getSpaceState(space) === stateFilter;
    const matchesStatus = statusFilter === "" || space.status === statusFilter;
    return matchesSearch && matchesCity && matchesState && matchesStatus;
  });

  const navItems = [
    { label: "Dashboard", path: "/admin/dashboard", icon: TrendingUp },
    { label: "Parking Types", path: "/admin/services", icon: Briefcase },
    { label: "Service States", path: "/admin/pincodes", icon: Globe },
    { label: "Space Providers", path: "/admin/customers", icon: Users },
    { label: "Space Seekers", path: "/admin/workers", icon: Users },
    { label: "By Owner Space", path: "/admin/bookings", icon: Car, active: !isSpotlyView },
    { label: "By Spotly Space", path: "/admin/spotly-spaces", icon: Navigation, active: isSpotlyView },
    { label: "Settings", path: "/admin/settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-neutral-100">
      <header
        className="text-white px-6 py-4 shadow-lg"
        style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #3b2fad 35%, #6d28d9 70%, #7c3aed 100%)" }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Spotly" className="h-9 w-auto object-contain" />
            <div>
              <h1 className="text-xl font-bold" data-testid="text-admin-title">Spotly Admin</h1>
              <p className="text-sm text-white/70">
                {isSpotlyView ? "Spotly Public Roadside Spaces Management" : "Private Space Owner Listings Management"}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            onClick={() => setShowLogoutConfirm(true)}
            className="text-white hover:bg-white/20"
            data-testid="button-logout"
          >
            <LogOut size={18} className="mr-2" />
            Logout
          </Button>
        </div>
      </header>

      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 cursor-pointer" onClick={() => setShowLogoutConfirm(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-sm mx-4 shadow-xl cursor-default" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-neutral-900 mb-2">Confirm Logout</h3>
            <p className="text-neutral-600 mb-6">Are you sure you want to logout from the admin panel?</p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowLogoutConfirm(false)} data-testid="button-cancel-logout">
                Cancel
              </Button>
              <Button className="flex-1 bg-red-600 hover:bg-red-700" onClick={handleLogout} data-testid="button-confirm-logout">
                Logout
              </Button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
  isOpen={deleteConfirm.show}
  title="Delete Parking Space"
  message="Are you sure you want to delete this parking space?"
  onConfirm={() => deleteConfirm.id && handleDelete(deleteConfirm.id)}
  onCancel={() => setDeleteConfirm({ show: false, id: null, serviceName: "" })}
/>

      <ConfirmDialog
        isOpen={deletePhotoConfirm.show}
        title="Delete Individual Photo"
        message="Are you sure you want to delete this photo from the parking space listing? This action cannot be undone."
        confirmText="Delete Photo"
        cancelText="Cancel"
        variant="danger"
        doubleConfirm={true}
        secondTitle="Permanently delete this photo?"
        secondMessage="Are you sure you want to permanently remove this photo from the parking space listing?"
        secondConfirmText="Yes, Delete Photo"
        onConfirm={handleDeletePhoto}
        onCancel={() => setDeletePhotoConfirm({ show: false, spaceId: "", photoUrl: "" })}
      />

      {showAllowedPhonesModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 cursor-pointer"
          onClick={() => setShowAllowedPhonesModal(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl cursor-default animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
                  <Phone size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Allowed Phone Numbers ({allowedParkingByPhones.length})
                  </h3>
                  <p className="text-xs text-slate-500">
                    Only these numbers can see &quot;Parking By (Instant Owner / Spotly)&quot;
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAllowedPhonesModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Add Number Input */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-5">
              <Label className="text-xs font-bold text-slate-700 mb-1.5 block">
                Add New Allowed Phone Number
              </Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                    +91
                  </span>
                  <Input
                    type="tel"
                    maxLength={10}
                    placeholder="Enter 10-digit number"
                    value={newAllowedPhone}
                    onChange={(e) => {
                      setPhoneError("");
                      setNewAllowedPhone(e.target.value.replace(/\D/g, "").slice(0, 10));
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddAllowedPhone();
                      }
                    }}
                    className="pl-12 bg-white font-semibold"
                  />
                </div>
                <Button
                  type="button"
                  onClick={handleAddAllowedPhone}
                  disabled={isSavingAllowedPhones || !newAllowedPhone.trim()}
                  className="bg-[#3b2fad] hover:bg-[#322794] text-white shrink-0 font-bold"
                >
                  {isSavingAllowedPhones ? (
                    <Loader2 size={16} className="animate-spin mr-1.5" />
                  ) : (
                    <Plus size={16} className="mr-1.5" />
                  )}
                  Add
                </Button>
              </div>
              {phoneError && (
                <p className="text-xs font-semibold text-red-600 mt-2 flex items-center gap-1">
                  <AlertCircle size={14} />
                  {phoneError}
                </p>
              )}
            </div>

            {/* Allowed Numbers List */}
            <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5 block">
              Configured Allowed Numbers
            </Label>
            <div className="max-h-60 overflow-y-auto space-y-2 pr-1 mb-6">
              {allowedParkingByPhones.map((phone) => (
                <div
                  key={phone}
                  className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl hover:border-indigo-200"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                      <Phone size={14} />
                    </div>
                    <span className="text-sm font-bold text-slate-900 font-mono">
                      +91 {phone}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteAllowedPhone(phone)}
                    disabled={isSavingAllowedPhones}
                    title="Delete number"
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex justify-end">
              <Button
                variant="outline"
                onClick={() => setShowAllowedPhonesModal(false)}
                className="cursor-pointer"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto p-6">
        <nav className="flex gap-2 mb-6 overflow-x-auto pb-2 scroll-smooth no-scrollbar">
          {navItems.map((item) => (
            <Button
              key={item.path}
              variant={item.active ? "default" : "outline"}
              onClick={() => setLocation(item.path)}
              className={`rounded-full whitespace-nowrap text-xs sm:text-sm px-3.5 sm:px-4 h-9 shrink-0 shadow-2xs ${item.active ? "text-white shadow-md border-0" : ""}`}
              style={item.active ? { background: "linear-gradient(135deg, #1e3a8a 0%, #3b2fad 35%, #6d28d9 70%, #7c3aed 100%)" } : undefined}
              data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
            >
              <item.icon size={15} className="mr-1.5" />
              {item.label}
            </Button>
          ))}
        </nav>

        <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4 mb-6">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-xl font-bold text-neutral-800" data-testid="text-page-title">
              {isSpotlyView ? `By Spotly Spaces (${filteredSpaces.length})` : `By Owner Spaces (${filteredSpaces.length})`}
            </h2>
            {isSpotlyView && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAllowedPhonesModal(true)}
                className="bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100 font-semibold gap-1.5 cursor-pointer shadow-xs"
              >
                <Phone size={14} />
                Manage Allowed Numbers ({allowedParkingByPhones.length})
              </Button>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center flex-wrap">
            <div className="relative flex-1 sm:w-64">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder="Search by type, location, provider..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-full border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white"
                data-testid="input-search"
              />
            </div>
            <div className="relative flex-1 sm:w-auto">
              <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
              <select
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                className="w-full sm:w-auto pl-9 pr-8 py-2 rounded-full border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none bg-white cursor-pointer"
                data-testid="select-city-filter"
              >
                <option value="">All Cities</option>
                {cities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>
            <div className="relative flex-1 sm:w-auto">
              <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
              <select
                value={stateFilter}
                onChange={(e) => setStateFilter(e.target.value)}
                className="w-full sm:w-auto pl-9 pr-8 py-2 rounded-full border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none bg-white cursor-pointer"
                data-testid="select-state-filter"
              >
                <option value="">All States</option>
                {states.map(state => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredSpaces.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center">
            <Car className="w-16 h-16 mx-auto mb-4 text-neutral-300" />
            <h3 className="text-lg font-bold text-neutral-900 mb-2" data-testid="text-empty-title">No Parking Spaces Found</h3>
            <p className="text-neutral-500" data-testid="text-empty-message">No parking spaces match your search criteria</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full" data-testid="table-parking-spaces">
                <thead className="bg-neutral-50 border-b">
                  <tr>
                    <th className="text-left p-4 font-semibold text-neutral-600 text-sm">Parking Type</th>
                    <th className="text-left p-4 font-semibold text-neutral-600 text-sm">Location</th>
                    <th className="text-left p-4 font-semibold text-neutral-600 text-sm">Rent</th>
                    <th className="text-left p-4 font-semibold text-neutral-600 text-sm">Description</th>
                    <th className="text-left p-4 font-semibold text-neutral-600 text-sm">Photos</th>
                    <th className="text-left p-4 font-semibold text-neutral-600 text-sm">Posted By</th>
                    <th className="text-left p-4 font-semibold text-neutral-600 text-sm">Mobile</th>
                    <th className="text-left p-4 font-semibold text-neutral-600 text-sm">Date Posted</th>
                    <th className="text-left p-4 font-semibold text-neutral-600 text-sm">Interests</th>
                    <th className="text-center p-4 font-semibold text-neutral-600 text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredSpaces.map((space) => {
                    const parsed = parseComments(space.comments);
                    return (
                      <tr key={space.id} className="hover:bg-neutral-50" data-testid={`row-space-${space.id}`}>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <Car size={16} className="text-primary shrink-0" />
                            <span className="font-medium text-neutral-900 text-sm" data-testid={`text-type-${space.id}`}>{space.serviceName}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-start gap-1 text-neutral-600 max-w-[200px]">
                            <MapPin size={14} className="shrink-0 mt-0.5" />
                            <span className="text-sm leading-snug" data-testid={`text-location-${space.id}`}>{space.location}</span>
                          </div>
                          {space.city && (
                            <p className="text-xs text-neutral-400 mt-1 ml-5">{space.city}</p>
                          )}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-1">
                            <IndianRupee size={14} className="text-green-600 shrink-0" />
                            <span className="font-semibold text-green-700 text-sm" data-testid={`text-rent-${space.id}`}>
                              {parsed.rent ? `${parsed.rent}/mo` : "N/A"}
                            </span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="max-w-[180px]">
                            <span className="text-sm text-neutral-600 line-clamp-2" data-testid={`text-description-${space.id}`}>
                              {parsed.description || "No description"}
                            </span>
                          </div>
                        </td>
                        <td className="p-4">
                          {parsed.photos.length > 0 ? (
                            <div
                              onClick={() => setPhotoModal({ spaceId: space.id, photos: parsed.photos, currentIndex: 0 })}
                              className="relative group w-12 h-12 rounded-xl overflow-hidden border border-neutral-200 cursor-pointer shadow-sm hover:border-primary hover:shadow-md transition shrink-0 inline-flex items-center justify-center bg-neutral-100"
                              data-testid={`thumb-photo-${space.id}`}
                            >
                              <img src={parsed.photos[0]} alt="Cover Photo" className="w-full h-full object-cover group-hover:scale-110 transition duration-200" />
                              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                <Search size={14} className="text-white" />
                              </div>
                              {parsed.photos.length > 1 && (
                                <div className="absolute bottom-0 right-0 bg-primary text-white font-bold text-[10px] px-1.5 py-0.5 rounded-tl-md shadow-sm">
                                  +{parsed.photos.length - 1}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-neutral-400 text-xs italic">
                              <ImageIcon size={14} />
                              <span>No photos</span>
                            </div>
                          )}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-1.5">
                            <User size={14} className="text-neutral-400 shrink-0" />
                            <span className="font-medium text-neutral-900 text-sm" data-testid={`text-provider-${space.id}`}>
                              {space.customerName || "Unknown"}
                            </span>
                            {/* Show mobile number for Spotly spaces */}
                            {space.customerMobile && (
                              <span className="text-sm text-neutral-600 font-mono ml-2" data-testid={`text-provider-mobile-${space.id}`}>
                                {space.customerMobile}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-1.5">
                            <Phone size={14} className="text-neutral-400 shrink-0" />
                            <span className="text-sm text-neutral-600 font-mono" data-testid={`text-mobile-${space.id}`}>
                              {space.customerMobile || "N/A"}
                            </span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-1 text-neutral-600">
                            <Calendar size={14} className="shrink-0" />
                            <span className="text-sm whitespace-nowrap" data-testid={`text-date-${space.id}`}>
                              {new Date(space.bookedAt).toLocaleDateString()}
                            </span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-1 text-pink-600">
                            <Heart size={14} />
                            <span className="font-medium" data-testid={`text-interests-${space.id}`}>
                              {space.interestCount ?? 0}
                            </span>
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => confirmDelete(space.id, space.serviceName)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            data-testid={`button-delete-space-${space.id}`}
                          >
                            <Trash2 size={16} />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Photo Viewer Modal */}
      {photoModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm p-4 animate-in fade-in duration-200 cursor-pointer" onClick={() => setPhotoModal(null)}>
          <div className="bg-neutral-900 text-white rounded-2xl max-w-3xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh] cursor-default" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-900/90">
              <div className="flex items-center gap-2">
                <ImageIcon size={18} className="text-primary" />
                <span className="font-semibold text-sm text-neutral-200">
                  Image {photoModal.currentIndex + 1} of {photoModal.photos.length}
                </span>
              </div>

              {/* Action Buttons on top of image modal */}
              <div className="flex items-center gap-3">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setDeletePhotoConfirm({
                    show: true,
                    spaceId: photoModal.spaceId,
                    photoUrl: photoModal.photos[photoModal.currentIndex]
                  })}
                  className="bg-red-600 hover:bg-red-700 text-white gap-1.5 rounded-lg text-xs font-semibold px-3 py-1.5 shadow-sm"
                  data-testid="button-delete-photo-modal"
                >
                  <Trash2 size={14} />
                  Delete Photo
                </Button>
                <button
                  onClick={() => setPhotoModal(null)}
                  className="text-neutral-400 hover:text-white p-1.5 rounded-full hover:bg-neutral-800 transition"
                  data-testid="button-close-photo-modal"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Modal Body - Photo Display */}
            <div className="relative flex-1 bg-black flex items-center justify-center min-h-[300px] max-h-[70vh] p-4 group">
              <img
                src={photoModal.photos[photoModal.currentIndex]}
                alt={`Space Photo ${photoModal.currentIndex + 1}`}
                className="max-h-[65vh] max-w-full object-contain rounded-lg shadow-lg select-none"
              />

              {/* Previous / Next Navigation Buttons */}
              {photoModal.photos.length > 1 && (
                <>
                  <button
                    onClick={() => setPhotoModal({
                      ...photoModal,
                      currentIndex: (photoModal.currentIndex - 1 + photoModal.photos.length) % photoModal.photos.length
                    })}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white p-2.5 rounded-full backdrop-blur-md transition border border-white/10"
                    title="Previous Image"
                    data-testid="button-prev-photo"
                  >
                    <ChevronLeft size={22} />
                  </button>
                  <button
                    onClick={() => setPhotoModal({
                      ...photoModal,
                      currentIndex: (photoModal.currentIndex + 1) % photoModal.photos.length
                    })}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white p-2.5 rounded-full backdrop-blur-md transition border border-white/10"
                    title="Next Image"
                    data-testid="button-next-photo"
                  >
                    <ChevronRight size={22} />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnail Strip Footer */}
            {photoModal.photos.length > 1 && (
              <div className="flex items-center justify-center gap-2 p-3 bg-neutral-950 border-t border-neutral-800 overflow-x-auto">
                {photoModal.photos.map((photo, idx) => (
                  <button
                    key={idx}
                    onClick={() => setPhotoModal({ ...photoModal, currentIndex: idx })}
                    className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition ${
                      idx === photoModal.currentIndex ? "border-primary scale-105" : "border-transparent opacity-50 hover:opacity-100"
                    }`}
                  >
                    <img src={photo} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

