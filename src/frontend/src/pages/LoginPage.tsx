import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, LogIn, Shield } from "lucide-react";
import { useState } from "react";
import { DB_KEYS, loadFromStorage } from "../db";
import type { AppUser } from "../mockData";
import { defaultUsers } from "../mockData";
import type { CurrentUser, UserRole } from "../types";

interface LoginPageProps {
  onLogin: (user: CurrentUser) => void;
}

const ROLE_BUTTONS: { role: UserRole; label: string }[] = [
  { role: "admin", label: "Admin" },
  { role: "employee", label: "Employee" },
  { role: "security", label: "Security" },
  { role: "dispatch_manager", label: "Dispatch Mgr" },
  { role: "store_manager", label: "Store Mgr" },
];

const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Admin",
  employee: "Employee",
  security: "Security",
  dispatch_manager: "Dispatch Mgr",
  store_manager: "Store Mgr",
};

export function LoginPage({ onLogin }: LoginPageProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("admin");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError("");
    setLoading(true);
    await new Promise((r) => setTimeout(r, 500));

    // Re-load users from storage to get latest
    const freshUsers = loadFromStorage<AppUser[]>(DB_KEYS.USERS, defaultUsers);
    const found = freshUsers.find(
      (u) =>
        u.username === username.trim() &&
        u.password === password &&
        u.role === role &&
        u.active,
    );

    if (found) {
      onLogin({ role: found.role, name: found.name, username: found.username });
    } else {
      // Check if username/password match but wrong role
      const wrongRole = freshUsers.find(
        (u) =>
          u.username === username.trim() && u.password === password && u.active,
      );
      if (wrongRole) {
        setError(`Sahi role select karein: ${ROLE_LABELS[wrongRole.role]}`);
      } else {
        const disabled = freshUsers.find(
          (u) => u.username === username.trim() && u.password === password,
        );
        if (disabled && !disabled.active) {
          setError("Yeh account disabled hai. Admin se contact karein.");
        } else {
          setError("Invalid username ya password. Dobara try karein.");
        }
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 p-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header band */}
          <div
            className="px-8 py-8 text-center"
            style={{
              background:
                "linear-gradient(135deg, #B71C1C 0%, #D32F2F 50%, #B71C1C 100%)",
            }}
          >
            <div className="flex justify-center mb-4">
              <div className="w-20 h-20 rounded-2xl bg-white/15 flex items-center justify-center overflow-hidden border-2 border-white/30">
                <img
                  src="/assets/logo-019d6222-36be-748a-bc3b-3755cb68bffb.jpg"
                  alt="Swift Life Sciences"
                  className="w-16 h-16 object-contain"
                />
              </div>
            </div>
            <h1 className="text-white text-xl font-bold tracking-wide">
              SWIFT LIFE SCIENCES
            </h1>
            <p className="text-red-200 text-sm mt-1">
              Gate Pass Management System
            </p>
            <p className="text-red-300/70 text-xs mt-1">
              D-1, Sara Industrial Estate, Selaqui, Dehradun
            </p>
          </div>

          {/* Form */}
          <div className="px-8 py-6">
            <h2 className="text-gray-900 text-lg font-semibold mb-5 flex items-center gap-2">
              <Shield size={18} className="text-[#D32F2F]" />
              Secure Login
            </h2>

            <div className="space-y-4">
              <div>
                <Label
                  htmlFor="username"
                  className="text-sm font-medium text-gray-700"
                >
                  Username
                </Label>
                <Input
                  data-ocid="login.username.input"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  className="mt-1"
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                />
              </div>

              <div>
                <Label
                  htmlFor="password"
                  className="text-sm font-medium text-gray-700"
                >
                  Password
                </Label>
                <div className="relative mt-1">
                  <Input
                    data-ocid="login.password.input"
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700">
                  Role
                </Label>
                <div className="grid grid-cols-3 gap-2 mt-1">
                  {ROLE_BUTTONS.slice(0, 3).map(({ role: r, label }) => (
                    <button
                      type="button"
                      key={r}
                      data-ocid={`login.role.${r}.toggle`}
                      onClick={() => setRole(r)}
                      className={`py-2 px-3 rounded-lg text-xs font-medium border transition-all ${
                        role === r
                          ? "bg-[#D32F2F] text-white border-[#D32F2F]"
                          : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {ROLE_BUTTONS.slice(3).map(({ role: r, label }) => (
                    <button
                      type="button"
                      key={r}
                      data-ocid={`login.role.${r}.toggle`}
                      onClick={() => setRole(r)}
                      className={`py-2 px-3 rounded-lg text-xs font-medium border transition-all ${
                        role === r
                          ? "bg-[#D32F2F] text-white border-[#D32F2F]"
                          : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <div
                  data-ocid="login.error_state"
                  className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2 border border-red-100"
                >
                  {error}
                </div>
              )}

              <Button
                data-ocid="login.submit.button"
                onClick={handleLogin}
                disabled={loading}
                className="w-full bg-[#D32F2F] hover:bg-[#B71C1C] text-white font-semibold h-10"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg
                      aria-hidden="true"
                      className="animate-spin h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v8z"
                      />
                    </svg>
                    Authenticating...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <LogIn size={16} /> Sign In
                  </span>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-500 mt-4">
          &copy; {new Date().getFullYear()} Swift Life Sciences Pvt. Ltd. All
          rights reserved.
        </p>
      </div>
    </div>
  );
}
