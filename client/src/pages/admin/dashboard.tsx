import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adminFetch, getApiUrl } from "@/lib/api-config";
import { 
  Users, 
  Briefcase, 
  Car, 
  Crown, 
  LogOut,
  TrendingUp,
  IndianRupee,
  Lock,
  Filter,
  Settings,
  Globe,
  ParkingSquare,
  BarChart3,
  Navigation,
} from "lucide-react";
import logo from "@assets/Logos/spotly_full-white.png";

interface Stats {
  totalSpaceProviders: number;
  totalSpaceSeekers: number;
  totalSpacesPosted: number;
  premiumMembers: number;
}

interface PaymentStats {
  totalAmount: number;
  transactionCount: number;
}

interface Transaction {
  id: string;
  customerId: string;
  amount: number;
  currency: string;
  type: string;
  status: string;
  reference: string;
  paidAt: string;
}

interface MonthlyData {
  month: string;
  providers: number;
  seekers: number;
  spaces: number;
}

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const [stats, setStats] = useState<Stats>({
    totalSpaceProviders: 0,
    totalSpaceSeekers: 0,
    totalSpacesPosted: 0,
    premiumMembers: 0,
  });
  const [paymentStats, setPaymentStats] = useState<PaymentStats>({ totalAmount: 0, transactionCount: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [dateFilter, setDateFilter] = useState({ startDate: "", endDate: "" });
  const [showPayments, setShowPayments] = useState(false);
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
  const [userNameMap, setUserNameMap] = useState<Record<string, string>>({});
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [chartYear, setChartYear] = useState(new Date().getFullYear());
  const [rawUsers, setRawUsers] = useState<{ providers: any[]; seekers: any[] }>({ providers: [], seekers: [] });
  const [rawSpaces, setRawSpaces] = useState<any[]>([]);
  const [stateStats, setStateStats] = useState<{ state: string; providers: number; seekers: number; premium: number }[]>([]);

  useEffect(() => {
    const isAdmin = localStorage.getItem("isAdmin");
    const adminLevel = localStorage.getItem("adminLevel");
    const adminToken = localStorage.getItem("adminToken");
    
    if (!isAdmin || !adminToken) {
      setLocation("/admin");
      return;
    }
    
    setIsSuperAdmin(adminLevel === "super");
    fetchStats();
    if (adminLevel === "super") {
      fetchPaymentStats();
    }
  }, []);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("adminToken");
    return {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    };
  };

  const fetchStats = async () => {
    try {
      const [usersRes, bookingsRes, citiesRes] = await Promise.all([
        adminFetch("/api/admin/users"),
        adminFetch("/api/admin/bookings"),
        adminFetch("/api/admin/cities"),
      ]);

      const users = usersRes.ok ? await usersRes.json() : { users: [] };
      const bookings = bookingsRes.ok ? await bookingsRes.json() : { bookings: [] };
      const citiesData = citiesRes.ok ? await citiesRes.json() : { cities: [] };

      const cityToState: Record<string, string> = {};
      const cityIdToState: Record<string, string> = {};
      const knownAliases: Record<string, string> = {
        "bengaluru": "bangalore", "bombay": "mumbai", "madras": "chennai",
        "calcutta": "kolkata", "poona": "pune", "mysuru": "mysore",
      };
      (citiesData.cities || []).forEach((c: any) => {
        if (c.name && c.state) {
          cityToState[c.name.toLowerCase()] = c.state;
          if (c.id) cityIdToState[c.id] = c.state;
        }
      });
      Object.entries(knownAliases).forEach(([alias, canonical]) => {
        if (cityToState[canonical] && !cityToState[alias]) {
          cityToState[alias] = cityToState[canonical];
        }
      });

      const spaceProviders = users.users?.filter((u: any) => u.role === "customer") || [];
      const spaceSeekers = users.users?.filter((u: any) => u.role === "worker") || [];
      const allSpaces = bookings.bookings || [];
      const premiumUsers = spaceSeekers.filter((u: any) => u.isPremium) || [];

      setStats({
        totalSpaceProviders: spaceProviders.length,
        totalSpaceSeekers: spaceSeekers.length,
        totalSpacesPosted: allSpaces.length,
        premiumMembers: premiumUsers.length,
      });

      const stateMap: Record<string, { providers: number; seekers: number; premium: number }> = {};
      const getState = (city: string | null | undefined): string | null => {
        if (!city || !city.trim()) return null;
        const lower = city.toLowerCase().trim();
        if (cityToState[lower]) return cityToState[lower];
        if (cityIdToState[city]) return cityIdToState[city];
        return null;
      };
      spaceProviders.forEach((u: any) => {
        const state = getState(u.city);
        if (!state) return;
        if (!stateMap[state]) stateMap[state] = { providers: 0, seekers: 0, premium: 0 };
        stateMap[state].providers++;
      });
      spaceSeekers.forEach((u: any) => {
        const state = getState(u.city);
        if (!state) return;
        if (!stateMap[state]) stateMap[state] = { providers: 0, seekers: 0, premium: 0 };
        stateMap[state].seekers++;
        if (u.isPremium) stateMap[state].premium++;
      });
      setStateStats(Object.entries(stateMap).map(([state, data]) => ({ state, ...data })).sort((a, b) => (b.providers + b.seekers) - (a.providers + a.seekers)));

      setRawUsers({ providers: spaceProviders, seekers: spaceSeekers });
      setRawSpaces(allSpaces);
      buildMonthlyData(spaceProviders, spaceSeekers, allSpaces, chartYear);
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const buildMonthlyData = (providers: any[], seekers: any[], spaces: any[], year: number) => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const data: MonthlyData[] = months.map((month, idx) => {
      const providerCount = providers.filter((u: any) => {
        const d = new Date(u.createdAt);
        return d.getFullYear() === year && d.getMonth() === idx;
      }).length;
      const seekerCount = seekers.filter((u: any) => {
        const d = new Date(u.createdAt);
        return d.getFullYear() === year && d.getMonth() === idx;
      }).length;
      const spaceCount = spaces.filter((b: any) => {
        const d = new Date(b.bookedAt);
        return d.getFullYear() === year && d.getMonth() === idx;
      }).length;
      return { month, providers: providerCount, seekers: seekerCount, spaces: spaceCount };
    });
    setMonthlyData(data);
  };

  useEffect(() => {
    if (rawUsers.providers.length > 0 || rawUsers.seekers.length > 0 || rawSpaces.length > 0) {
      buildMonthlyData(rawUsers.providers, rawUsers.seekers, rawSpaces, chartYear);
    }
  }, [chartYear]);

  const fetchPaymentStats = async (startDate?: string, endDate?: string, plan?: string) => {
    try {
      const params = new URLSearchParams();
      if (startDate && endDate) {
        params.append("startDate", startDate);
        params.append("endDate", endDate);
      }
      if (plan && plan !== "all") {
        params.append("plan", plan);
      }
      const path = "/api/admin/payments/totals" + (params.toString() ? `?${params.toString()}` : "");
      
      const res = await adminFetch(path);
      if (res.ok) {
        const data = await res.json();
        setPaymentStats({
          totalAmount: data.totalAmount || 0,
          transactionCount: data.transactionCount || 0,
        });
      } else if (res.status === 401 || res.status === 403) {
        setIsSuperAdmin(false);
      }
    } catch (error) {
      console.error("Failed to fetch payment stats:", error);
    }
  };

  const fetchTransactions = async (startDate?: string, endDate?: string, plan?: string) => {
    setIsLoadingTransactions(true);
    try {
      const params = new URLSearchParams();
      if (startDate && endDate) {
        params.append("startDate", startDate);
        params.append("endDate", endDate);
      }
      if (plan && plan !== "all") {
        params.append("plan", plan);
      }
      const path = "/api/admin/payments" + (params.toString() ? `?${params.toString()}` : "");
      const res = await adminFetch(path);
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.payments || []);
      }
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
    }
    setIsLoadingTransactions(false);
  };

  useEffect(() => {
    const allUsers = [...rawUsers.seekers, ...rawUsers.providers];
    if (allUsers.length > 0) {
      const map: Record<string, string> = {};
      allUsers.forEach((u: any) => { map[u.id] = u.name || "Unknown"; });
      setUserNameMap(map);
    }
  }, [rawUsers]);

  const applyFilters = (plan?: string) => {
    const p = plan ?? planFilter;
    const sd = dateFilter.startDate || undefined;
    const ed = dateFilter.endDate || undefined;
    fetchPaymentStats(sd, ed, p);
    fetchTransactions(sd, ed, p);
  };

  const handleDateFilterApply = () => {
    applyFilters();
  };

  const handleClearFilter = () => {
    setDateFilter({ startDate: "", endDate: "" });
    fetchPaymentStats(undefined, undefined, planFilter);
    fetchTransactions(undefined, undefined, planFilter);
  };

  const handlePlanFilterChange = (plan: string) => {
    setPlanFilter(plan);
    applyFilters(plan);
  };

  const handleLogout = async () => {
    try {
      await adminFetch("/api/admin/logout", {
        method: "POST"
      });
    } catch (error) {
      console.error("Logout error:", error);
    }
    localStorage.removeItem("isAdmin");
    localStorage.removeItem("adminLevel");
    localStorage.removeItem("adminToken");
    setLocation("/admin");
  };

  const navItems = [
    { label: "Dashboard", path: "/admin/dashboard", icon: TrendingUp, active: true },
    { label: "Parking Types", path: "/admin/services", icon: Car },
    { label: "Service States", path: "/admin/pincodes", icon: Globe },
    { label: "Space Providers", path: "/admin/customers", icon: Users },
    { label: "Space Seekers", path: "/admin/workers", icon: Users },
    { label: "By Owner Space", path: "/admin/bookings", icon: ParkingSquare },
    { label: "By Spotly Space", path: "/admin/spotly-spaces", icon: Navigation },
    { label: "Settings", path: "/admin/settings", icon: Settings },
  ];

  const statCards = [
    { 
      label: "Total Space Providers", 
      value: stats.totalSpaceProviders, 
      icon: Users, 
      color: "bg-blue-500",
      bgColor: "bg-blue-50/80 text-blue-600 border-blue-100", 
      iconBg: "bg-gradient-to-br from-blue-500 to-blue-600 shadow-blue-500/20"
    },
    { 
      label: "Total Space Seekers", 
      value: stats.totalSpaceSeekers, 
      icon: Briefcase, 
      color: "bg-green-500",
      bgColor: "bg-emerald-50/80 text-emerald-600 border-emerald-100", 
      iconBg: "bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-emerald-500/20"
    },
    { 
      label: "Total Spaces Posted", 
      value: stats.totalSpacesPosted, 
      icon: ParkingSquare, 
      color: "bg-[#3b2fad]",
      bgColor: "bg-indigo-50/80 text-[#3b2fad] border-indigo-100", 
      iconBg: "bg-gradient-to-br from-[#1e3a8a] to-[#7c3aed] shadow-indigo-500/20"
    },
    { 
      label: "Premium Members", 
      value: stats.premiumMembers, 
      icon: Crown, 
      color: "bg-orange-500",
      bgColor: "bg-amber-50/80 text-amber-600 border-amber-100", 
      iconBg: "bg-gradient-to-br from-amber-500 to-orange-500 shadow-amber-500/20"
    },
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
              <p className="text-sm text-white/70" data-testid="text-admin-subtitle">
                {isSuperAdmin ? "Super Admin Dashboard" : "Management Dashboard"}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            onClick={() => setShowLogoutConfirm(true)}
            className="text-white hover:bg-white/20"
            data-testid="button-admin-logout"
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
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowLogoutConfirm(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-red-600 hover:bg-red-700"
                onClick={handleLogout}
                data-testid="button-confirm-logout"
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto p-6">
        <nav className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {navItems.map((item) => (
            <Button
              key={item.path}
              variant={item.active ? "default" : "outline"}
              onClick={() => setLocation(item.path)}
              className={`rounded-full whitespace-nowrap ${item.active ? "text-white shadow-md border-0" : ""}`}
              style={item.active ? { background: "linear-gradient(135deg, #1e3a8a 0%, #3b2fad 35%, #6d28d9 70%, #7c3aed 100%)" } : undefined}
              data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <item.icon size={16} className="mr-2" />
              {item.label}
            </Button>
          ))}
        </nav>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5 mb-8">
              {statCards.map((stat) => (
                <div 
                  key={stat.label} 
                  className="bg-white rounded-2xl p-5 shadow-sm border border-neutral-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between" 
                  data-testid={`stat-card-${stat.label.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 ${stat.iconBg} rounded-2xl flex items-center justify-center shadow-lg transition-transform hover:scale-105`}>
                      <stat.icon className="text-white" size={22} />
                    </div>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${stat.bgColor}`}>
                      Active
                    </span>
                  </div>
                  <div>
                    <p className="text-3xl font-extrabold text-neutral-900 tracking-tight mb-1" data-testid={`stat-value-${stat.label.toLowerCase().replace(/\s+/g, '-')}`}>
                      {stat.value}
                    </p>
                    <p className="text-xs font-medium text-neutral-500">{stat.label}</p>
                  </div>
                </div>
              ))}
            </div>

            {stateStats.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-100 mb-8">
                <div className="flex items-center gap-2.5 mb-5">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-primary">
                    <Globe size={18} />
                  </div>
                  <h2 className="text-lg font-bold text-neutral-800">State-wise Breakdown</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-neutral-200/80 bg-neutral-50/50">
                        <th className="text-left py-3.5 px-4 font-semibold text-neutral-600 rounded-l-lg">State</th>
                        <th className="text-center py-3.5 px-4 font-semibold text-blue-600">Providers</th>
                        <th className="text-center py-3.5 px-4 font-semibold text-emerald-600">Seekers</th>
                        <th className="text-center py-3.5 px-4 font-semibold text-amber-600">Premium</th>
                        <th className="text-center py-3.5 px-4 font-semibold text-neutral-700 rounded-r-lg">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {stateStats.map((row) => (
                        <tr key={row.state} className="hover:bg-neutral-50/80 transition-colors">
                          <td className="py-3.5 px-4 font-medium text-neutral-800">{row.state}</td>
                          <td className="py-3.5 px-4 text-center">
                            <span className="inline-flex items-center justify-center min-w-[32px] h-7 px-2 rounded-full bg-blue-50 text-blue-700 font-bold text-xs">{row.providers}</span>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className="inline-flex items-center justify-center min-w-[32px] h-7 px-2 rounded-full bg-emerald-50 text-emerald-700 font-bold text-xs">{row.seekers}</span>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className="inline-flex items-center justify-center min-w-[32px] h-7 px-2 rounded-full bg-amber-50 text-amber-700 font-bold text-xs">{row.premium}</span>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className="inline-flex items-center justify-center min-w-[32px] h-7 px-2 rounded-full bg-indigo-50 text-[#0d3da8] font-bold text-xs">{row.providers + row.seekers}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-neutral-200 bg-neutral-50/70 font-bold">
                        <td className="py-3.5 px-4 text-neutral-800">Total</td>
                        <td className="py-3.5 px-4 text-center text-blue-700">{stateStats.reduce((s, r) => s + r.providers, 0)}</td>
                        <td className="py-3.5 px-4 text-center text-emerald-700">{stateStats.reduce((s, r) => s + r.seekers, 0)}</td>
                        <td className="py-3.5 px-4 text-center text-amber-700">{stateStats.reduce((s, r) => s + r.premium, 0)}</td>
                        <td className="py-3.5 px-4 text-center text-[#0d3da8]">{stateStats.reduce((s, r) => s + r.providers + r.seekers, 0)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}

            {/* Yearly Bar Charts */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-100 mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-primary shadow-xs">
                    <BarChart3 size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-neutral-800 leading-tight">Yearly Overview</h2>
                    <p className="text-xs text-neutral-400">Monthly breakdown of platform activity</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto bg-neutral-100/80 p-1 rounded-xl border border-neutral-200/60">
                  <button
                    onClick={() => setChartYear(chartYear - 1)}
                    className="w-8 h-8 rounded-lg bg-white shadow-xs flex items-center justify-center text-neutral-700 hover:bg-neutral-50 active:scale-95 transition-all text-sm font-bold"
                    data-testid="button-chart-prev-year"
                  >
                    ‹
                  </button>
                  <span className="text-sm font-bold text-neutral-800 min-w-[55px] text-center" data-testid="text-chart-year">{chartYear}</span>
                  <button
                    onClick={() => setChartYear(chartYear + 1)}
                    disabled={chartYear >= new Date().getFullYear()}
                    className="w-8 h-8 rounded-lg bg-white shadow-xs flex items-center justify-center text-neutral-700 hover:bg-neutral-50 active:scale-95 transition-all text-sm font-bold disabled:opacity-30 disabled:hover:bg-white"
                    data-testid="button-chart-next-year"
                  >
                    ›
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-6 mb-6 flex-wrap bg-neutral-50/80 p-3.5 rounded-xl border border-neutral-100">
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 rounded-md bg-gradient-to-tr from-blue-600 to-blue-400 shadow-xs" />
                  <span className="text-xs font-semibold text-neutral-700">Space Providers</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 rounded-md bg-gradient-to-tr from-emerald-600 to-emerald-400 shadow-xs" />
                  <span className="text-xs font-semibold text-neutral-700">Space Seekers</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 rounded-md bg-gradient-to-tr from-[#1e3a8a] to-[#7c3aed] shadow-xs" />
                  <span className="text-xs font-semibold text-neutral-700">Spaces Posted</span>
                </div>
              </div>

              <div className="relative pt-4 pb-2">
                {/* Horizontal Gridlines */}
                {(() => {
                  const maxVal = Math.max(...monthlyData.map(m => Math.max(m.providers, m.seekers, m.spaces)), 1);
                  const gridMax = Math.max(Math.ceil(maxVal / 4) * 4, 4);
                  return (
                    <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-9 pt-4 text-xs text-neutral-400 z-0">
                      <div className="border-b border-dashed border-neutral-200/80 w-full flex items-center justify-start">
                        <span className="bg-white/90 pr-2 text-[10px] font-medium text-neutral-400">{gridMax}</span>
                      </div>
                      <div className="border-b border-dashed border-neutral-200/80 w-full flex items-center justify-start">
                        <span className="bg-white/90 pr-2 text-[10px] font-medium text-neutral-400">{Math.round((gridMax * 3) / 4)}</span>
                      </div>
                      <div className="border-b border-dashed border-neutral-200/80 w-full flex items-center justify-start">
                        <span className="bg-white/90 pr-2 text-[10px] font-medium text-neutral-400">{Math.round((gridMax * 2) / 4)}</span>
                      </div>
                      <div className="border-b border-dashed border-neutral-200/80 w-full flex items-center justify-start">
                        <span className="bg-white/90 pr-2 text-[10px] font-medium text-neutral-400">{Math.round(gridMax / 4)}</span>
                      </div>
                      <div className="border-b border-neutral-300 w-full flex items-center justify-start">
                        <span className="bg-white/90 pr-2 text-[10px] font-medium text-neutral-400">0</span>
                      </div>
                    </div>
                  );
                })()}

                {/* Bars layout */}
                <div className="overflow-x-auto pb-2 relative z-10">
                  <div className="flex items-end justify-between min-w-[760px] h-[300px] px-6 gap-2">
                    {monthlyData.map((d) => {
                      const maxVal = Math.max(...monthlyData.map(m => Math.max(m.providers, m.seekers, m.spaces)), 1);
                      const gridMax = Math.max(Math.ceil(maxVal / 4) * 4, 4);
                      const barH = (val: number) => Math.max((val / gridMax) * 230, val > 0 ? 10 : 0);
                      return (
                        <div key={d.month} className="flex-1 flex flex-col items-center justify-end h-full gap-2.5" data-testid={`chart-bar-${d.month.toLowerCase()}`}>
                          <div className="flex items-end gap-1.5 sm:gap-2 h-[245px]">
                            {/* Space Providers Bar */}
                            <div className="relative group flex flex-col items-center">
                              {d.providers > 0 && (
                                <div className="absolute -top-8 bg-slate-900 text-white text-[10px] font-bold px-2 py-0.5 rounded-md opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-md whitespace-nowrap z-30 pointer-events-none -translate-y-1 group-hover:translate-y-0">
                                  {d.providers}
                                </div>
                              )}
                              <div
                                className="w-6 sm:w-8 md:w-8 bg-gradient-to-t from-blue-600 via-blue-500 to-blue-400 rounded-t-md shadow-xs transition-all duration-300 group-hover:brightness-110 group-hover:shadow-blue-200"
                                style={{ height: barH(d.providers) }}
                              />
                            </div>

                            {/* Space Seekers Bar */}
                            <div className="relative group flex flex-col items-center">
                              {d.seekers > 0 && (
                                <div className="absolute -top-8 bg-slate-900 text-white text-[10px] font-bold px-2 py-0.5 rounded-md opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-md whitespace-nowrap z-30 pointer-events-none -translate-y-1 group-hover:translate-y-0">
                                  {d.seekers}
                                </div>
                              )}
                              <div
                                className="w-6 sm:w-8 md:w-8 bg-gradient-to-t from-emerald-600 via-emerald-500 to-emerald-400 rounded-t-md shadow-xs transition-all duration-300 group-hover:brightness-110 group-hover:shadow-emerald-200"
                                style={{ height: barH(d.seekers) }}
                              />
                            </div>

                            {/* Spaces Posted Bar */}
                            <div className="relative group flex flex-col items-center">
                              {d.spaces > 0 && (
                                <div className="absolute -top-8 bg-slate-900 text-white text-[10px] font-bold px-2 py-0.5 rounded-md opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-md whitespace-nowrap z-30 pointer-events-none -translate-y-1 group-hover:translate-y-0">
                                  {d.spaces}
                                </div>
                              )}
                              <div
                                className="w-6 sm:w-8 md:w-8 bg-gradient-to-t from-[#1e3a8a] via-[#3b2fad] to-[#7c3aed] rounded-t-md shadow-xs transition-all duration-300 group-hover:brightness-110 group-hover:shadow-indigo-200"
                                style={{ height: barH(d.spaces) }}
                              />
                            </div>
                          </div>
                          <span className="text-xs font-semibold text-neutral-600 tracking-tight">{d.month}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {monthlyData.every(d => d.providers === 0 && d.seekers === 0 && d.spaces === 0) && (
                <div className="text-center py-6 border border-dashed border-neutral-200 rounded-xl bg-neutral-50/50 mt-4">
                  <p className="text-neutral-500 font-medium text-sm">No recorded activity available for {chartYear}</p>
                </div>
              )}
            </div>

            {isSuperAdmin && (
              <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl p-6 shadow-lg mb-6 text-white">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Lock size={20} />
                    <h2 className="text-lg font-bold">Transactions (Super Admin Only)</h2>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      const next = !showPayments;
                      setShowPayments(next);
                      if (next && transactions.length === 0) {
                        applyFilters();
                      }
                    }}
                    className="bg-white/20 hover:bg-white/30 text-white"
                    data-testid="button-toggle-payments"
                  >
                    {showPayments ? "Hide" : "Show"} Details
                  </Button>
                </div>
                
                {showPayments && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="bg-white/20 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <IndianRupee size={24} />
                          <span className="text-sm opacity-80">Total Revenue</span>
                        </div>
                        <p className="text-4xl font-bold" data-testid="text-total-revenue">₹{paymentStats.totalAmount.toLocaleString()}</p>
                      </div>
                      <div className="bg-white/20 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <BarChart3 size={24} />
                          <span className="text-sm opacity-80">Total Transactions</span>
                        </div>
                        <p className="text-4xl font-bold" data-testid="text-total-transactions">{paymentStats.transactionCount}</p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Crown size={16} />
                        <span className="font-medium text-sm">Filter by Plan</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { key: "all", label: "All Plans" },
                          { key: "basic", label: "Basic" },
                          { key: "standard", label: "Standard" },
                          { key: "premium", label: "Premium" },
                        ].map((tab) => (
                          <button
                            key={tab.key}
                            onClick={() => handlePlanFilterChange(tab.key)}
                            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
                              planFilter === tab.key
                                ? "bg-white text-green-700 shadow-md"
                                : "bg-white/15 text-white hover:bg-white/25"
                            }`}
                            data-testid={`filter-plan-${tab.key}`}
                          >
                            {tab.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="bg-white/10 rounded-xl p-4 mb-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Filter size={16} />
                        <span className="font-medium text-sm">Filter by Date</span>
                      </div>
                      <div className="flex flex-wrap gap-3 items-end">
                        <div>
                          <label className="text-xs opacity-70 block mb-1">Start Date</label>
                          <Input
                            type="date"
                            value={dateFilter.startDate}
                            onChange={(e) => setDateFilter({ ...dateFilter, startDate: e.target.value })}
                            className="bg-white/20 border-white/30 text-white w-40"
                            data-testid="input-start-date"
                          />
                        </div>
                        <div>
                          <label className="text-xs opacity-70 block mb-1">End Date</label>
                          <Input
                            type="date"
                            value={dateFilter.endDate}
                            onChange={(e) => setDateFilter({ ...dateFilter, endDate: e.target.value })}
                            className="bg-white/20 border-white/30 text-white w-40"
                            data-testid="input-end-date"
                          />
                        </div>
                        <Button
                          onClick={handleDateFilterApply}
                          size="sm"
                          className="bg-white text-green-700 hover:bg-white/90"
                          data-testid="button-apply-filter"
                        >
                          Apply Filter
                        </Button>
                        <Button
                          onClick={handleClearFilter}
                          size="sm"
                          variant="outline"
                          className="border-white/30 text-white hover:bg-white/10"
                        >
                          Clear
                        </Button>
                      </div>
                    </div>

                    <div className="bg-white/10 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <TrendingUp size={16} />
                          <span className="font-medium text-sm">Transaction History</span>
                        </div>
                        <span className="text-xs opacity-70">{transactions.length} record{transactions.length !== 1 ? "s" : ""}</span>
                      </div>
                      {isLoadingTransactions ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        </div>
                      ) : transactions.length === 0 ? (
                        <p className="text-center text-white/60 text-sm py-6">No transactions found</p>
                      ) : (
                        <div className="space-y-2 max-h-80 overflow-y-auto">
                          {transactions.map((txn) => {
                            const planMatch = txn.reference?.match(/PREM-(\w+)-/);
                            const rawPlan = planMatch ? planMatch[1].toLowerCase() : "";
                            const displayPlan = rawPlan === "basic" ? "Basic" : rawPlan === "standard" ? "Standard" : rawPlan === "premium" ? "Premium" : rawPlan === "std" ? "Standard" : rawPlan || "N/A";
                            const amountRupees = txn.amount / 100;
                            const txnDate = new Date(txn.paidAt);
                            const formattedDate = txnDate.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
                            const formattedTime = txnDate.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
                            return (
                              <div
                                key={txn.id}
                                className="bg-white/10 rounded-lg p-3 flex items-center justify-between"
                                data-testid={`txn-row-${txn.id}`}
                              >
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-0.5">
                                    <span className="font-semibold text-sm truncate">{userNameMap[txn.customerId] || "User"}</span>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                      displayPlan === "Premium" ? "bg-yellow-400/20 text-yellow-200" :
                                      displayPlan === "Standard" ? "bg-indigo-300/20 text-indigo-200" :
                                      "bg-blue-300/20 text-blue-200"
                                    }`}>
                                      {displayPlan}
                                    </span>
                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                                      txn.status === "completed" ? "bg-green-400/20 text-green-200" :
                                      txn.status === "failed" ? "bg-red-400/20 text-red-200" :
                                      "bg-yellow-400/20 text-yellow-200"
                                    }`}>
                                      {txn.status}
                                    </span>
                                  </div>
                                  <p className="text-[11px] opacity-60">{formattedDate} at {formattedTime}</p>
                                </div>
                                <div className="text-right flex-shrink-0 ml-3">
                                  <p className="font-bold text-sm">₹{amountRupees.toLocaleString()}</p>
                                  <p className="text-[10px] opacity-50 truncate max-w-[100px]">{txn.reference}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
