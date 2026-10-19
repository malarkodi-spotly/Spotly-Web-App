import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adminFetch } from "@/lib/api-config";
import { 
  MapPin, 
  Users, 
  LogOut,
  TrendingUp,
  Calendar,
  Briefcase,
  Plus,
  Pencil,
  Trash2,
  X,
  Check,
  MessageSquare,
  Settings,
  Globe,
  Car,
  Bike,
  Navigation,
} from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import logo from "@assets/Logos/spotly_full-white.png";

interface ServiceData {
  id: string;
  name: string;
  icon: string;
  description: string | null;
  isActive: boolean;
  displayOrder: number;
}

export default function AdminServices() {
  const [, setLocation] = useLocation();
  const [services, setServices] = useState<ServiceData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    icon: "",
    description: "",
    isActive: true,
    displayOrder: 0
  });
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; id: string | null; name: string }>({ show: false, id: null, name: "" });

  useEffect(() => {
    const isAdmin = localStorage.getItem("isAdmin");
    if (!isAdmin) {
      setLocation("/admin");
      return;
    }
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const res = await adminFetch("/api/admin/services");
      if (res.ok) {
        const data = await res.json();
        setServices(data.services || []);
      }
    } catch (error) {
      console.error("Failed to fetch parking types:", error);
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
      const res = await adminFetch("/api/admin/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        fetchServices();
        setShowAddForm(false);
        resetForm();
      }
    } catch (error) {
      console.error("Failed to add parking type:", error);
    }
  };

  const handleUpdate = async (id: string) => {
    try {
      const res = await adminFetch(`/api/admin/services/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        fetchServices();
        setEditingId(null);
        resetForm();
      }
    } catch (error) {
      console.error("Failed to update parking type:", error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await adminFetch(`/api/admin/services/${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        fetchServices();
      }
    } catch (error) {
      console.error("Failed to delete parking type:", error);
    } finally {
      setDeleteConfirm({ show: false, id: null, name: "" });
    }
  };

  const confirmDelete = (id: string, name: string) => {
    setDeleteConfirm({ show: true, id, name });
  };

  const startEdit = (service: ServiceData) => {
    setEditingId(service.id);
    setFormData({
      name: service.name,
      icon: service.icon,
      description: service.description || "",
      isActive: service.isActive,
      displayOrder: service.displayOrder
    });
  };

  const resetForm = () => {
    setFormData({ name: "", icon: "", description: "", isActive: true, displayOrder: 0 });
  };

  const formatServiceName = (slug: string) => {
    return slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const navItems = [
    { label: "Dashboard", path: "/admin/dashboard", icon: TrendingUp },
    { label: "Parking Types", path: "/admin/services", icon: Briefcase, active: true },
    { label: "Service States", path: "/admin/pincodes", icon: Globe },
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
              <p className="text-sm text-white/70">Parking Type Management</p>
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
        title="Delete Parking Type"
        message={`Are you sure you want to delete ${deleteConfirm.name}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        doubleConfirm={true}
        secondTitle={`Permanently delete "${deleteConfirm.name}"?`}
        secondMessage="Are you sure? Deleting this parking type will remove it from all future listings."
        secondConfirmText="Yes, Permanently Delete"
        onConfirm={() => deleteConfirm.id && handleDelete(deleteConfirm.id)}
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
              data-testid={`nav-${item.label.toLowerCase()}`}
            >
              <item.icon size={16} className="mr-2" />
              {item.label}
            </Button>
          ))}
        </nav>

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Parking Types ({services.length})</h2>
          <Button onClick={() => setShowAddForm(true)} data-testid="button-add-service">
            <Plus size={16} className="mr-2" />
            Add Parking Type
          </Button>
        </div>

        {showAddForm && (
          <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm">
            <h3 className="font-bold mb-4">Add New Parking Type</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                placeholder="Parking Type Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                data-testid="input-service-name"
              />
              <Input
                placeholder="Icon (emoji or name)"
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                data-testid="input-service-icon"
              />
              <Input
                placeholder="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                data-testid="input-service-description"
              />
              <Input
                type="number"
                placeholder="Display Order"
                value={formData.displayOrder}
                onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
                data-testid="input-service-order"
              />
            </div>
            <div className="flex items-center gap-2 mt-4">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                id="isActive"
              />
              <label htmlFor="isActive">Active</label>
            </div>
            <div className="flex gap-2 mt-4">
              <Button onClick={handleAdd} data-testid="button-save-service">
                <Check size={16} className="mr-2" />
                Save
              </Button>
              <Button variant="outline" onClick={() => { setShowAddForm(false); resetForm(); }}>
                <X size={16} className="mr-2" />
                Cancel
              </Button>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : services.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center">
            <Briefcase className="w-16 h-16 mx-auto mb-4 text-neutral-300" />
            <h3 className="text-lg font-bold text-neutral-900 mb-2">No Parking Types</h3>
            <p className="text-neutral-500">Add your first parking type to get started</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-neutral-50 border-b">
                  <tr>
                    <th className="text-left p-4 font-semibold text-neutral-600">Icon</th>
                    <th className="text-left p-4 font-semibold text-neutral-600">Name</th>
                    <th className="text-left p-4 font-semibold text-neutral-600">Description</th>
                    <th className="text-left p-4 font-semibold text-neutral-600">Status</th>
                    <th className="text-left p-4 font-semibold text-neutral-600">Order</th>
                    <th className="text-left p-4 font-semibold text-neutral-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {services.map((service) => (
                    <tr key={service.id} className="hover:bg-neutral-50" data-testid={`row-service-${service.id}`}>
                      {editingId === service.id ? (
                        <>
                          <td className="p-4">
                            <Input
                              value={formData.icon}
                              onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                              className="w-20"
                            />
                          </td>
                          <td className="p-4">
                            <Input
                              value={formData.name}
                              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                          </td>
                          <td className="p-4">
                            <Input
                              value={formData.description}
                              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                          </td>
                          <td className="p-4">
                            <input
                              type="checkbox"
                              checked={formData.isActive}
                              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                            />
                          </td>
                          <td className="p-4">
                            <Input
                              type="number"
                              value={formData.displayOrder}
                              onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
                              className="w-20"
                            />
                          </td>
                          <td className="p-4">
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => handleUpdate(service.id)}>
                                <Check size={14} />
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => { setEditingId(null); resetForm(); }}>
                                <X size={14} />
                              </Button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="p-4">
                            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                              {(() => {
                                const n = service.name.toLowerCase();
                                const isCar = n.includes("car") && !n.includes("bike");
                                const isBike = n.includes("bike") && !n.includes("car");
                                if (isCar) return <Car size={20} className="text-[#0d3da8]" />;
                                if (isBike) return <Bike size={20} className="text-[#0d3da8]" />;
                                return <div className="flex items-center gap-0.5"><Car size={16} className="text-[#0d3da8]" /><Bike size={12} className="text-[#0d3da8]" /></div>;
                              })()}
                            </div>
                          </td>
                          <td className="p-4 font-medium">{formatServiceName(service.name)}</td>
                          <td className="p-4 text-neutral-500">{service.description || "-"}</td>
                          <td className="p-4">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              service.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                            }`}>
                              {service.isActive ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td className="p-4">{service.displayOrder}</td>
                          <td className="p-4">
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" onClick={() => startEdit(service)} data-testid={`button-edit-${service.id}`}>
                                <Pencil size={14} />
                              </Button>
                              <Button size="sm" variant="outline" className="text-red-600" onClick={() => confirmDelete(service.id, service.name)} data-testid={`button-delete-${service.id}`}>
                                <Trash2 size={14} />
                              </Button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
