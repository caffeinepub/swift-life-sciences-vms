// localStorage persistence helpers for VMS

export function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function saveToStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // ignore quota errors
  }
}

export const DB_KEYS = {
  VISITORS: "vms_visitors",
  MATERIALS: "vms_materials",
  DISPATCH_GATEPASSES: "vms_dispatch_gatepasses",
  STORE_ITEMS: "vms_store_items",
  USERS: "vms_users",
  DEPARTMENT_TRANSFERS: "vms_department_transfers",
  NOTIFICATIONS: "vms_notifications",
  RETURN_REPAIR_ITEMS: "vms_return_repair_items",
} as const;
