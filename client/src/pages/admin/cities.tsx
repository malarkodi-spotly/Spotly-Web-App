import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { adminFetch } from "@/lib/api-config";
import { 
  Globe,
  MapPin, 
  Plus, 
  Pencil, 
  Trash2, 
  LogOut,
  TrendingUp,
  Users,
  Calendar,
  Briefcase,
  MessageSquare,
  Settings,
  Car,
  Navigation,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Switch } from "@/components/ui/switch";
import logo from "@assets/Logos/spotly_full-white.png";

interface City {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  isActive: boolean;
}

export default function AdminCities() {
  const [, setLocation] = useLocation();
  const [cities, setCities] = useState<City[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingCity, setEditingCity] = useState<City | null>(null);
  const [formData, setFormData] = useState({ name: "", latitude: "", longitude: "" });
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; id: string | null; name: string }>({ show: false, id: null, name: "" });

  useEffect(() => {
    const isAdmin = localStorage.getItem("isAdmin");
    if (!isAdmin) {
      setLocation("/admin");
      return;
    }
    fetchCities();
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
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCity = async () => {
    try {
      const res = await adminFetch("/api/admin/cities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          latitude: parseFloat(formData.latitude),
          longitude: parseFloat(formData.longitude),
        }),
      });
      if (res.ok) {
        setShowAddDialog(false);
        setFormData({ name: "", latitude: "", longitude: "" });
        fetchCities();
      }
    } catch (error) {
      console.error("Failed to add city:", error);
    }
  };

  const handleUpdateCity = async () => {
    if (!editingCity) return;
    try {
      const res = await adminFetch(`/api/admin/cities/${editingCity.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          latitude: parseFloat(formData.latitude),
          longitude: parseFloat(formData.longitude),
        }),
      });
      if (res.ok) {
        setEditingCity(null);
        setFormData({ name: "", latitude: "", longitude: "" });
        fetchCities();
      }
    } catch (error) {
      console.error("Failed to update city:", error);
    }
  };

  const handleDeleteCity = async (id: string) => {
    try {
      const res = await adminFetch(`/api/admin/cities/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchCities();
      }
    } catch (error) {
      console.error("Failed to delete city:", error);
    } finally {
      setDeleteConfirm({ show: false, id: null, name: "" });
    }
  };

  const toggleCityStatus = async (id: string, currentStatus: boolean) => {
    try {
      const res = await adminFetch(`/api/admin/cities/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus }),
      });
      if (res.ok) {
        fetchCities();
      }
    } catch (error) {
      console.error("Failed to toggle city status:", error);
    }
  };

  const confirmDeleteCity = (id: string, name: string) => {
    setDeleteConfirm({ show: true, id, name });
  };

  const handleLogout = () => {
    localStorage.removeItem("isAdmin");
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminLevel");
    setLocation("/admin");
  };

  const openEditDialog = (city: City) => {
    setEditingCity(city);
    setFormData({
      name: city.name,
      latitude: city.latitude.toString(),
      longitude: city.longitude.toString(),
    });
  };

  const navItems = [
    { label: "Dashboard", path: "/admin/dashboard", icon: TrendingUp },
    { label: "Parking Types", path: "/admin/services", icon: Briefcase },
    { label: "Service States", path: "/admin/pincodes", icon: Globe },
    { label: "Cities", path: "/admin/cities", icon: MapPin, active: true },
    { label: "Space Providers", path: "/admin/customers", icon: Users },
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
              <p className="text-sm text-white/70">City Management</p>
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

      <ConfirmDialog
        isOpen={deleteConfirm.show}
        title="Delete City"
        message={`Are you sure you want to delete ${deleteConfirm.name}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        doubleConfirm={true}
        secondTitle={`Permanently delete "${deleteConfirm.name}"?`}
        secondMessage="Are you sure? Deleting this city will remove it and affect all associated service areas."
        secondConfirmText="Yes, Permanently Delete"
        onConfirm={() => deleteConfirm.id && handleDeleteCity(deleteConfirm.id)}
        onCancel={() => setDeleteConfirm({ show: false, id: null, name: "" })}
      />

      <div className="max-w-7xl mx-auto p-6">
        <nav className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {navItems.map((item) => (
            <Button
              key={item.path}
              variant={item.active ? "default" : "outline"}
              onClick={() => setLocation(item.path)}
              className={`rounded-full whitespace-nowrap ${item.active ? "text-white shadow-md border-0" : ""}`}
              style={item.active ? { background: "linear-gradient(135deg, #1e3a8a 0%, #3b2fad 35%, #6d28d9 70%, #7c3aed 100%)" } : undefined}
            >
              <item.icon size={16} className="mr-2" />
              {item.label}
            </Button>
          ))}
        </nav>

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Cities ({cities.length})</h2>
          <Button onClick={() => setShowAddDialog(true)} data-testid="button-add-city">
            <Plus size={18} className="mr-2" />
            Add City
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : cities.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center">
            <MapPin className="w-16 h-16 mx-auto mb-4 text-neutral-300" />
            <h3 className="text-lg font-bold text-neutral-900 mb-2">No Cities Added</h3>
            <p className="text-neutral-500 mb-4">Add your first city to get started</p>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus size={18} className="mr-2" />
              Add City
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {cities.map((city) => (
              <div key={city.id} className="bg-white rounded-2xl p-6 shadow-sm" data-testid={`card-city-${city.id}`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                      <MapPin className="text-primary" size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-neutral-900">{city.name}</h3>
                      <p className="text-xs text-neutral-500">
                        {city.latitude.toFixed(4)}, {city.longitude.toFixed(4)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={city.isActive}
                      onCheckedChange={() => toggleCityStatus(city.id, city.isActive)}
                      data-testid={`switch-city-status-${city.id}`}
                    />
                    <span className={`text-xs font-medium ${city.isActive ? "text-green-600" : "text-neutral-400"}`}>
                      {city.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(city)}
                    className="flex-1"
                    data-testid={`button-edit-city-${city.id}`}
                  >
                    <Pencil size={14} className="mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => confirmDeleteCity(city.id, city.name)}
                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                    data-testid={`button-delete-city-${city.id}`}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={showAddDialog || !!editingCity} onOpenChange={() => {
        setShowAddDialog(false);
        setEditingCity(null);
        setFormData({ name: "", latitude: "", longitude: "" });
      }}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>{editingCity ? "Edit City" : "Add New City"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>City Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Bangalore"
                className="rounded-xl"
                data-testid="input-city-name"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Latitude</Label>
                <Input
                  type="number"
                  step="0.0001"
                  value={formData.latitude}
                  onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                  placeholder="12.9716"
                  className="rounded-xl"
                  data-testid="input-city-latitude"
                />
              </div>
              <div className="space-y-2">
                <Label>Longitude</Label>
                <Input
                  type="number"
                  step="0.0001"
                  value={formData.longitude}
                  onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                  placeholder="77.5946"
                  className="rounded-xl"
                  data-testid="input-city-longitude"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddDialog(false);
                setEditingCity(null);
                setFormData({ name: "", latitude: "", longitude: "" });
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={editingCity ? handleUpdateCity : handleAddCity}
              disabled={!formData.name || !formData.latitude || !formData.longitude}
              data-testid="button-save-city"
            >
              {editingCity ? "Update" : "Add"} City
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
