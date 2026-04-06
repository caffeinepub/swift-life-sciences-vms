import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Edit,
  Eye,
  EyeOff,
  Key,
  Plus,
  PowerOff,
  Search,
  UserCheck,
  UserCog,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { AppUser } from "../mockData";
import type { UserRole } from "../types";

interface AdminUsersProps {
  users: AppUser[];
  onCreateUser: (user: AppUser) => void;
  onUpdateUser: (id: string, updates: Partial<AppUser>) => void;
}

const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Admin",
  employee: "Employee",
  security: "Security",
  dispatch_manager: "Dispatch Manager",
  store_manager: "Store Manager",
};

const ROLE_COLORS: Record<UserRole, string> = {
  admin: "bg-red-100 text-red-700 border-red-200",
  employee: "bg-blue-100 text-blue-700 border-blue-200",
  security: "bg-orange-100 text-orange-700 border-orange-200",
  dispatch_manager: "bg-purple-100 text-purple-700 border-purple-200",
  store_manager: "bg-green-100 text-green-700 border-green-200",
};

const ROLES: UserRole[] = [
  "admin",
  "employee",
  "security",
  "dispatch_manager",
  "store_manager",
];

const DEPARTMENTS = [
  "R&D",
  "Production",
  "Quality Control",
  "HR",
  "Admin",
  "Warehouse",
  "Security",
  "Dispatch",
  "Store",
];

type ModalMode = "create" | "edit" | "password" | null;

function generateEmployeeId(name: string, role: UserRole): string {
  const rolePrefix: Record<UserRole, string> = {
    admin: "ADM",
    employee: "EMP",
    security: "SEC",
    dispatch_manager: "DM",
    store_manager: "SM",
  };
  const initials = name
    .split(" ")
    .map((w) => w[0]?.toUpperCase() || "")
    .join("")
    .slice(0, 2);
  const num = String(Math.floor(Math.random() * 900) + 100);
  return `EMP-${rolePrefix[role]}-${initials}${num}`;
}

export function AdminUsers({
  users,
  onCreateUser,
  onUpdateUser,
}: AdminUsersProps) {
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole | "all">("all");

  // Form state
  const [formName, setFormName] = useState("");
  const [formUsername, setFormUsername] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formRole, setFormRole] = useState<UserRole>("employee");
  const [formDepartment, setFormDepartment] = useState("");
  const [formEmployeeId, setFormEmployeeId] = useState("");
  const [formDesignation, setFormDesignation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>(
    {},
  );

  // Password change state
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPass, setShowNewPass] = useState(false);

  const filteredUsers = users.filter((u) => {
    const q = search.toLowerCase();
    const matchSearch =
      u.name.toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q) ||
      (u.employeeId ?? "").toLowerCase().includes(q) ||
      (u.designation ?? "").toLowerCase().includes(q) ||
      (u.department ?? "").toLowerCase().includes(q);
    const matchRole = roleFilter === "all" || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const openCreate = () => {
    setFormName("");
    setFormUsername("");
    setFormPassword("");
    setFormRole("employee");
    setFormDepartment("");
    setFormEmployeeId("");
    setFormDesignation("");
    setShowPassword(false);
    setSelectedUser(null);
    setModalMode("create");
  };

  const openEdit = (user: AppUser) => {
    setFormName(user.name);
    setFormUsername(user.username);
    setFormPassword("");
    setFormRole(user.role);
    setFormDepartment(user.department ?? "");
    setFormEmployeeId(user.employeeId ?? "");
    setFormDesignation(user.designation ?? "");
    setShowPassword(false);
    setSelectedUser(user);
    setModalMode("edit");
  };

  const openChangePassword = (user: AppUser) => {
    setSelectedUser(user);
    setNewPassword("");
    setConfirmPassword("");
    setShowNewPass(false);
    setModalMode("password");
  };

  const handleCreate = () => {
    if (!formName.trim() || !formUsername.trim() || !formPassword.trim()) {
      toast.error("Please fill all required fields");
      return;
    }
    if (users.find((u) => u.username === formUsername.trim())) {
      toast.error("Username already exists");
      return;
    }
    const today = new Date().toISOString().split("T")[0];
    const empId =
      formEmployeeId.trim() || generateEmployeeId(formName.trim(), formRole);
    const newUser: AppUser = {
      id: `u${Date.now()}`,
      name: formName.trim(),
      username: formUsername.trim(),
      password: formPassword.trim(),
      role: formRole,
      active: true,
      createdAt: today,
      department: formDepartment.trim() || undefined,
      employeeId: empId,
      designation: formDesignation.trim() || undefined,
    };
    onCreateUser(newUser);
    toast.success(`User "${newUser.name}" created — ID: ${empId}`);
    setModalMode(null);
  };

  const handleEdit = () => {
    if (!selectedUser) return;
    if (!formName.trim()) {
      toast.error("Name is required");
      return;
    }
    const updates: Partial<AppUser> = {
      name: formName.trim(),
      role: formRole,
      department: formDepartment.trim() || undefined,
      employeeId: formEmployeeId.trim() || undefined,
      designation: formDesignation.trim() || undefined,
    };
    if (formPassword.trim()) {
      updates.password = formPassword.trim();
    }
    onUpdateUser(selectedUser.id, updates);
    toast.success("User updated successfully");
    setModalMode(null);
  };

  const handleChangePassword = () => {
    if (!selectedUser) return;
    if (!newPassword.trim()) {
      toast.error("New password is required");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    onUpdateUser(selectedUser.id, { password: newPassword.trim() });
    toast.success("Password changed successfully");
    setModalMode(null);
  };

  const handleToggleActive = (user: AppUser) => {
    const newStatus = !user.active;
    onUpdateUser(user.id, { active: newStatus });
    toast.success(
      `User "${user.name}" ${newStatus ? "enabled" : "disabled"} successfully`,
    );
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <UserCog size={20} className="text-[#D32F2F]" />
          <div>
            <h2 className="text-lg font-bold text-gray-900">User Management</h2>
            <p className="text-xs text-gray-500">
              {users.length} user(s) registered &bull; {filteredUsers.length}{" "}
              shown
            </p>
          </div>
        </div>
        <Button
          data-ocid="admin_users.add.button"
          onClick={openCreate}
          className="bg-[#D32F2F] hover:bg-[#B71C1C] text-white"
          size="sm"
        >
          <Plus size={14} className="mr-2" />
          Add User
        </Button>
      </div>

      {/* Search + Filter */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <Input
            data-ocid="admin_users.search.input"
            placeholder="Search by name, username, employee ID, designation..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-white"
          />
        </div>
        <Select
          value={roleFilter}
          onValueChange={(v) => setRoleFilter(v as UserRole | "all")}
        >
          <SelectTrigger
            data-ocid="admin_users.role_filter.select"
            className="w-44"
          >
            <SelectValue placeholder="All Roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            {ROLES.map((r) => (
              <SelectItem key={r} value={r}>
                {ROLE_LABELS[r]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="text-xs font-semibold">
                  Employee ID
                </TableHead>
                <TableHead className="text-xs font-semibold">Name</TableHead>
                <TableHead className="text-xs font-semibold">
                  Username
                </TableHead>
                <TableHead className="text-xs font-semibold">
                  Password
                </TableHead>
                <TableHead className="text-xs font-semibold">
                  Designation
                </TableHead>
                <TableHead className="text-xs font-semibold">Role</TableHead>
                <TableHead className="text-xs font-semibold">
                  Department
                </TableHead>
                <TableHead className="text-xs font-semibold">Status</TableHead>
                <TableHead className="text-xs font-semibold">Created</TableHead>
                <TableHead className="text-xs font-semibold text-center">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={10}
                    className="text-center py-10 text-gray-400 text-sm"
                  >
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user, idx) => (
                  <TableRow
                    key={user.id}
                    data-ocid={`admin_users.item.${idx + 1}`}
                    className="hover:bg-gray-50/60"
                  >
                    <TableCell className="py-3">
                      <span className="text-xs font-mono font-bold text-[#D32F2F] bg-red-50 px-2 py-0.5 rounded">
                        {user.employeeId || "—"}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm font-semibold text-gray-900 py-3">
                      {user.name}
                    </TableCell>
                    <TableCell className="text-xs font-mono text-gray-600 py-3">
                      {user.username}
                    </TableCell>
                    <TableCell className="py-3">
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-mono text-gray-700">
                          {showPasswords[user.id] ? user.password : "••••••••"}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setShowPasswords((prev) => ({
                              ...prev,
                              [user.id]: !prev[user.id],
                            }))
                          }
                          className="text-gray-400 hover:text-gray-700 ml-1"
                          title={
                            showPasswords[user.id] ? "Hide" : "Show Password"
                          }
                        >
                          {showPasswords[user.id] ? (
                            <EyeOff size={12} />
                          ) : (
                            <Eye size={12} />
                          )}
                        </button>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-gray-600 py-3">
                      {user.designation || "—"}
                    </TableCell>
                    <TableCell className="py-3">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                          ROLE_COLORS[user.role]
                        }`}
                      >
                        {ROLE_LABELS[user.role]}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-gray-500 py-3">
                      {user.department || "—"}
                    </TableCell>
                    <TableCell className="py-3">
                      <Badge
                        variant="outline"
                        className={
                          user.active
                            ? "bg-green-50 text-green-700 border-green-200 text-[10px]"
                            : "bg-gray-100 text-gray-500 border-gray-200 text-[10px]"
                        }
                      >
                        {user.active ? "Active" : "Disabled"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-gray-500 py-3">
                      {user.createdAt}
                    </TableCell>
                    <TableCell className="py-3">
                      <div className="flex items-center gap-1 justify-center">
                        <button
                          type="button"
                          data-ocid={`admin_users.edit.button.${idx + 1}`}
                          onClick={() => openEdit(user)}
                          title="Edit User"
                          className="p-1.5 rounded hover:bg-blue-50 text-blue-600 transition-colors"
                        >
                          <Edit size={13} />
                        </button>
                        <button
                          type="button"
                          data-ocid={`admin_users.password.button.${idx + 1}`}
                          onClick={() => openChangePassword(user)}
                          title="Change Password"
                          className="p-1.5 rounded hover:bg-yellow-50 text-yellow-600 transition-colors"
                        >
                          <Key size={13} />
                        </button>
                        <button
                          type="button"
                          data-ocid={`admin_users.toggle.button.${idx + 1}`}
                          onClick={() => handleToggleActive(user)}
                          title={user.active ? "Disable User" : "Enable User"}
                          className={`p-1.5 rounded transition-colors ${
                            user.active
                              ? "hover:bg-red-50 text-red-600"
                              : "hover:bg-green-50 text-green-600"
                          }`}
                        >
                          {user.active ? (
                            <PowerOff size={13} />
                          ) : (
                            <UserCheck size={13} />
                          )}
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Create / Edit Modal */}
      <Dialog
        open={modalMode === "create" || modalMode === "edit"}
        onOpenChange={(open) => !open && setModalMode(null)}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle data-ocid="admin_users.modal">
              {modalMode === "create" ? "Create New User" : "Edit User"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2 max-h-[60vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label className="text-sm font-medium">
                  Full Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  data-ocid="admin_users.name.input"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Dr. Rajesh Kumar"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-sm font-medium">
                  Username{" "}
                  {modalMode === "create" && (
                    <span className="text-red-500">*</span>
                  )}
                </Label>
                <Input
                  data-ocid="admin_users.username.input"
                  value={formUsername}
                  onChange={(e) => setFormUsername(e.target.value)}
                  placeholder="e.g. rajesh.kumar"
                  className="mt-1"
                  disabled={modalMode === "edit"}
                />
                {modalMode === "edit" && (
                  <p className="text-[10px] text-gray-400 mt-1">
                    Username cannot be changed
                  </p>
                )}
              </div>
              <div>
                <Label className="text-sm font-medium">
                  Password{" "}
                  {modalMode === "create" && (
                    <span className="text-red-500">*</span>
                  )}
                  {modalMode === "edit" && (
                    <span className="text-gray-400 font-normal text-xs">
                      (blank = keep current)
                    </span>
                  )}
                </Label>
                <div className="relative mt-1">
                  <Input
                    data-ocid="admin_users.password.input"
                    type={showPassword ? "text" : "password"}
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    placeholder={
                      modalMode === "edit" ? "Leave blank" : "Min 6 chars"
                    }
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">
                  Role <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formRole}
                  onValueChange={(v) => setFormRole(v as UserRole)}
                >
                  <SelectTrigger
                    data-ocid="admin_users.role.select"
                    className="mt-1"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((r) => (
                      <SelectItem key={r} value={r}>
                        {ROLE_LABELS[r]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium">Department</Label>
                <Select
                  value={formDepartment || "_none"}
                  onValueChange={(v) =>
                    setFormDepartment(v === "_none" ? "" : v)
                  }
                >
                  <SelectTrigger
                    data-ocid="admin_users.department.select"
                    className="mt-1"
                  >
                    <SelectValue placeholder="Select dept." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">None</SelectItem>
                    {DEPARTMENTS.map((d) => (
                      <SelectItem key={d} value={d}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium">Employee ID</Label>
                <Input
                  data-ocid="admin_users.employee_id.input"
                  value={formEmployeeId}
                  onChange={(e) => setFormEmployeeId(e.target.value)}
                  placeholder="Auto-generated if blank"
                  className="mt-1 font-mono"
                />
              </div>
              <div>
                <Label className="text-sm font-medium">Designation</Label>
                <Input
                  data-ocid="admin_users.designation.input"
                  value={formDesignation}
                  onChange={(e) => setFormDesignation(e.target.value)}
                  placeholder="e.g. Senior Scientist"
                  className="mt-1"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              data-ocid="admin_users.cancel.button"
              variant="outline"
              onClick={() => setModalMode(null)}
            >
              Cancel
            </Button>
            <Button
              data-ocid="admin_users.save.button"
              onClick={modalMode === "create" ? handleCreate : handleEdit}
              className="bg-[#D32F2F] hover:bg-[#B71C1C] text-white"
            >
              {modalMode === "create" ? "Create User" : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Password Modal */}
      <Dialog
        open={modalMode === "password"}
        onOpenChange={(open) => !open && setModalMode(null)}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle data-ocid="admin_users.password_modal">
              Change Password
            </DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="bg-gray-50 rounded-lg px-3 py-2 mb-2">
              <p className="text-xs text-gray-500">Changing password for</p>
              <p className="text-sm font-semibold text-gray-900">
                {selectedUser.name}
              </p>
              {selectedUser.employeeId && (
                <p className="text-xs font-mono text-[#D32F2F]">
                  {selectedUser.employeeId}
                </p>
              )}
            </div>
          )}
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-sm font-medium">
                New Password <span className="text-red-500">*</span>
              </Label>
              <div className="relative mt-1">
                <Input
                  data-ocid="admin_users.new_password.input"
                  type={showNewPass ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPass(!showNewPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showNewPass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium">
                Confirm Password <span className="text-red-500">*</span>
              </Label>
              <Input
                data-ocid="admin_users.confirm_password.input"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="mt-1"
                onKeyDown={(e) => e.key === "Enter" && handleChangePassword()}
              />
              {confirmPassword && newPassword !== confirmPassword && (
                <p
                  data-ocid="admin_users.password_error"
                  className="text-xs text-red-500 mt-1"
                >
                  Passwords do not match
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              data-ocid="admin_users.password_cancel.button"
              variant="outline"
              onClick={() => setModalMode(null)}
            >
              Cancel
            </Button>
            <Button
              data-ocid="admin_users.password_confirm.button"
              onClick={handleChangePassword}
              className="bg-[#D32F2F] hover:bg-[#B71C1C] text-white"
            >
              Update Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
