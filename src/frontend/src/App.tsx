import { Toaster } from "@/components/ui/sonner";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Layout } from "./components/Layout";
import { DB_KEYS, loadFromStorage, saveToStorage } from "./db";
import {
  defaultUsers,
  seedDispatchGatepasses,
  seedMaterials,
  seedNotifications,
  seedStoreInward,
  seedVisitors,
} from "./mockData";
import type { AppUser } from "./mockData";
import { AdminUsers } from "./pages/AdminUsers";
import { Dashboard } from "./pages/Dashboard";
import { DispatchGatepassList } from "./pages/DispatchGatepass";
import { DispatchGatepassForm } from "./pages/DispatchGatepassForm";
import { EmployeeApprovals } from "./pages/EmployeeApprovals";
import { GateEntrySelect } from "./pages/GateEntrySelect";
import { LoginPage } from "./pages/LoginPage";
import { MaterialForm } from "./pages/MaterialForm";
import { MaterialInwardVerify } from "./pages/MaterialInwardVerify";
import { MaterialPass } from "./pages/MaterialPass";
import { OtherForm } from "./pages/OtherForm";
import { Reports } from "./pages/Reports";
import { SecurityDispatchVerify } from "./pages/SecurityDispatchVerify";
import { SecurityExit } from "./pages/SecurityExit";
import { SecurityReturnVerify } from "./pages/SecurityReturnVerify";
import { SettingsPage } from "./pages/SettingsPage";
import { StoreManagerInward } from "./pages/StoreManagerInward";
import { VisitorForm } from "./pages/VisitorForm";
import { VisitorPass } from "./pages/VisitorPass";
import type {
  AppView,
  CurrentUser,
  DepartmentTransfer,
  DispatchGatepass,
  Material,
  Notification,
  OtherEntry,
  ReturnRepairItem,
  StoreInwardItem,
  Visitor,
} from "./types";

export default function App() {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [currentView, setCurrentView] = useState<AppView>("login");

  // Initialize from localStorage with seed data as fallback
  const [visitors, setVisitors] = useState<Visitor[]>(() =>
    loadFromStorage(DB_KEYS.VISITORS, seedVisitors),
  );
  const [materials, setMaterials] = useState<Material[]>(() =>
    loadFromStorage(DB_KEYS.MATERIALS, seedMaterials),
  );
  const [_otherEntries, setOtherEntries] = useState<OtherEntry[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>(() =>
    loadFromStorage(DB_KEYS.NOTIFICATIONS, seedNotifications),
  );
  const [activeVisitor, setActiveVisitor] = useState<Visitor | null>(null);
  const [activeMaterial, setActiveMaterial] = useState<Material | null>(null);
  const [dispatchGatepasses, setDispatchGatepasses] = useState<
    DispatchGatepass[]
  >(() => loadFromStorage(DB_KEYS.DISPATCH_GATEPASSES, seedDispatchGatepasses));
  const [storeItems, setStoreItems] = useState<StoreInwardItem[]>(() =>
    loadFromStorage(DB_KEYS.STORE_ITEMS, seedStoreInward),
  );
  const [users, setUsers] = useState<AppUser[]>(() =>
    loadFromStorage(DB_KEYS.USERS, defaultUsers),
  );
  const [departmentTransfers, setDepartmentTransfers] = useState<
    DepartmentTransfer[]
  >(() => loadFromStorage(DB_KEYS.DEPARTMENT_TRANSFERS, []));
  const [returnRepairItems, setReturnRepairItems] = useState<
    ReturnRepairItem[]
  >(() => loadFromStorage(DB_KEYS.RETURN_REPAIR_ITEMS, []));

  // Persist to localStorage on state changes
  useEffect(() => {
    saveToStorage(DB_KEYS.VISITORS, visitors);
  }, [visitors]);
  useEffect(() => {
    saveToStorage(DB_KEYS.MATERIALS, materials);
  }, [materials]);
  useEffect(() => {
    saveToStorage(DB_KEYS.NOTIFICATIONS, notifications);
  }, [notifications]);
  useEffect(() => {
    saveToStorage(DB_KEYS.DISPATCH_GATEPASSES, dispatchGatepasses);
  }, [dispatchGatepasses]);
  useEffect(() => {
    saveToStorage(DB_KEYS.STORE_ITEMS, storeItems);
  }, [storeItems]);
  useEffect(() => {
    saveToStorage(DB_KEYS.USERS, users);
  }, [users]);
  useEffect(() => {
    saveToStorage(DB_KEYS.DEPARTMENT_TRANSFERS, departmentTransfers);
  }, [departmentTransfers]);
  useEffect(() => {
    saveToStorage(DB_KEYS.RETURN_REPAIR_ITEMS, returnRepairItems);
  }, [returnRepairItems]);

  // Bug 2 Fix: Sync state from localStorage on storage events (cross-tab)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === DB_KEYS.USERS) {
        setUsers(loadFromStorage(DB_KEYS.USERS, defaultUsers));
      } else if (e.key === DB_KEYS.MATERIALS) {
        setMaterials(loadFromStorage(DB_KEYS.MATERIALS, seedMaterials));
      } else if (e.key === DB_KEYS.VISITORS) {
        setVisitors(loadFromStorage(DB_KEYS.VISITORS, seedVisitors));
      } else if (e.key === DB_KEYS.DISPATCH_GATEPASSES) {
        setDispatchGatepasses(
          loadFromStorage(DB_KEYS.DISPATCH_GATEPASSES, seedDispatchGatepasses),
        );
      } else if (e.key === DB_KEYS.STORE_ITEMS) {
        setStoreItems(loadFromStorage(DB_KEYS.STORE_ITEMS, seedStoreInward));
      } else if (e.key === DB_KEYS.RETURN_REPAIR_ITEMS) {
        setReturnRepairItems(loadFromStorage(DB_KEYS.RETURN_REPAIR_ITEMS, []));
      } else if (e.key === DB_KEYS.DEPARTMENT_TRANSFERS) {
        setDepartmentTransfers(
          loadFromStorage(DB_KEYS.DEPARTMENT_TRANSFERS, []),
        );
      } else if (e.key === DB_KEYS.NOTIFICATIONS) {
        setNotifications(
          loadFromStorage(DB_KEYS.NOTIFICATIONS, seedNotifications),
        );
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Bug 2 Fix: Polling fallback for same-tab localStorage updates
  useEffect(() => {
    const interval = setInterval(() => {
      setUsers(loadFromStorage(DB_KEYS.USERS, defaultUsers));
      setDispatchGatepasses(
        loadFromStorage(DB_KEYS.DISPATCH_GATEPASSES, seedDispatchGatepasses),
      );
      setReturnRepairItems(loadFromStorage(DB_KEYS.RETURN_REPAIR_ITEMS, []));
      setDepartmentTransfers(loadFromStorage(DB_KEYS.DEPARTMENT_TRANSFERS, []));
      setMaterials(loadFromStorage(DB_KEYS.MATERIALS, seedMaterials));
      setStoreItems(loadFromStorage(DB_KEYS.STORE_ITEMS, seedStoreInward));
      setNotifications(
        loadFromStorage(DB_KEYS.NOTIFICATIONS, seedNotifications),
      );
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  const handleLogin = (user: CurrentUser) => {
    setCurrentUser(user);
    if (user.role === "admin") {
      setCurrentView("dashboard");
    } else if (user.role === "employee") {
      setCurrentView("employee-approvals");
    } else if (user.role === "dispatch_manager") {
      setCurrentView("dispatch-gatepass");
    } else if (user.role === "store_manager") {
      setCurrentView("store-inward");
    } else {
      setCurrentView("gate-entry");
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentView("login");
  };

  const handleNavigate = (view: AppView) => {
    setCurrentView(view);
  };

  const addNotification = (
    type: Notification["type"],
    title: string,
    message: string,
  ) => {
    const notif: Notification = {
      id: `notif-${Date.now()}`,
      type,
      title,
      message,
      time: format(new Date(), "hh:mm aa"),
      read: false,
    };
    setNotifications((prev) => [notif, ...prev]);
  };

  const handleAddVisitor = (visitor: Visitor) => {
    setVisitors((prev) => [visitor, ...prev]);
    setActiveVisitor(visitor);
    addNotification(
      "visitor",
      "New Visitor Arrived",
      `${visitor.name} has arrived to meet ${visitor.personToMeetName}`,
    );
  };

  const handleUpdateVisitor = (id: string, updates: Partial<Visitor>) => {
    setVisitors((prev) =>
      prev.map((v) => (v.id === id ? { ...v, ...updates } : v)),
    );
    const visitor = visitors.find((v) => v.id === id);
    if (visitor) {
      if (updates.status === "Approved") {
        addNotification(
          "approved",
          "Visitor Approved",
          `${visitor.name}'s visit has been approved`,
        );
      } else if (updates.status === "Rejected") {
        addNotification(
          "rejected",
          "Visitor Rejected",
          `${visitor.name}'s visit has been rejected`,
        );
      } else if (updates.status === "MeetingCompleted") {
        addNotification(
          "meeting",
          "Meeting Completed",
          `${visitor.name}'s meeting has been completed`,
        );
      } else if (updates.status === "Exited") {
        addNotification(
          "exit",
          "Visitor Exited",
          `${visitor.name} has exited the premises`,
        );
      }
    }
  };

  const handleAddMaterial = (material: Material) => {
    setMaterials((prev) => [material, ...prev]);
    setActiveMaterial(material);
    addNotification(
      "material",
      "Material Entry",
      `${material.name} (${material.quantity} ${material.unit}) from ${material.company}`,
    );
    // If material In, notify store manager
    if (material.type === "In") {
      addNotification(
        "material",
        "New Material Inward",
        `${material.name} from ${material.company} pending verification at gate`,
      );
    }
  };

  const handleUpdateMaterial = (id: string, updates: Partial<Material>) => {
    setMaterials((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...updates } : m)),
    );
  };

  const handleAddStoreItem = (item: StoreInwardItem) => {
    setStoreItems((prev) => {
      const updated = [item, ...prev];
      // Save immediately so polling in other tabs/views picks it up without delay
      saveToStorage(DB_KEYS.STORE_ITEMS, updated);
      return updated;
    });
    addNotification(
      "material",
      "New Material Inward",
      `${item.materialName} (${item.quantity} ${item.unit}) from ${item.company} — Gatepass: ${item.gatepassId}`,
    );
  };

  const handleAddDepartmentTransfer = (transfer: DepartmentTransfer) => {
    setDepartmentTransfers((prev) => [transfer, ...prev]);
    addNotification(
      "transfer",
      "Department Transfer",
      `${transfer.materialName} transferred to ${transfer.department} Dept — ${transfer.gatepassId}`,
    );
    toast.info(
      `Material transfer to ${transfer.department} department recorded`,
    );
  };

  // Bug 1 Fix: Handler to update DepartmentTransfer (for Dispatch Manager acknowledgement)
  const handleUpdateDepartmentTransfer = (
    id: string,
    updates: Partial<DepartmentTransfer>,
  ) => {
    setDepartmentTransfers((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    );
  };

  const handleAddOtherEntry = (entry: OtherEntry) => {
    setOtherEntries((prev) => [entry, ...prev]);
  };

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleClearAll = () => {
    setNotifications([]);
    toast.success("All notifications cleared");
  };

  const handleViewPass = (visitor: Visitor) => {
    setActiveVisitor(visitor);
  };

  // Dispatch handlers
  const handleCreateGatepass = (gp: DispatchGatepass) => {
    setDispatchGatepasses((prev) => [gp, ...prev]);
  };

  const handleUpdateGatepass = (
    id: string,
    updates: Partial<DispatchGatepass>,
  ) => {
    setDispatchGatepasses((prev) =>
      prev.map((gp) => (gp.id === id ? { ...gp, ...updates } : gp)),
    );
  };

  // Store handlers
  const handleUpdateStoreItem = (
    id: string,
    updates: Partial<StoreInwardItem>,
  ) => {
    setStoreItems((prev) => {
      const updated = prev.map((s) => (s.id === id ? { ...s, ...updates } : s));
      saveToStorage(DB_KEYS.STORE_ITEMS, updated);
      return updated;
    });
  };

  // Admin user handlers
  const handleCreateUser = (user: AppUser) => {
    setUsers((prev) => [...prev, user]);
  };

  const handleUpdateUser = (id: string, updates: Partial<AppUser>) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, ...updates } : u)),
    );
  };

  // Return/Repair handlers
  const handleAddReturnRepairItem = (item: ReturnRepairItem) => {
    setReturnRepairItems((prev) => [item, ...prev]);
    addNotification(
      "material",
      "Item Security Verify Ke Liye Bheja",
      `${item.itemName} — Security Guard ko gate pe verify karne ke liye bheja gaya hai`,
    );
  };

  const handleUpdateReturnRepairItem = (
    id: string,
    updates: Partial<ReturnRepairItem>,
  ) => {
    setReturnRepairItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, ...updates } : i)),
    );
    const item = returnRepairItems.find((i) => i.id === id);
    if (item) {
      if (updates.status === "SentForRepair" && updates.gatepassId) {
        // Security verified outgoing item, gatepass generated
        addNotification(
          "material",
          "Security ne Verify Kiya — Gatepass Bana",
          `${item.itemName} — Gatepass: ${updates.gatepassId} — Security ne gate pe verify kar diya, item ab repair ke liye ja sakta hai`,
        );
      } else if (updates.status === "PendingReturnVerify") {
        addNotification(
          "material",
          "Return Item — Gate Verify Karo",
          `${item.itemName} repair se wapas aa gaya — Gatepass No: ${item.gatepassId || item.referenceId} — Security gate pe verify kare`,
        );
      } else if (updates.status === "PendingDispatchAccept") {
        addNotification(
          "material",
          "Security ne Verify Kiya — Accept Karein",
          `${item.itemName} — Return Gatepass: ${updates.returnGatepassId || ""} — Security Guard ne gate pe confirm kiya, ab aap receive karein`,
        );
      } else if (updates.status === "Returned") {
        addNotification(
          "material",
          "Item Returned from Repair",
          `${item.itemName} successfully received — Gatepass: ${item.gatepassId || item.referenceId}`,
        );
      }
    }
  };

  // Get current user's full data (for employee ID in sidebar)
  const currentUserData = currentUser
    ? (users.find((u) => u.username === currentUser.username) ?? null)
    : null;

  if (!currentUser) {
    return (
      <>
        <LoginPage onLogin={handleLogin} />
        <Toaster richColors position="top-right" />
      </>
    );
  }

  const renderContent = () => {
    switch (currentView) {
      case "dashboard":
        return (
          <Dashboard
            visitors={visitors}
            materials={materials}
            onNavigate={handleNavigate}
          />
        );
      case "gate-entry":
        return <GateEntrySelect onNavigate={handleNavigate} />;
      case "visitor-form":
        return (
          <VisitorForm
            onSubmit={handleAddVisitor}
            onNavigate={handleNavigate}
            users={users}
          />
        );
      case "visitor-pass":
        return (
          <VisitorPass
            visitor={activeVisitor ?? visitors[0] ?? null}
            onNavigate={handleNavigate}
          />
        );
      case "employee-approvals":
        return (
          <EmployeeApprovals
            visitors={visitors}
            currentUser={currentUser!}
            onUpdateVisitor={handleUpdateVisitor}
            onNavigate={handleNavigate}
            onViewPass={handleViewPass}
          />
        );
      case "security-exit":
        return (
          <SecurityExit
            visitors={visitors}
            onUpdateVisitor={handleUpdateVisitor}
            onNavigate={handleNavigate}
          />
        );
      case "material-form":
        return (
          <MaterialForm
            onSubmit={handleAddMaterial}
            onNavigate={handleNavigate}
            currentUserRole={currentUser?.role}
          />
        );
      case "material-pass":
        return (
          <MaterialPass
            material={activeMaterial ?? materials[0] ?? null}
            onNavigate={handleNavigate}
          />
        );
      case "material-inward-verify":
        return (
          <MaterialInwardVerify
            materials={materials}
            onUpdateMaterial={handleUpdateMaterial}
            onAddStoreItem={handleAddStoreItem}
            onAddDepartmentTransfer={handleAddDepartmentTransfer}
            onNavigate={handleNavigate}
            currentUser={currentUser}
          />
        );
      case "other-form":
        return (
          <OtherForm
            onSubmit={handleAddOtherEntry}
            onNavigate={handleNavigate}
          />
        );
      case "reports":
        return (
          <Reports
            visitors={visitors}
            materials={materials}
            dispatchGatepasses={dispatchGatepasses}
          />
        );
      case "settings":
        return <SettingsPage />;
      case "admin-users":
        return (
          <AdminUsers
            users={users}
            onCreateUser={handleCreateUser}
            onUpdateUser={handleUpdateUser}
          />
        );
      case "dispatch-gatepass":
        return (
          <DispatchGatepassList
            gatepasses={dispatchGatepasses}
            currentUser={currentUser}
            onNavigate={handleNavigate}
            onCreateGatepass={handleCreateGatepass}
            returnRepairItems={returnRepairItems}
            onAddReturnRepairItem={handleAddReturnRepairItem}
            onUpdateReturnRepairItem={handleUpdateReturnRepairItem}
            departmentTransfers={departmentTransfers}
            onUpdateDepartmentTransfer={handleUpdateDepartmentTransfer}
          />
        );
      case "dispatch-gatepass-form":
        return (
          <DispatchGatepassForm
            currentUser={currentUser}
            onSubmit={handleCreateGatepass}
            onNavigate={handleNavigate}
          />
        );
      case "security-dispatch-verify":
        return (
          <SecurityDispatchVerify
            gatepasses={dispatchGatepasses}
            currentUser={currentUser}
            onUpdateGatepass={handleUpdateGatepass}
            onNavigate={handleNavigate}
            returnRepairItems={returnRepairItems}
            onUpdateReturnRepairItem={handleUpdateReturnRepairItem}
          />
        );
      case "store-inward":
        return (
          <StoreManagerInward
            storeItems={storeItems}
            currentUser={currentUser}
            onUpdateStoreItem={handleUpdateStoreItem}
          />
        );

      case "security-return-verify":
        return (
          <SecurityReturnVerify
            items={returnRepairItems}
            currentUser={currentUser}
            onUpdateItem={handleUpdateReturnRepairItem}
            onNavigate={handleNavigate}
          />
        );
      default:
        return (
          <Dashboard
            visitors={visitors}
            materials={materials}
            onNavigate={handleNavigate}
          />
        );
    }
  };

  return (
    <>
      <Layout
        currentUser={currentUser}
        currentView={currentView}
        notifications={notifications}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
        onMarkAllRead={handleMarkAllRead}
        onClearAll={handleClearAll}
        storeItems={storeItems}
        materials={materials}
        currentUserData={currentUserData}
        returnRepairItems={returnRepairItems}
      >
        {renderContent()}
      </Layout>
      <Toaster richColors position="top-right" />
    </>
  );
}
