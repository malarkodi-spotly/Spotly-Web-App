import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { adminFetch } from "@/lib/api-config";
import { 
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
  Globe,
  Car,
  Navigation,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Switch } from "@/components/ui/switch";
import logo from "@assets/Logos/spotly_full-white.png";

interface ServiceArea {
  id: string;
  prefix: string;
  cityName: string;
  isActive: boolean;
  displayOrder: number;
}

export default function AdminPincodes() {
  const [, setLocation] = useLocation();
  const [areas, setAreas] = useState<ServiceArea[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingArea, setEditingArea] = useState<ServiceArea | null>(null);
  const [formData, setFormData] = useState({ stateName: "", displayName: "", displayOrder: "0" });
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; id: string | null; name: string }>({ show: false, id: null, name: "" });
  const [toggleConfirm, setToggleConfirm] = useState<{ show: boolean; id: string | null; currentStatus: boolean; name: string }>({ show: false, id: null, currentStatus: false, name: "" });

  useEffect(() => {
    const isAdmin = localStorage.getItem("isAdmin");
    if (!isAdmin) {
      setLocation("/admin");
      return;
    }
    fetchAreas();
  }, []);

  const fetchAreas = async () => {
    try {
      const res = await adminFetch("/api/admin/pincodes");
      if (res.ok) {
        const data = await res.json();
        setAreas(data.pincodes || []);
      }
    } catch (error) {
      console.error("Failed to fetch service areas:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddArea = async () => {
    try {
      const res = await adminFetch("/api/admin/pincodes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prefix: formData.stateName,
          cityName: formData.displayName,
          displayOrder: parseInt(formData.displayOrder) || 0,
        }),
      });
      if (res.ok) {
        setShowAddDialog(false);
        setFormData({ stateName: "", displayName: "", displayOrder: "0" });
        fetchAreas();
      }
    } catch (error) {
      console.error("Failed to add service area:", error);
    }
  };

  const handleUpdateArea = async () => {
    if (!editingArea) return;
    try {
      const res = await adminFetch(`/api/admin/pincodes/${editingArea.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prefix: formData.stateName,
          cityName: formData.displayName,
          displayOrder: parseInt(formData.displayOrder) || 0,
        }),
      });
      if (res.ok) {
        setEditingArea(null);
        setFormData({ stateName: "", displayName: "", displayOrder: "0" });
        fetchAreas();
      }
    } catch (error) {
      console.error("Failed to update service area:", error);
    }
  };

  const handleDeleteArea = async (id: string) => {
    try {
      const res = await adminFetch(`/api/admin/pincodes/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchAreas();
      }
    } catch (error) {
      console.error("Failed to delete service area:", error);
    } finally {
      setDeleteConfirm({ show: false, id: null, name: "" });
    }
  };

  const toggleAreaStatus = async (id: string, currentStatus: boolean) => {
    try {
      const res = await adminFetch(`/api/admin/pincodes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus }),
      });
      if (res.ok) {
        fetchAreas();
      }
    } catch (error) {
      console.error("Failed to toggle service area status:", error);
    } finally {
      setToggleConfirm({ show: false, id: null, currentStatus: false, name: "" });
    }
  };

  const confirmToggleStatus = (id: string, currentStatus: boolean, stateName: string, displayName: string) => {
    setToggleConfirm({ show: true, id, currentStatus, name: `${displayName} (${stateName})` });
  };

  const confirmDeleteArea = (id: string, stateName: string, displayName: string) => {
    setDeleteConfirm({ show: true, id, name: `${displayName} (${stateName})` });
  };

  const handleLogout = () => {
    localStorage.removeItem("isAdmin");
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminLevel");
    setLocation("/admin");
  };

  const openEditDialog = (area: ServiceArea) => {
    setEditingArea(area);
    setFormData({
      stateName: area.prefix,
      displayName: area.cityName,
      displayOrder: area.displayOrder.toString(),
    });
  };

  const navItems = [
    { label: "Dashboard", path: "/admin/dashboard", icon: TrendingUp },
    { label: "Parking Types", path: "/admin/services", icon: Briefcase },
    { label: "Service States", path: "/admin/pincodes", icon: Globe, active: true },
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
              <p className="text-sm text-white/70">Location Management</p>
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
        title="Delete Service Area"
        message={`Are you sure you want to delete ${deleteConfirm.name}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        doubleConfirm={true}
        secondTitle={`Permanently delete "${deleteConfirm.name}"?`}
        secondMessage="Are you sure? Deleting this service area will permanently remove it from the system."
        secondConfirmText="Yes, Permanently Delete"
        onConfirm={() => deleteConfirm.id && handleDeleteArea(deleteConfirm.id)}
        onCancel={() => setDeleteConfirm({ show: false, id: null, name: "" })}
      />

      <ConfirmDialog
        isOpen={toggleConfirm.show}
        title={toggleConfirm.currentStatus ? "Disable Service Area" : "Enable Service Area"}
        message={toggleConfirm.currentStatus 
          ? `Are you sure you want to disable ${toggleConfirm.name}? This state will not be available for Space Providers and Space Seekers.`
          : `Are you sure you want to enable ${toggleConfirm.name}? This state will be available for Space Providers and Space Seekers.`}
        confirmText={toggleConfirm.currentStatus ? "Disable" : "Enable"}
        cancelText="Cancel"
        variant={toggleConfirm.currentStatus ? "danger" : "info"}
        onConfirm={() => toggleConfirm.id && toggleAreaStatus(toggleConfirm.id, toggleConfirm.currentStatus)}
        onCancel={() => setToggleConfirm({ show: false, id: null, currentStatus: false, name: "" })}
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

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <p className="text-amber-800 text-sm">
            <strong>Locations:</strong> Manage the locations your app serves.
          </p>
        </div>

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Locations ({areas.length})</h2>
          <Button onClick={() => setShowAddDialog(true)} data-testid="button-add-state">
            <Plus size={18} className="mr-2" />
            Add State
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : areas.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center">
            <Globe className="w-16 h-16 mx-auto mb-4 text-neutral-300" />
            <h3 className="text-lg font-bold text-neutral-900 mb-2">No Locations Added</h3>
            <p className="text-neutral-500 mb-4">Add locations to define where your service is available</p>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus size={18} className="mr-2" />
              Add State
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {areas.map((area) => (
              <div key={area.id} className="bg-white rounded-2xl p-6 shadow-sm" data-testid={`card-state-${area.id}`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                      <Globe className="text-primary" size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-neutral-900">{area.prefix}</h3>
                      <p className="text-sm text-neutral-600">{area.cityName}</p>
                      <p className="text-xs text-neutral-400">Order: {area.displayOrder}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={area.isActive}
                      onCheckedChange={() => confirmToggleStatus(area.id, area.isActive, area.prefix, area.cityName)}
                      data-testid={`switch-state-status-${area.id}`}
                    />
                    <span className={`text-xs font-medium ${area.isActive ? "text-green-600" : "text-neutral-400"}`}>
                      {area.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(area)}
                    className="flex-1"
                    data-testid={`button-edit-state-${area.id}`}
                  >
                    <Pencil size={14} className="mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => confirmDeleteArea(area.id, area.prefix, area.cityName)}
                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                    data-testid={`button-delete-state-${area.id}`}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={showAddDialog || !!editingArea} onOpenChange={() => {
        setShowAddDialog(false);
        setEditingArea(null);
        setFormData({ stateName: "", displayName: "", displayOrder: "0" });
      }}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>{editingArea ? "Edit Service State" : "Add New Service State"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>State Name (e.g., Karnataka)</Label>
              <Input
                value={formData.stateName}
                onChange={(e) => setFormData({ ...formData, stateName: e.target.value })}
                placeholder="e.g., Karnataka"
                className="rounded-xl"
                data-testid="input-state-name"
              />
              <p className="text-xs text-neutral-500">
                Enter the exact state name as it appears in maps (e.g., Karnataka, Tamil Nadu)
              </p>
            </div>
            <div className="space-y-2">
              <Label>Display Name</Label>
              <Input
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                placeholder="e.g., Karnataka"
                className="rounded-xl"
                data-testid="input-display-name"
              />
              <p className="text-xs text-neutral-500">
                Name shown to users in the app
              </p>
            </div>
            <div className="space-y-2">
              <Label>Display Order</Label>
              <Input
                type="number"
                value={formData.displayOrder}
                onChange={(e) => setFormData({ ...formData, displayOrder: e.target.value })}
                placeholder="0"
                className="rounded-xl"
                data-testid="input-state-order"
              />
              <p className="text-xs text-neutral-500">Lower numbers appear first</p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddDialog(false);
                setEditingArea(null);
                setFormData({ stateName: "", displayName: "", displayOrder: "0" });
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={editingArea ? handleUpdateArea : handleAddArea}
              disabled={!formData.stateName || !formData.displayName}
              data-testid="button-save-state"
            >
              {editingArea ? "Update" : "Add"} State
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
