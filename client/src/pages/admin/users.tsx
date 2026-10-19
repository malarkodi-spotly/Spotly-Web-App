import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { adminFetch } from "@/lib/api-config";
import { 
  MapPin, 
  Users, 
  LogOut,
  TrendingUp,
  Calendar,
  Crown,
  Briefcase,
  User,
  Phone,
  Star,
  Globe,
  Settings,
  Car,
  Navigation,
} from "lucide-react";

interface UserData {
  id: string;
  name: string;
  mobile: string;
  role: string;
  isPremium: boolean;
  createdAt: string;
}

interface WorkerProfile {
  userId: string;
  age: number | null;
  gender: string | null;
  services: string[] | null;
  rating: number | null;
  reviews: number | null;
  city: string | null;
}

export default function AdminUsers() {
  const [location, setLocation] = useLocation();
  const [users, setUsers] = useState<UserData[]>([]);
  const [workerProfiles, setWorkerProfiles] = useState<Map<string, WorkerProfile>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "customer" | "worker">("all");

  useEffect(() => {
    const isAdmin = localStorage.getItem("isAdmin");
    if (!isAdmin) {
      setLocation("/admin");
      return;
    }
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await adminFetch("/api/admin/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
        
        const profiles = new Map<string, WorkerProfile>();
        (data.workerProfiles || []).forEach((p: WorkerProfile) => {
          profiles.set(p.userId, p);
        });
        setWorkerProfiles(profiles);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
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

  const filteredUsers = users.filter(user => {
    if (filter === "all") return true;
    return user.role === filter;
  });

  const navItems = [
    { label: "Dashboard", path: "/admin/dashboard", icon: TrendingUp },
    { label: "Parking Types", path: "/admin/services", icon: Briefcase },
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
          <div>
            <h1 className="text-xl font-bold">Spotly Admin</h1>
            <p className="text-sm text-white/70">User Management</p>
          </div>
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="text-white hover:bg-white/20"
          >
            <LogOut size={18} className="mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6">
        <nav className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {navItems.map((item) => (
            <Button
              key={item.path}
              variant={location === item.path ? "default" : "outline"}
              onClick={() => setLocation(item.path)}
              className={`rounded-full whitespace-nowrap ${location === item.path ? "text-white shadow-md border-0" : ""}`}
              style={location === item.path ? { background: "linear-gradient(135deg, #1e3a8a 0%, #3b2fad 35%, #6d28d9 70%, #7c3aed 100%)" } : undefined}
            >
              <item.icon size={16} className="mr-2" />
              {item.label}
            </Button>
          ))}
        </nav>

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Users ({filteredUsers.length})</h2>
          <div className="flex gap-2">
            {["all", "customer", "worker"].map((f) => (
              <Button
                key={f}
                variant={filter === f ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter(f as any)}
                className="capitalize rounded-full"
              >
                {f === "all" ? "All" : f === "customer" ? "Customers" : "Workers"}
              </Button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center">
            <Users className="w-16 h-16 mx-auto mb-4 text-neutral-300" />
            <h3 className="text-lg font-bold text-neutral-900 mb-2">No Users Found</h3>
            <p className="text-neutral-500">No users match the selected filter</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-neutral-50 border-b">
                  <tr>
                    <th className="text-left p-4 font-semibold text-neutral-600">User</th>
                    <th className="text-left p-4 font-semibold text-neutral-600">Mobile</th>
                    <th className="text-left p-4 font-semibold text-neutral-600">Role</th>
                    <th className="text-left p-4 font-semibold text-neutral-600">Status</th>
                    <th className="text-left p-4 font-semibold text-neutral-600">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredUsers.map((user) => {
                    const profile = workerProfiles.get(user.id);
                    return (
                      <tr key={user.id} className="hover:bg-neutral-50">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              user.role === "worker" ? "bg-green-100" : "bg-blue-100"
                            }`}>
                              {user.role === "worker" ? (
                                <Briefcase className="text-green-600" size={18} />
                              ) : (
                                <User className="text-blue-600" size={18} />
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-neutral-900">{user.name}</p>
                              <p className="text-xs text-neutral-500">ID: {user.id.slice(0, 8)}...</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2 text-neutral-600">
                            <Phone size={14} />
                            <span>{user.mobile}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            user.role === "worker" 
                              ? "bg-green-100 text-green-700" 
                              : "bg-blue-100 text-blue-700"
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="p-4">
                          {user.isPremium && (
                            <span className="flex items-center gap-1 text-yellow-600">
                              <Crown size={14} />
                              <span className="text-xs font-medium">Premium</span>
                            </span>
                          )}
                        </td>
                        <td className="p-4">
                          {profile && (
                            <div className="text-xs text-neutral-500 space-y-1">
                              {profile.rating && (
                                <div className="flex items-center gap-1">
                                  <Star size={12} className="text-yellow-500" />
                                  <span>{profile.rating} ({profile.reviews} reviews)</span>
                                </div>
                              )}
                              {profile.city && (
                                <div className="flex items-center gap-1">
                                  <MapPin size={12} />
                                  <span>{profile.city}</span>
                                </div>
                              )}
                            </div>
                          )}
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
    </div>
  );
}
