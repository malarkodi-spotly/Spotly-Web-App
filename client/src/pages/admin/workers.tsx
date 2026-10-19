import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adminFetch } from "@/lib/api-config";
import {
  Globe,
  MapPin,
  Users,
  LogOut,
  TrendingUp,
  Calendar,
  Briefcase,
  Pencil,
  Trash2,
  X,
  Check,
  Phone,
  Search,
  Settings,
  Download,
  Crown,
  Loader2,
  Car,
  Navigation,
} from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import logo from "@assets/Logos/spotly_full-white.png";
import * as XLSX from "xlsx";

interface SeekerData {
  id: string;
  name: string;
  mobile: string;
  email: string | null;
  isPremium: boolean;
  premiumActivatedAt: string | null;
  city: string | null;
  createdAt?: string | null;
  amountPaid?: number | null;
  paymentDate?: string | null;
  paymentReference?: string | null;
}

interface SeekerProfile {
  id: string;
  userId: string;
  location: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  mobile: string | null;
  whatsapp: string | null;
}

interface City {
  id: string;
  name: string;
  state: string;
}

export default function AdminWorkers() {
  const [, setLocation] = useLocation();
  const [seekers, setSeekers] = useState<SeekerData[]>([]);
  const [profiles, setProfiles] = useState<Map<string, SeekerProfile>>(new Map());
  const [cities, setCities] = useState<City[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showSeekerModal, setShowSeekerModal] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; id: string | null; name: string }>({ show: false, id: null, name: "" });
  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    email: "",
    city: "",
    whatsapp: ""
  });
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [isDeletingBulk, setIsDeletingBulk] = useState(false);

  useEffect(() => {
    const isAdmin = localStorage.getItem("isAdmin");
    const adminLevel = localStorage.getItem("adminLevel");
    if (!isAdmin) {
      setLocation("/admin");
      return;
    }
    setIsSuperAdmin(adminLevel === "super");
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [usersRes, citiesRes] = await Promise.all([
        adminFetch("/api/admin/users"),
        adminFetch("/api/admin/cities")
      ]);

      if (usersRes.ok) {
        const data = await usersRes.json();
        const seekerList = (data.users || []).filter((u: SeekerData & { role: string }) => u.role === "worker");
        setSeekers(seekerList);

        const profileMap = new Map<string, SeekerProfile>();
        (data.workerProfiles || []).forEach((p: SeekerProfile) => {
          profileMap.set(p.userId, p);
        });
        setProfiles(profileMap);
      }

      if (citiesRes.ok) {
        const data = await citiesRes.json();
        setCities(data.cities || []);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
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

  const handleAdd = async () => {
    try {
      const res = await adminFetch("/api/admin/workers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          whatsapp: formData.whatsapp || formData.mobile
        })
      });
      if (res.ok) {
        fetchData();
        setShowSeekerModal(false);
        resetForm();
      }
    } catch (error) {
      console.error("Failed to add space seeker:", error);
    }
  };

  const openAddModal = () => {
    resetForm();
    setEditingId(null);
    setModalMode("add");
    setShowSeekerModal(true);
  };

  const closeModal = () => {
    setShowSeekerModal(false);
    setEditingId(null);
    resetForm();
  };

  const handleUpdate = async (userId: string) => {
    try {
      const res = await adminFetch(`/api/admin/workers/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email || null,
          city: formData.city,
          mobile: formData.mobile,
          whatsapp: formData.whatsapp || formData.mobile
        })
      });
      if (res.ok) {
        fetchData();
        setShowSeekerModal(false);
        setEditingId(null);
        resetForm();
      }
    } catch (error) {
      console.error("Failed to update space seeker:", error);
    }
  };

  const handleDelete = async (userId: string) => {
    try {
      const res = await adminFetch(`/api/admin/workers/${userId}`, {
        method: "DELETE"
      });
      if (res.ok) {
        fetchData();
        setSelectedUserIds(prev => prev.filter(i => i !== userId));
      }
    } catch (error) {
      console.error("Failed to delete space seeker:", error);
    } finally {
      setDeleteConfirm({ show: false, id: null, name: "" });
    }
  };

  const handleToggleSelectAll = () => {
    if (selectedUserIds.length === filteredSeekers.length) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(filteredSeekers.map(s => s.id));
    }
  };

  const handleToggleSelectSeeker = (id: string) => {
    setSelectedUserIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    if (selectedUserIds.length === 0) return;
    setIsDeletingBulk(true);
    try {
      const res = await adminFetch("/api/admin/users/bulk-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userIds: selectedUserIds }),
      });
      if (res.ok) {
        fetchData();
        setSelectedUserIds([]);
      }
    } catch (error) {
      console.error("Failed to bulk delete space seekers:", error);
    } finally {
      setIsDeletingBulk(false);
      setShowBulkDeleteConfirm(false);
    }
  };

  const confirmDelete = (userId: string, name: string) => {
    setDeleteConfirm({ show: true, id: userId, name });
  };

  const startEdit = (seeker: SeekerData) => {
    const profile = profiles.get(seeker.id);
    setEditingId(seeker.id);
    setFormData({
      name: seeker.name,
      mobile: profile?.mobile || seeker.mobile,
      email: seeker.email || "",
      city: profile?.city || seeker.city || "",
      whatsapp: profile?.whatsapp || ""
    });
    setModalMode("edit");
    setShowSeekerModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: "", mobile: "", email: "", city: "", whatsapp: ""
    });
  };

  const getCityName = (cityId: string | null) => {
    if (!cityId) return null;
    const city = cities.find(c => c.id === cityId);
    return city?.name || cityId;
  };

  const formatDateTime = (dateStr: string | null | undefined) => {
    if (!dateStr) return "-";
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      return date.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return dateStr;
    }
  };

  const seekersWithDisplayIds = [...seekers]
    .sort((a, b) => (a.createdAt ? new Date(a.createdAt).getTime() : 0) - (b.createdAt ? new Date(b.createdAt).getTime() : 0))
    .map((s, index) => ({
      ...s,
      displayId: `SS-${index + 1}`
    }));

  const filteredSeekers = seekersWithDisplayIds.filter(seeker => {
    const query = searchQuery.toLowerCase();
    const profile = profiles.get(seeker.id);

    const matchesSearch = !searchQuery ||
      seeker.name.toLowerCase().includes(query) ||
      seeker.mobile.includes(query) ||
      seeker.displayId.toLowerCase().includes(query);

    const seekerCity = profile?.city || seeker.city;
    const matchesCity = !cityFilter ||
      (seekerCity && seekerCity === cityFilter);

    return matchesSearch && matchesCity;
  }).sort((a, b) => {
    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return dateB - dateA;
  });

  const exportToExcel = () => {
    const exportData = filteredSeekers.map(seeker => {
      const profile = profiles.get(seeker.id);
      return {
        "ID": seeker.displayId,
        "Name": seeker.name && seeker.name !== "User" ? seeker.name : `User (${seeker.mobile})`,
        "Mobile": profile?.mobile || seeker.mobile,
        "Email": seeker.email || "-",
        "City": (profile?.city || seeker.city) ? getCityName(profile?.city || seeker.city) : "-",
        "Registration Date & Time": formatDateTime(seeker.createdAt),
        "Premium Status": seeker.isPremium ? "Active" : "Inactive",
        "Premium Activated": seeker.premiumActivatedAt ? formatDateTime(seeker.premiumActivatedAt) : "-",
        "WhatsApp": profile?.whatsapp || "-"
      };
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Space Seekers");
    XLSX.writeFile(wb, `space_seekers_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const navItems = [
    { label: "Dashboard", path: "/admin/dashboard", icon: TrendingUp },
    { label: "Parking Types", path: "/admin/services", icon: Briefcase },
    { label: "Service States", path: "/admin/pincodes", icon: Globe },
    { label: "Space Providers", path: "/admin/customers", icon: Users },
    { label: "Space Seekers", path: "/admin/workers", icon: Users, active: true },
    { label: "By Owner Space", path: "/admin/bookings", icon: Car },
    { label: "By Spotly Space", path: "/admin/spotly-spaces", icon: Navigation },
    { label: "Settings", path: "/admin/settings", icon: Settings },
  ];

  const SeekerFormContent = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-neutral-700 mb-1 block">Name *</label>
          <Input placeholder="Space Seeker name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} data-testid="input-seeker-name" />
        </div>
        <div>
          <label className="text-sm font-medium text-neutral-700 mb-1 block">Mobile (10 digits) *</label>
          <Input placeholder="10 digit mobile" value={formData.mobile} onChange={(e) => setFormData({ ...formData, mobile: e.target.value })} data-testid="input-seeker-mobile" />
        </div>
        <div>
          <label className="text-sm font-medium text-neutral-700 mb-1 block">WhatsApp</label>
          <Input placeholder="WhatsApp number" value={formData.whatsapp} onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })} />
        </div>
        <div>
          <label className="text-sm font-medium text-neutral-700 mb-1 block">Email</label>
          <Input placeholder="Email address" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
        </div>
        <div>
          <label className="text-sm font-medium text-neutral-700 mb-1 block">City</label>
          <select
            className="w-full border rounded-md px-3 py-2"
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
          >
            <option value="">Select City</option>
            {cities.map(city => (
              <option key={city.id} value={city.id}>{city.name}</option>
            ))}
          </select>
        </div>
      </div>

      {(!formData.name || !formData.mobile) && (
        <p className="text-red-500 text-sm">* Name and Mobile are required</p>
      )}
      {formData.mobile && formData.mobile.length !== 10 && (
        <p className="text-red-500 text-sm">* Mobile must be 10 digits</p>
      )}

      <div className="flex gap-3 pt-4 border-t">
        <Button
          onClick={() => modalMode === "add" ? handleAdd() : editingId && handleUpdate(editingId)}
          disabled={!formData.name || !formData.mobile || formData.mobile.length !== 10}
          className="flex-1"
          data-testid="button-save-seeker"
        >
          <Check size={16} className="mr-2" />
          {modalMode === "add" ? "Add Space Seeker" : "Update Space Seeker"}
        </Button>
        <Button variant="outline" onClick={closeModal} className="flex-1">
          <X size={16} className="mr-2" />
          Cancel
        </Button>
      </div>
    </div>
  );

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
              <h1 className="text-xl font-bold">Spotly Admin</h1>
              <p className="text-sm text-white/70">Space Seeker Management</p>
            </div>
          </div>
          <Button variant="ghost" onClick={() => setShowLogoutConfirm(true)} className="text-white hover:bg-white/20">
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
              <Button variant="outline" className="flex-1" onClick={() => setShowLogoutConfirm(false)}>
                Cancel
              </Button>
              <Button className="flex-1 bg-red-600 hover:bg-red-700" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={deleteConfirm.show}
        title="Delete Space Seeker"
        message={`Are you sure you want to delete ${deleteConfirm.name}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        doubleConfirm={true}
        secondTitle={`Permanently delete ${deleteConfirm.name}?`}
        secondMessage={`Are you completely sure? This will permanently delete the Space Seeker account for "${deleteConfirm.name}", along with their vehicle records, contact history, and saved items.`}
        secondConfirmText="Yes, Permanently Delete"
        onConfirm={() => deleteConfirm.id && handleDelete(deleteConfirm.id)}
        onCancel={() => setDeleteConfirm({ show: false, id: null, name: "" })}
      />

      <Dialog open={showSeekerModal} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {modalMode === "add" ? "Add New Space Seeker" : "Edit Space Seeker"}
            </DialogTitle>
          </DialogHeader>
          <SeekerFormContent />
        </DialogContent>
      </Dialog>

      <div className="max-w-7xl mx-auto p-6">
        <nav className="flex gap-2 mb-6 overflow-x-auto pb-2 scroll-smooth no-scrollbar">
          {navItems.map((item) => (
            <Button
              key={item.path}
              variant={item.active ? "default" : "outline"}
              onClick={() => setLocation(item.path)}
              className={`rounded-full whitespace-nowrap text-xs sm:text-sm px-3.5 sm:px-4 h-9 shrink-0 shadow-2xs ${item.active ? "text-white shadow-md border-0" : ""}`}
              style={item.active ? { background: "linear-gradient(135deg, #1e3a8a 0%, #3b2fad 35%, #6d28d9 70%, #7c3aed 100%)" } : undefined}
              data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <item.icon size={15} className="mr-1.5" />
              {item.label}
            </Button>
          ))}
        </nav>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-neutral-800" data-testid="text-seekers-count">Space Seekers ({filteredSeekers.length})</h2>
            {selectedUserIds.length > 0 && (
              <Button
                variant="destructive"
                onClick={() => setShowBulkDeleteConfirm(true)}
                className="bg-red-600 hover:bg-red-700 whitespace-nowrap h-9 text-sm"
                data-testid="button-bulk-delete-seekers"
              >
                <Trash2 size={15} className="mr-1.5" />
                Delete Selected ({selectedUserIds.length})
              </Button>
            )}
          </div>
          <div className="flex flex-col sm:flex-row flex-wrap gap-3 w-full md:w-auto">
            <div className="relative flex-1 w-full md:w-56">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
              <Input
                placeholder="Search by name, ID or mobile..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full"
                data-testid="input-search-seekers"
              />
            </div>
            <select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="border border-neutral-200 rounded-lg px-3 py-2 bg-white text-sm min-w-[140px] w-full sm:w-auto cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20"
              data-testid="select-city-filter"
            >
              <option value="">All Cities</option>
              {cities.map(city => (
                <option key={city.id} value={city.id}>{city.name}</option>
              ))}
            </select>
            <Button
              onClick={exportToExcel}
              variant="outline"
              className="w-full sm:w-auto"
              data-testid="button-export-seekers"
            >
              <Download size={16} className="mr-2" />
              Export Excel
            </Button>
            <Button onClick={openAddModal} data-testid="button-add-seeker">
              <Users size={16} className="mr-2" />
              Add Space Seeker
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredSeekers.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center">
            <Users className="w-16 h-16 mx-auto mb-4 text-neutral-300" />
            <h3 className="text-lg font-bold text-neutral-900 mb-2">No Space Seekers Found</h3>
            <p className="text-neutral-500">
              {searchQuery || cityFilter
                ? "No space seekers match your filters"
                : "No space seekers have registered yet"}
            </p>
            {(searchQuery || cityFilter) && (
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => { setSearchQuery(""); setCityFilter(""); }}
              >
                Clear Filters
              </Button>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-neutral-50 border-b">
                  <tr>
                    <th className="p-4 w-12 text-center">
                      <input
                        type="checkbox"
                        checked={filteredSeekers.length > 0 && selectedUserIds.length === filteredSeekers.length}
                        onChange={handleToggleSelectAll}
                        className="w-4 h-4 rounded border-neutral-300 text-primary focus:ring-primary cursor-pointer accent-primary"
                        title="Select all space seekers"
                        data-testid="checkbox-select-all-seekers"
                      />
                    </th>
                    <th className="text-left p-4 font-semibold text-neutral-600">Seeker ID</th>
                    <th className="text-left p-4 font-semibold text-neutral-600">Space Seeker Name</th>
                    <th className="text-left p-4 font-semibold text-neutral-600">Mobile</th>
                    <th className="text-left p-4 font-semibold text-neutral-600">City</th>
                    <th className="text-left p-4 font-semibold text-neutral-600">Registration Date &amp; Time</th>
                    <th className="text-left p-4 font-semibold text-neutral-600">Premium Status</th>
                    <th className="text-center p-4 font-semibold text-neutral-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredSeekers.map((seeker) => {
                    const profile = profiles.get(seeker.id);
                    return (
                      <tr key={seeker.id} className={`hover:bg-neutral-50 ${selectedUserIds.includes(seeker.id) ? 'bg-blue-50/50' : ''}`} data-testid={`row-seeker-${seeker.id}`}>
                        <td className="p-4 text-center">
                          <input
                            type="checkbox"
                            checked={selectedUserIds.includes(seeker.id)}
                            onChange={() => handleToggleSelectSeeker(seeker.id)}
                            className="w-4 h-4 rounded border-neutral-300 text-primary focus:ring-primary cursor-pointer accent-primary"
                            data-testid={`checkbox-select-seeker-${seeker.id}`}
                          />
                        </td>
                        <td className="p-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold font-mono bg-emerald-100/80 text-emerald-800 border border-emerald-200 shadow-2xs">
                            {seeker.displayId}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center font-bold text-emerald-700 text-sm border border-emerald-200">
                              {seeker.name && seeker.name !== "User" ? seeker.name.charAt(0).toUpperCase() : <Briefcase className="text-emerald-600" size={18} />}
                            </div>
                            <div>
                              <p className="font-semibold text-neutral-900 text-sm" data-testid={`text-seeker-name-${seeker.id}`}>
                                {seeker.name && seeker.name !== "User" ? seeker.name : `User (${seeker.mobile})`}
                              </p>
                              <p className="text-[11px] text-neutral-400">Ref: {seeker.id.slice(0, 8)}...</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2 text-neutral-600">
                            <Phone size={14} />
                            <span data-testid={`text-seeker-mobile-${seeker.id}`}>{profile?.mobile || seeker.mobile}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          {(profile?.city || seeker.city) ? (
                            <div className="flex items-center gap-2 text-neutral-600">
                              <MapPin size={14} className="text-neutral-500" />
                              <span data-testid={`text-seeker-city-${seeker.id}`}>{getCityName(profile?.city || seeker.city)}</span>
                            </div>
                          ) : profile?.location ? (
                            <div className="flex items-center gap-2 text-neutral-600">
                              <MapPin size={14} className="text-neutral-500" />
                              <span data-testid={`text-seeker-city-${seeker.id}`} className="truncate max-w-[150px] inline-block font-medium" title={profile.location}>
                                {profile.location}
                              </span>
                            </div>
                          ) : (
                            <span className="text-neutral-400">-</span>
                          )}
                        </td>
                        <td className="p-4 text-neutral-600 text-sm whitespace-nowrap" data-testid={`text-seeker-date-${seeker.id}`}>
                          {formatDateTime(seeker.createdAt)}
                        </td>
                        <td className="p-4">
                          {seeker.isPremium ? (
                            <div className="flex flex-col gap-1.5 align-middle">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-medium w-fit" data-testid={`badge-premium-${seeker.id}`}>
                                <Crown size={12} />
                                Active
                              </span>
                              {seeker.paymentDate || seeker.premiumActivatedAt ? (
                                <div className="text-[11px] text-neutral-500 space-y-0.5 font-sans leading-tight">
                                  <p className="font-bold text-green-700">
                                    Paid: ₹{seeker.amountPaid ? (seeker.amountPaid / 100).toFixed(2) : "299.00"}
                                  </p>
                                  <p className="text-[10px]">
                                    {new Date(seeker.paymentDate || seeker.premiumActivatedAt!).toLocaleDateString("en-IN", {
                                      day: "2-digit",
                                      month: "short",
                                      year: "numeric"
                                    })} at {new Date(seeker.paymentDate || seeker.premiumActivatedAt!).toLocaleTimeString("en-IN", {
                                      hour: "2-digit",
                                      minute: "2-digit"
                                    })}
                                  </p>
                                </div>
                              ) : null}
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-neutral-100 text-neutral-500 rounded-full text-xs font-medium" data-testid={`badge-premium-${seeker.id}`}>
                              Inactive
                            </span>
                          )}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => startEdit(seeker)}
                              className="w-8 h-8 rounded-lg border border-blue-300 bg-white text-blue-600 flex items-center justify-center hover:bg-blue-50 transition-colors"
                              data-testid={`button-edit-${seeker.id}`}
                              title="Edit Space Seeker"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              onClick={() => confirmDelete(seeker.id, seeker.name)}
                              className="w-8 h-8 rounded-lg border border-red-300 bg-white text-red-600 flex items-center justify-center hover:bg-red-50 transition-colors"
                              data-testid={`button-delete-${seeker.id}`}
                              title="Delete Space Seeker"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Bulk Delete Confirmation Dialog */}
        <ConfirmDialog
          isOpen={showBulkDeleteConfirm}
          title="Delete Selected Space Seekers"
          message={`Are you sure you want to delete ${selectedUserIds.length} selected space seeker${selectedUserIds.length > 1 ? "s" : ""}? This action cannot be undone.`}
          confirmText={`Delete (${selectedUserIds.length})`}
          cancelText="Cancel"
          variant="danger"
          doubleConfirm={true}
          secondTitle={`Permanently delete ${selectedUserIds.length} Space Seekers?`}
          secondMessage={`This will permanently remove all ${selectedUserIds.length} selected space seeker accounts and their associated records. This action cannot be reversed.`}
          secondConfirmText={`Yes, Delete ${selectedUserIds.length} Seekers`}
          onConfirm={handleBulkDelete}
          onCancel={() => setShowBulkDeleteConfirm(false)}
        />
      </div>
    </div>
  );
}
