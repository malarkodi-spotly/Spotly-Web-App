import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Eye, EyeOff } from "lucide-react";
import { getApiUrl } from "@/lib/api-config";
import logo from "@assets/Logos/Spotly-3.png";

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch(getApiUrl("/api/admin/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        localStorage.setItem("isAdmin", "true");
        localStorage.setItem("adminLevel", data.level);
        localStorage.setItem("adminToken", data.token);
        setLocation("/admin/dashboard");
      } else {
        setError(data.error || "Invalid password");
      }
    } catch (err) {
      setError("Connection error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #3b2fad 35%, #6d28d9 70%, #7c3aed 100%)" }}
    >
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 border border-white/20">
        <div className="text-center mb-8">
          <img src={logo} alt="Spotly" className="w-36 h-auto mx-auto mb-4 object-contain" />
          <h1 className="text-2xl font-bold text-neutral-900">Admin Panel</h1>
          <p className="text-neutral-500 mt-2">Spotly Administration</p>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="password">Admin Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                onKeyDown={(e) => e.key === "Enter" && !isLoading && handleLogin()}
                placeholder="Enter admin password"
                className="h-12 rounded-xl pr-12"
                data-testid="input-admin-password"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 cursor-pointer"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>

          <Button
            onClick={handleLogin}
            className="w-full h-12 rounded-xl text-lg text-white font-bold shadow-lg shadow-indigo-500/25 cursor-pointer hover:opacity-95"
            style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #3b2fad 35%, #6d28d9 70%, #7c3aed 100%)" }}
            data-testid="button-admin-login"
            disabled={isLoading}
          >
            {isLoading ? "Logging in..." : "Login to Admin"}
          </Button>

          <button
            onClick={() => setLocation("/")}
            className="w-full text-center text-sm text-neutral-500 hover:text-[#3b2fad] cursor-pointer"
          >
            Back to App
          </button>
        </div>
      </div>
    </div>
  );
}
