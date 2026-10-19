import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adminFetch } from "@/lib/api-config";
import { Label } from "@/components/ui/label";
import { 
  Globe,
  MapPin, 
  Users, 
  LogOut,
  TrendingUp,
  Calendar,
  Briefcase,
  User,
  Phone,
  Search,
  Settings,
  Download,
  ParkingSquare,
  Pencil,
  Trash2,
  X,
  Save,
  Loader2,
  Car,
  Navigation,
} from "lucide-react";
import logo from "@assets/Logos/spotly_full-white.png";
import * as XLSX from "xlsx";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface UserData {
  id: string;
  name: string;
  email: string | null;
  mobile: string;
  role: string;
  city?: string | null;
  createdAt?: string | null;
  spacesPosted?: number;
}

interface City {
  id: string;
  name: string;
  isActive: boolean;
}

export default function AdminCustomers() {
  const [, setLocation] = useLocation();
  const [customers, setCustomers] = useState<UserData[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [selectedCity, setSelectedCity] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [editName, setEditName] = useState("");
  const [editCity, setEditCity] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [isDeletingBulk, setIsDeletingBulk] = useState(false);
  // Spotly employee configuration
  const [employeeMobileNumbers, setEmployeeMobileNumbers] = useState<string[]>([]);
  const [isSpaceOwnerMode, setIsSpaceOwnerMode] = useState<boolean>(false);

  useEffect(() => {
    const isAdmin = localStorage.getItem("isAdmin");
    const adminLevel = localStorage.getItem("adminLevel");
    if (!isAdmin) {
      setLocation("/admin");
      return;
    }
    setIsSuperAdmin(adminLevel === "super");
    fetchCustomers();
    fetchCities();
    // Load whitelisted employee mobile numbers
    const fetchEmployeeMobiles = async () => {
      try {
        const res = await adminFetch("/api/admin/employee-mobiles");
        if (res.ok) {
          const data = await res.json();
          setEmployeeMobileNumbers(data.mobiles || []);
        }
      } catch (e) {
        console.error("Failed to fetch employee mobiles:", e);
      }
    };
    fetchEmployeeMobiles();
  }, []);

  const fetchCities = async () => {
    try {
      const res = await adminFetch("/api/admin/cities");
      if (res.ok) {
        const data = await res.json();
        setCities(data.cities || []);
      }
    } catch (error) {
      console.error("Failed to fetch cities:", error);
    }
  };

  const fetchCustomers = async () => {
    try {
      const res = await adminFetch("/api/admin/users");
      if (res.ok) {
        const data = await res.json();
        const customerList = (data.users || []).filter((u: UserData) => u.role === "customer");
        setCustomers(customerList);
      }
    } catch (error) {
      console.error("Failed to fetch space providers:", error);
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

  const handleEdit = (customer: UserData) => {
    setEditingUser(customer);
    setEditName(customer.name);
    setEditCity(customer.city || "");
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;
    setIsSaving(true);
    try {
      const res = await adminFetch(`/api/admin/users/${editingUser.id}`, {
        method: "PATCH",
        body: JSON.stringify({ name: editName, city: editCity }),
      });
      if (res.ok) {
        setCustomers(prev => prev.map(c => c.id === editingUser.id ? { ...c, name: editName, city: editCity } : c));
        setEditingUser(null);
      }
    } catch (error) {
      console.error("Failed to update user:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await adminFetch(`/api/admin/users/${id}`, { method: "DELETE" });
      if (res.ok) {
        setCustomers(prev => prev.filter(c => c.id !== id));
        setSelectedUserIds(prev => prev.filter(i => i !== id));
      }
    } catch (error) {
      console.error("Failed to delete user:", error);
    } finally {
      setDeleteUserId(null);
    }
  };

  const handleToggleSelectAll = () => {
    if (selectedUserIds.length === filteredCustomers.length) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(filteredCustomers.map(c => c.id));
    }
  };

  const handleToggleSelectUser = (id: string) => {
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
        setCustomers(prev => prev.filter(c => !selectedUserIds.includes(c.id)));
        setSelectedUserIds([]);
      }
    } catch (error) {
      console.error("Failed to bulk delete space providers:", error);
    } finally {
      setIsDeletingBulk(false);
      setShowBulkDeleteConfirm(false);
    }
  };

  const customersWithDisplayIds = [...customers]
    .sort((a, b) => (a.createdAt ? new Date(a.createdAt).getTime() : 0) - (b.createdAt ? new Date(b.createdAt).getTime() : 0))
    .map((c, index) => ({
      ...c,
      displayId: `SP-${index + 1}`
    }));

  const filteredCustomers = customersWithDisplayIds.filter(customer => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = (
      customer.name.toLowerCase().includes(query) ||
      customer.mobile.includes(query) ||
      customer.displayId.toLowerCase().includes(query)
    );
    const matchesCity = selectedCity === "all" || customer.city === selectedCity;
    return matchesSearch && matchesCity;
  }).sort((a, b) => {
    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return dateB - dateA;
  });

  const formatDateTime = (dateStr?: string | null) => {
    if (!dateStr) return "-";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleString("en-IN", {
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

  const exportToExcel = () => {
    const exportData = filteredCustomers.map(customer => ({
      "ID": customer.displayId,
      "Name": customer.name && customer.name !== "User" ? customer.name : `User (${customer.mobile})`,
      "Mobile": customer.mobile,
      "City": customer.city || "-",
      "Registration Date & Time": formatDateTime(customer.createdAt),
      "Spaces Posted": customer.spacesPosted ?? 0
    }));
    
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Space Providers");
    XLSX.writeFile(wb, `space_providers_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const navItems = [
    { label: "Dashboard", path: "/admin/dashboard", icon: TrendingUp },
    { label: "Parking Types", path: "/admin/services", icon: Briefcase },
    { label: "Service States", path: "/admin/pincodes", icon: Globe },
    { label: "Space Providers", path: "/admin/customers", icon: Users, active: true },
    { label: "Space Seekers", path: "/admin/workers", icon: Users },
    { label: "By Owner Space", path: "/admin/bookings", icon: Car },
    { label: "By Spotly Space", path: "/admin/spotly-spaces", icon: Navigation },
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
              <h1 className="text-xl font-bold">Spotly Admin</h1>
              <p className="text-sm text-white/70">Space Provider Management</p>
            </div>
          </div>
          <Button
            variant="ghost"
            onClick={() => setShowLogoutConfirm(true)}
            className="text-white hover:bg-white/20"
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
            <h2 className="text-xl font-bold text-neutral-800" data-testid="text-page-title">Space Providers ({filteredCustomers.length})</h2>
            {selectedUserIds.length > 0 && (
              <Button
                variant="destructive"
                onClick={() => setShowBulkDeleteConfirm(true)}
                className="bg-red-600 hover:bg-red-700 whitespace-nowrap h-9 text-sm"
                data-testid="button-bulk-delete-providers"
              >
                <Trash2 size={15} className="mr-1.5" />
                Delete Selected ({selectedUserIds.length})
              </Button>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="relative flex-1 sm:flex-none">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="h-10 w-full sm:w-auto pl-10 pr-8 rounded-lg border border-neutral-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer min-w-[160px]"
                data-testid="select-city-filter"
              >
                <option value="all">All Cities</option>
                {cities.filter(c => c.isActive).map((city) => (
                  <option key={city.id} value={city.name}>{city.name}</option>
                ))}
              </select>
            </div>
            <div className="relative flex-1 w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
              <Input
                placeholder="Search by name, ID or mobile..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full"
                data-testid="input-search-providers"
              />
            </div>
            <Button 
              onClick={exportToExcel}
              variant="outline"
              className="whitespace-nowrap w-full sm:w-auto"
              data-testid="button-export-providers"
            >
              <Download size={16} className="mr-2" />
              Export Excel
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center">
            <Users className="w-16 h-16 mx-auto mb-4 text-neutral-300" />
            <h3 className="text-lg font-bold text-neutral-900 mb-2" data-testid="text-empty-title">No Space Providers Found</h3>
            <p className="text-neutral-500" data-testid="text-empty-message">
              {searchQuery ? "No space providers match your search" : "No space providers registered yet"}
            </p>
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
                        checked={filteredCustomers.length > 0 && selectedUserIds.length === filteredCustomers.length}
                        onChange={handleToggleSelectAll}
                        className="w-4 h-4 rounded border-neutral-300 text-primary focus:ring-primary cursor-pointer accent-primary"
                        title="Select all space providers"
                        data-testid="checkbox-select-all-providers"
                      />
                    </th>
                    <th className="text-left p-4 font-semibold text-neutral-600">Provider ID</th>
                    <th className="text-left p-4 font-semibold text-neutral-600">Space Provider Name</th>
                    <th className="text-left p-4 font-semibold text-neutral-600">Mobile</th>
                    <th className="text-left p-4 font-semibold text-neutral-600">City</th>
                    <th className="text-left p-4 font-semibold text-neutral-600">Registration Date &amp; Time</th>
                    <th className="text-left p-4 font-semibold text-neutral-600">Spaces Posted</th>
    
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredCustomers.map((customer) => (
                    <tr key={customer.id} className={`hover:bg-neutral-50 ${selectedUserIds.includes(customer.id) ? 'bg-blue-50/50' : ''}`} data-testid={`row-provider-${customer.id}`}>
                      <td className="p-4 text-center">
                        <input
                          type="checkbox"
                          checked={selectedUserIds.includes(customer.id)}
                          onChange={() => handleToggleSelectUser(customer.id)}
                          className="w-4 h-4 rounded border-neutral-300 text-primary focus:ring-primary cursor-pointer accent-primary"
                          data-testid={`checkbox-select-provider-${customer.id}`}
                        />
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold font-mono bg-blue-100/80 text-blue-800 border border-blue-200 shadow-2xs">
                          {customer.displayId}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-700 text-sm border border-blue-200">
                            {customer.name && customer.name !== "User" ? customer.name.charAt(0).toUpperCase() : <User className="text-blue-600" size={18} />}
                          </div>
                          <div>
                            <p className="font-semibold text-neutral-900 text-sm" data-testid={`text-provider-name-${customer.id}`}>
                              {customer.name && customer.name !== "User" ? customer.name : `User (${customer.mobile})`}
                            </p>
                            <p className="text-[11px] text-neutral-400">Ref: {customer.id.slice(0, 8)}...</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2 text-neutral-600">
                          <Phone size={14} />
                          <span data-testid={`text-provider-mobile-${customer.id}`}>{customer.mobile}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        {customer.city ? (
                          <div className="flex items-center gap-2 text-neutral-600">
                            <MapPin size={14} />
                            <span data-testid={`text-provider-city-${customer.id}`}>{customer.city}</span>
                          </div>
                        ) : (
                          <span className="text-neutral-400">-</span>
                        )}
                      </td>
                      <td className="p-4 text-neutral-600 text-sm whitespace-nowrap" data-testid={`text-provider-date-${customer.id}`}>
                        {formatDateTime(customer.createdAt)}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2 text-neutral-600">
                          <ParkingSquare size={14} />
                          <span data-testid={`text-provider-spaces-${customer.id}`}>{customer.spacesPosted ?? 0}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        {/* Action buttons hidden for Spotly employee UI */}
                        <div className="flex items-center gap-2 text-neutral-600">
                          <button
                            onClick={() => handleEdit(customer)}
                            className="w-8 h-8 rounded-lg border border-blue-300 bg-white text-blue-600 flex items-center justify-center hover:bg-blue-50 transition-colors"
                            data-testid={`button-edit-provider-${customer.id}`}
                            title="Edit Space Provider"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => setDeleteUserId(customer.id)}
                            className="w-8 h-8 rounded-lg border border-red-300 bg-white text-red-600 flex items-center justify-center hover:bg-red-50 transition-colors"
                            data-testid={`button-delete-provider-${customer.id}`}
                            title="Delete Space Provider"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>

                      
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {editingUser && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 cursor-pointer" onClick={() => setEditingUser(null)}>
            <div className="bg-white rounded-2xl p-6 max-w-md mx-4 shadow-xl w-full cursor-default" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-neutral-900">Edit Space Provider</h3>
                <button onClick={() => setEditingUser(null)} className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center hover:bg-neutral-200">
                  <X size={16} />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-neutral-700">Name</Label>
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="mt-1"
                    data-testid="input-edit-name"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-neutral-700">Mobile</Label>
                  <Input
                    value={editingUser.mobile}
                    disabled
                    className="mt-1 bg-neutral-50"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-neutral-700">City</Label>
                  <Input
                    value={editCity}
                    onChange={(e) => setEditCity(e.target.value)}
                    className="mt-1"
                    data-testid="input-edit-city"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <Button variant="outline" className="flex-1" onClick={() => setEditingUser(null)}>
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-[#0d3da8] hover:bg-[#092c7d]"
                  onClick={handleSaveEdit}
                  disabled={isSaving}
                  data-testid="button-save-edit"
                >
                  {isSaving ? <Loader2 size={16} className="animate-spin mr-2" /> : <Save size={16} className="mr-2" />}
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Single Delete Confirmation */}
        <ConfirmDialog
          isOpen={!!deleteUserId}
          title="Delete Provider"
          message="Confirm delete?"
          confirmText="Delete"
          onConfirm={() => deleteUserId && handleDelete(deleteUserId)}
          onCancel={() => setDeleteUserId(null)}
        />

        {/* Bulk Delete Confirmation */}
        <ConfirmDialog
          isOpen={showBulkDeleteConfirm}
          title="Delete Providers"
          message="Confirm bulk delete?"
          confirmText="Delete"
          onConfirm={handleBulkDelete}
          onCancel={() => setShowBulkDeleteConfirm(false)}
        />
      </div>
    </div>
  );
}
