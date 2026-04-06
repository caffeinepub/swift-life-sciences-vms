import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building, MapPin, Phone, Settings } from "lucide-react";
import { useState } from "react";
import type { AppUser, defaultUsers as DefaultUsers } from "../mockData";
import { defaultUsers } from "../mockData";
import { AdminUsers } from "./AdminUsers";

export function SettingsPage() {
  const [users, setUsers] = useState<AppUser[]>(defaultUsers);

  const handleCreateUser = (user: AppUser) => {
    setUsers((prev) => [...prev, user]);
  };

  const handleUpdateUser = (id: string, updates: Partial<AppUser>) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, ...updates } : u)),
    );
  };

  // suppress unused type import warning
  const _: typeof DefaultUsers = defaultUsers;
  void _;

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500">
          Company configuration and user management
        </p>
      </div>

      <Tabs defaultValue="company">
        <TabsList className="bg-gray-100">
          <TabsTrigger data-ocid="settings.company_tab.tab" value="company">
            Company Info
          </TabsTrigger>
          <TabsTrigger data-ocid="settings.users_tab.tab" value="users">
            User Management
          </TabsTrigger>
          <TabsTrigger data-ocid="settings.system_tab.tab" value="system">
            System Config
          </TabsTrigger>
        </TabsList>

        {/* Company Info */}
        <TabsContent value="company">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
              <Building size={18} className="text-[#D32F2F]" />
              <h2 className="text-base font-semibold text-gray-900">
                Company Details
              </h2>
            </div>
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-700">
                  Company Name
                </Label>
                <Input
                  data-ocid="settings.company_name.input"
                  defaultValue="Swift Life Sciences Pvt. Ltd."
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">
                  <MapPin size={13} className="inline mr-1" />
                  Address
                </Label>
                <Input
                  data-ocid="settings.address.input"
                  defaultValue="D-1, Sara Industrial Estate Ltd. Rampur, Selaqui, Dehradun, Uttarakhand 248197"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">
                  <Phone size={13} className="inline mr-1" />
                  Phone
                </Label>
                <Input
                  data-ocid="settings.phone.input"
                  defaultValue="0135 269 9975"
                  className="mt-1"
                />
              </div>
            </div>
            <div className="flex justify-end mt-5">
              <Button
                data-ocid="settings.save.button"
                className="bg-[#D32F2F] hover:bg-[#B71C1C] text-white"
              >
                Save Changes
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* User Management */}
        <TabsContent value="users">
          <AdminUsers
            users={users}
            onCreateUser={handleCreateUser}
            onUpdateUser={handleUpdateUser}
          />
        </TabsContent>

        {/* System Config */}
        <TabsContent value="system">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
              <Settings size={18} className="text-[#D32F2F]" />
              <h2 className="text-base font-semibold text-gray-900">
                System Configuration
              </h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    Auto-approve visitors
                  </p>
                  <p className="text-xs text-gray-500">
                    Skip employee approval step
                  </p>
                </div>
                <div className="w-10 h-5 bg-gray-200 rounded-full cursor-not-allowed opacity-60" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    Email notifications
                  </p>
                  <p className="text-xs text-gray-500">
                    Send email on visitor arrival
                  </p>
                </div>
                <div className="w-10 h-5 bg-gray-200 rounded-full cursor-not-allowed opacity-60" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    Barcode on passes
                  </p>
                  <p className="text-xs text-gray-500">
                    Include barcode on printed passes
                  </p>
                </div>
                <div
                  className="w-10 h-5 rounded-full"
                  style={{ background: "#D32F2F" }}
                />
              </div>
            </div>
            <div className="flex justify-end mt-5">
              <Button
                data-ocid="settings.system_save.button"
                className="bg-[#D32F2F] hover:bg-[#B71C1C] text-white"
              >
                Save Config
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
