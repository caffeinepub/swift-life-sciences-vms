export type UserRole =
  | "admin"
  | "employee"
  | "security"
  | "dispatch_manager"
  | "store_manager";

export interface CurrentUser {
  role: UserRole;
  name: string;
  username: string;
}

export type VisitorStatus =
  | "Pending"
  | "Approved"
  | "Rejected"
  | "MeetingCompleted"
  | "Exited";

export interface Visitor {
  id: string;
  name: string;
  mobile: string;
  address: string;
  idProofType: string;
  idProofNumber: string;
  idProofFile?: string;
  photo?: string;
  numberOfVisitors: number;
  additionalVisitors: string[];
  personToMeetId: number;
  personToMeetName: string;
  purpose: string;
  inTime: string;
  outTime?: string;
  date: string;
  status: VisitorStatus;
  passId: string;
  rejectionReason?: string;
  meetingEndTime?: string;
  duration?: string;
  digitalSignature?: string;
  department?: string;
}

export type MaterialType = "In" | "Out";
export type MaterialStatus = "Pending" | "Cleared" | "Rejected";

export interface Material {
  id: string;
  name: string;
  quantity: string;
  unit: string;
  company: string;
  vehicle: string;
  driverName: string;
  purpose: string;
  type: MaterialType;
  status: MaterialStatus;
  date: string;
  inTime: string;
  barcodeNumber: string;
  passId: string;
  destination?: string;
}

export interface OtherEntry {
  id: string;
  visitorName: string;
  mobile: string;
  materialName: string;
  quantity: string;
  vehicle: string;
  purpose: string;
  notes: string;
  date: string;
  inTime: string;
  status: string;
}

export type NotificationType =
  | "visitor"
  | "approved"
  | "meeting"
  | "exit"
  | "rejected"
  | "material"
  | "transfer";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  time: string;
  read: boolean;
}

export interface DispatchItem {
  id: string;
  itemName: string;
  quantity: string;
  unit: string;
  batchNo: string;
  description: string;
  verified: boolean;
}

export type DispatchStatus =
  | "Draft"
  | "Submitted"
  | "SecurityVerifying"
  | "Released"
  | "Rejected";

export interface DispatchGatepass {
  id: string;
  passId: string;
  createdBy: string;
  vehicleNo: string;
  driverName: string;
  destination: string;
  purpose: string;
  items: DispatchItem[];
  status: DispatchStatus;
  date: string;
  createdTime: string;
  releasedTime?: string;
  barcodeNumber: string;
  remarks?: string;
  securityName?: string;
}

export interface StoreInwardItem {
  id: string;
  materialId: string;
  materialName: string;
  quantity: string;
  unit: string;
  company: string;
  receivedDate: string;
  receivedTime: string;
  acknowledged: boolean;
  acknowledgedBy?: string;
  notes?: string;
  gatepassId?: string;
}

export interface DepartmentTransfer {
  id: string;
  materialId: string;
  materialName: string;
  quantity: string;
  unit: string;
  company: string;
  department: string;
  transferredBy: string;
  transferDate: string;
  transferTime: string;
  gatepassId: string;
  // Dispatch Manager acknowledgement fields
  acknowledged?: boolean;
  acknowledgedBy?: string;
  acknowledgedDate?: string;
  acknowledgedTime?: string;
}

// Return & Repair Items
// Workflow:
// PendingSecurityOut -> Dispatch Manager fills form, item waiting for Security to verify at outgoing gate
// SentForRepair     -> Security verified the outgoing item, RRG gatepass generated, item is now with vendor
// PendingReturnVerify -> Dispatch Manager marks "Return Aaya", waiting for Security to verify at gate
// PendingDispatchAccept -> Security verified inward return, return gatepass generated, waiting for Dispatch Manager to receive
// Returned          -> Dispatch Manager confirms receipt, workflow complete
export type ReturnRepairStatus =
  | "PendingSecurityOut"
  | "SentForRepair"
  | "PendingReturnVerify"
  | "PendingDispatchAccept"
  | "Returned";

export interface ReturnRepairItem {
  id: string;
  itemName: string;
  quantity: string;
  unit: string;
  batchNo: string;
  vendor: string;
  repairReason: string;
  dispatchDate: string;
  dispatchTime: string;
  dispatchedBy: string;
  createdByName?: string;
  expectedReturnDate?: string;
  status: ReturnRepairStatus;
  // Gatepass IDs
  gatepassId?: string; // e.g. "RRG-20260406-1234" — generated when Security verifies outgoing
  gatepassNumber?: string; // same as gatepassId
  returnGatepassId?: string; // generated when security verifies the return
  returnGatepassNumber?: string;
  // Step 0: Security verifies outgoing item
  securityOutVerifiedDate?: string;
  securityOutVerifiedTime?: string;
  securityOutVerifiedBy?: string;
  securityOutVerifiedById?: string;
  securityOutNotes?: string;
  // Step 1: Dispatch Manager marks item as returned (initiated)
  returnInitiatedDate?: string;
  returnInitiatedTime?: string;
  returnInitiatedBy?: string;
  // Step 2: Security verifies item at gate on return
  securityVerifiedDate?: string;
  securityVerifiedTime?: string;
  securityVerifiedBy?: string;
  securityNotes?: string;
  // Step 3: Dispatch Manager accepts
  returnDate?: string;
  returnTime?: string;
  receivedBy?: string;
  returnNotes?: string;
  referenceId: string;
}

export type AppView =
  | "login"
  | "dashboard"
  | "gate-entry"
  | "visitor-form"
  | "visitor-pass"
  | "employee-approvals"
  | "security-exit"
  | "material-form"
  | "material-pass"
  | "other-form"
  | "reports"
  | "settings"
  | "admin-users"
  | "dispatch-gatepass"
  | "dispatch-gatepass-form"
  | "security-dispatch-verify"
  | "store-inward"
  | "material-inward-verify"
  | "return-repair"
  | "security-return-verify";

export interface Employee {
  id: number;
  name: string;
  dept: string;
}
