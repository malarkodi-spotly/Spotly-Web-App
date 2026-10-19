import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { adminFetch } from "@/lib/api-config";
import { 
  Globe,
  FileText, 
  Plus, 
  Pencil, 
  Trash2, 
  LogOut,
  TrendingUp,
  Users,
  Car,
  Briefcase,
  MapPin,
  Wrench,
  MessageSquare,
  Settings,
  Navigation,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import logo from "@assets/Logos/spotly_full-white.png";

const LANGUAGES = [
  { id: "english", label: "English" },
  { id: "tamil", label: "Tamil" },
  { id: "kannada", label: "Kannada" },
  { id: "telugu", label: "Telugu" },
  { id: "hindi", label: "Hindi" },
];

interface Disclaimer {
  id: string;
  language: string;
  title: string;
  content: string;
  isActive: boolean;
  updatedAt: string | null;
}

export default function AdminDisclaimers() {
  const [, setLocation] = useLocation();
  const [disclaimers, setDisclaimers] = useState<Disclaimer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingDisclaimer, setEditingDisclaimer] = useState<Disclaimer | null>(null);
  const [formData, setFormData] = useState({ language: "", title: "", content: "", isActive: true });
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; id: string | null; language: string }>({ show: false, id: null, language: "" });

  useEffect(() => {
    const isAdmin = localStorage.getItem("isAdmin");
    if (!isAdmin) {
      setLocation("/admin");
      return;
    }
    fetchDisclaimers();
  }, []);

  const fetchDisclaimers = async () => {
    try {
      const res = await adminFetch("/api/admin/disclaimers");
      if (res.ok) {
        const data = await res.json();
        setDisclaimers(data.disclaimers || []);
      }
    } catch (error) {
      console.error("Failed to fetch disclaimers:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddDisclaimer = async () => {
    try {
      const res = await adminFetch("/api/admin/disclaimers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setShowAddDialog(false);
        setFormData({ language: "", title: "", content: "", isActive: true });
        fetchDisclaimers();
      }
    } catch (error) {
      console.error("Failed to add disclaimer:", error);
    }
  };

  const handleUpdateDisclaimer = async () => {
    if (!editingDisclaimer) return;
    try {
      const res = await adminFetch(`/api/admin/disclaimers/${editingDisclaimer.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setEditingDisclaimer(null);
        setFormData({ language: "", title: "", content: "", isActive: true });
        fetchDisclaimers();
      }
    } catch (error) {
      console.error("Failed to update disclaimer:", error);
    }
  };

  const handleDeleteDisclaimer = async (id: string) => {
    try {
      const res = await adminFetch(`/api/admin/disclaimers/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchDisclaimers();
      }
    } catch (error) {
      console.error("Failed to delete disclaimer:", error);
    } finally {
      setDeleteConfirm({ show: false, id: null, language: "" });
    }
  };

  const toggleDisclaimerStatus = async (id: string, currentStatus: boolean) => {
    try {
      const res = await adminFetch(`/api/admin/disclaimers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus }),
      });
      if (res.ok) {
        fetchDisclaimers();
      }
    } catch (error) {
      console.error("Failed to toggle disclaimer status:", error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("isAdmin");
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminLevel");
    localStorage.removeItem("adminLevel");
    setLocation("/admin");
  };

  const existingLanguages = disclaimers.map(d => d.language);
  const availableLanguages = LANGUAGES.filter(l => !existingLanguages.includes(l.id));

  const navItems = [
    { icon: TrendingUp, label: "Dashboard", path: "/admin/dashboard" },
    { icon: Wrench, label: "Parking Types", path: "/admin/services" },
    { icon: Globe, label: "Service States", path: "/admin/pincodes" },
    { icon: Users, label: "Space Providers", path: "/admin/customers" },
    { icon: Briefcase, label: "Space Seekers", path: "/admin/workers" },
    { icon: Car, label: "By Owner Space", path: "/admin/bookings" },
    { icon: Navigation, label: "By Spotly Space", path: "/admin/spotly-spaces" },
    { icon: Settings, label: "Settings", path: "/admin/settings" },
  ];

  const formatLanguage = (lang: string) => {
    return LANGUAGES.find(l => l.id === lang)?.label || lang.charAt(0).toUpperCase() + lang.slice(1);
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <div
        className="text-white p-4 flex items-center justify-between sticky top-0 z-10 shadow-lg"
        style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #3b2fad 35%, #6d28d9 70%, #7c3aed 100%)" }}
      >
        <div className="flex items-center gap-3">
          <img src={logo} alt="Spotly" className="h-9 w-auto object-contain" />
          <div>
            <h1 className="font-bold text-lg">Spotly Admin</h1>
            <p className="text-sm text-white/80">Manage Disclaimers</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="text-white hover:bg-white/20"
          onClick={() => setShowLogoutConfirm(true)}
          data-testid="button-logout"
        >
          <LogOut className="w-5 h-5" />
        </Button>
      </div>

      <div className="flex gap-4 p-4 overflow-x-auto bg-white border-b">
        {navItems.map((item) => (
          <button
            key={item.path}
            onClick={() => setLocation(item.path)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
              item.path === "/admin/disclaimers"
                ? "text-white shadow-md" 
                : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
            }`}
            style={item.path === "/admin/disclaimers" ? { background: "linear-gradient(135deg, #1e3a8a 0%, #3b2fad 35%, #6d28d9 70%, #7c3aed 100%)" } : undefined}
            data-testid={`nav-${item.label.toLowerCase()}`}
          >
            <item.icon className="w-4 h-4" />
            {item.label}
          </button>
        ))}
      </div>

      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Disclaimers</h2>
          {availableLanguages.length > 0 && (
            <Button
              onClick={() => setShowAddDialog(true)}
              className="gap-2"
              data-testid="button-add-disclaimer"
            >
              <Plus className="w-4 h-4" />
              Add
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="text-center py-8 text-neutral-500">Loading...</div>
        ) : disclaimers.length === 0 ? (
          <div className="text-center py-8 text-neutral-500">
            <FileText className="w-12 h-12 mx-auto mb-2 text-neutral-300" />
            <p>No disclaimers added yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {disclaimers.map((disclaimer) => (
              <div
                key={disclaimer.id}
                className="bg-white rounded-xl p-4 shadow-sm border"
                data-testid={`disclaimer-${disclaimer.language}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-lg">{formatLanguage(disclaimer.language)}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs ${
                        disclaimer.isActive 
                          ? "bg-green-100 text-green-700" 
                          : "bg-red-100 text-red-700"
                      }`}>
                        {disclaimer.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <p className="text-neutral-600 font-medium">{disclaimer.title}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={disclaimer.isActive}
                      onCheckedChange={() => toggleDisclaimerStatus(disclaimer.id, disclaimer.isActive)}
                      data-testid={`switch-${disclaimer.language}`}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setEditingDisclaimer(disclaimer);
                        setFormData({ 
                          language: disclaimer.language, 
                          title: disclaimer.title, 
                          content: disclaimer.content,
                          isActive: disclaimer.isActive
                        });
                      }}
                      data-testid={`button-edit-${disclaimer.language}`}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-500 hover:text-red-700"
                      onClick={() => setDeleteConfirm({ show: true, id: disclaimer.id, language: disclaimer.language })}
                      data-testid={`button-delete-${disclaimer.language}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-neutral-500 whitespace-pre-line line-clamp-3">
                  {disclaimer.content}
                </p>
                {disclaimer.updatedAt && (
                  <p className="text-xs text-neutral-400 mt-2">
                    Updated: {new Date(disclaimer.updatedAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Disclaimer</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Language</Label>
              <Select value={formData.language} onValueChange={(v) => setFormData({ ...formData, language: v })}>
                <SelectTrigger data-testid="select-language">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  {availableLanguages.map((lang) => (
                    <SelectItem key={lang.id} value={lang.id}>{lang.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Title</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter title"
                data-testid="input-title"
              />
            </div>
            <div>
              <Label>Content</Label>
              <Textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Enter disclaimer content"
                rows={5}
                data-testid="input-content"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
            <Button 
              onClick={handleAddDisclaimer}
              disabled={!formData.language || !formData.title || !formData.content}
              data-testid="button-save-disclaimer"
            >
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingDisclaimer} onOpenChange={(open) => !open && setEditingDisclaimer(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Disclaimer - {formatLanguage(editingDisclaimer?.language || "")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Title</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter title"
                data-testid="input-edit-title"
              />
            </div>
            <div>
              <Label>Content</Label>
              <Textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Enter disclaimer content"
                rows={5}
                data-testid="input-edit-content"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingDisclaimer(null)}>Cancel</Button>
            <Button 
              onClick={handleUpdateDisclaimer}
              disabled={!formData.title || !formData.content}
              data-testid="button-update-disclaimer"
            >
              Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        isOpen={deleteConfirm.show}
        onCancel={() => setDeleteConfirm({ show: false, id: null, language: "" })}
        title="Delete Disclaimer"
        message={`Are you sure you want to delete the ${formatLanguage(deleteConfirm.language)} disclaimer?`}
        confirmText="Delete"
        variant="danger"
        doubleConfirm={true}
        secondTitle={`Permanently delete ${formatLanguage(deleteConfirm.language)} disclaimer?`}
        secondMessage="Are you sure? This disclaimer will be removed and users will not see it."
        secondConfirmText="Yes, Permanently Delete"
        onConfirm={() => deleteConfirm.id && handleDeleteDisclaimer(deleteConfirm.id)}
      />

      <ConfirmDialog
        isOpen={showLogoutConfirm}
        onCancel={() => setShowLogoutConfirm(false)}
        title="Logout"
        message="Are you sure you want to logout from admin panel?"
        confirmText="Logout"
        onConfirm={handleLogout}
        variant="info"
      />
    </div>
  );
}
