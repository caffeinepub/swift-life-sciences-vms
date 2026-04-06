import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  CheckCircle2,
  ClipboardList,
  Download,
  Eye,
  PackageOpen,
  Plus,
  Printer,
  RotateCcw,
  ShieldCheck,
  Truck,
  Wrench,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import type {
  AppView,
  CurrentUser,
  ReturnRepairItem,
  ReturnRepairStatus,
} from "../types";

interface ReturnRepairManagerProps {
  items: ReturnRepairItem[];
  currentUser: CurrentUser;
  onNavigate: (view: AppView) => void;
  onAddItem: (item: ReturnRepairItem) => void;
  onUpdateItem: (id: string, updates: Partial<ReturnRepairItem>) => void;
}

const STATUS_CONFIG: Record<
  ReturnRepairStatus,
  { label: string; className: string }
> = {
  PendingSecurityOut: {
    label: "Security Verify Pending",
    className: "bg-yellow-100 text-yellow-700 border-yellow-200",
  },
  SentForRepair: {
    label: "Sent for Repair",
    className: "bg-orange-100 text-orange-700 border-orange-200",
  },
  PendingReturnVerify: {
    label: "Awaiting Gate Verify",
    className: "bg-blue-100 text-blue-700 border-blue-200",
  },
  PendingDispatchAccept: {
    label: "Security Verified — Accept",
    className: "bg-purple-100 text-purple-700 border-purple-200",
  },
  Returned: {
    label: "Returned",
    className: "bg-green-100 text-green-700 border-green-200",
  },
};

function getDaysDiff(dispatchDate: string, returnDate?: string): string {
  const from = new Date(dispatchDate);
  const to = returnDate ? new Date(returnDate) : new Date();
  const diff = Math.ceil(
    (to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (diff < 0) return "\u2014";
  return `${diff} day${diff !== 1 ? "s" : ""}`;
}

interface GeneratedGatepass {
  passId: string;
  barcodeNumber: string;
  item: ReturnRepairItem;
  createdBy: string;
  createdById: string;
  createdDate: string;
  createdTime: string;
}

export function ReturnRepairManager({
  items,
  currentUser,
  onNavigate,
  onAddItem,
  onUpdateItem,
}: ReturnRepairManagerProps) {
  const [activeTab, setActiveTab] = useState<
    "active" | "pending_accept" | "history"
  >("active");
  const [showAddForm, setShowAddForm] = useState(false);
  const [viewItem, setViewItem] = useState<ReturnRepairItem | null>(null);
  const [showSendToSecurityDialog, setShowSendToSecurityDialog] =
    useState<ReturnRepairItem | null>(null);
  const [showAcceptDialog, setShowAcceptDialog] =
    useState<ReturnRepairItem | null>(null);
  const [acceptNotes, setAcceptNotes] = useState("");
  const [receivedBy, setReceivedBy] = useState(currentUser.name);
  const [search, setSearch] = useState("");
  const [generatedGatepass, setGeneratedGatepass] =
    useState<GeneratedGatepass | null>(null);
  const passRef = useRef<HTMLDivElement>(null);

  // Add form state
  const [formItemName, setFormItemName] = useState("");
  const [formQty, setFormQty] = useState("");
  const [formUnit, setFormUnit] = useState("");
  const [formBatchNo, setFormBatchNo] = useState("");
  const [formVendor, setFormVendor] = useState("");
  const [formReason, setFormReason] = useState("");
  const [formExpectedReturn, setFormExpectedReturn] = useState("");
  const [formCreatedBy, setFormCreatedBy] = useState(currentUser.name);
  const [submitting, setSubmitting] = useState(false);

  const activeItems = items.filter(
    (i) => i.status === "SentForRepair" || i.status === "PendingReturnVerify",
  );
  const pendingAcceptItems = items.filter(
    (i) => i.status === "PendingDispatchAccept",
  );
  const returnedItems = items.filter((i) => i.status === "Returned");

  const filterFn = (i: ReturnRepairItem) =>
    i.itemName.toLowerCase().includes(search.toLowerCase()) ||
    i.vendor.toLowerCase().includes(search.toLowerCase()) ||
    i.referenceId.toLowerCase().includes(search.toLowerCase()) ||
    (i.gatepassId || "").toLowerCase().includes(search.toLowerCase());

  const filteredActive = activeItems.filter(filterFn);
  const filteredPendingAccept = pendingAcceptItems.filter(filterFn);
  const filteredHistory = returnedItems.filter(filterFn);

  const resetForm = () => {
    setFormItemName("");
    setFormQty("");
    setFormUnit("");
    setFormBatchNo("");
    setFormVendor("");
    setFormReason("");
    setFormExpectedReturn("");
    setFormCreatedBy(currentUser.name);
  };

  const handleAddItem = async () => {
    if (
      !formItemName.trim() ||
      !formQty.trim() ||
      !formUnit.trim() ||
      !formVendor.trim() ||
      !formReason.trim()
    ) {
      toast.error(
        "Item Name, Qty, Unit, Vendor aur Repair Reason required hain",
      );
      return;
    }
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 400));
    const now = new Date();
    const dateStr = now.toISOString().split("T")[0].replace(/-/g, "");
    const seq = String(Math.floor(Math.random() * 9000) + 1000);
    const gatepassId = `RRG-${dateStr}-${seq}`;
    const barcodeNumber = `RRG${dateStr}${seq}`;
    const newItem: ReturnRepairItem = {
      id: `RR-${dateStr}-${seq}`,
      referenceId: `RR-${dateStr}-${seq}`,
      gatepassId,
      gatepassNumber: gatepassId,
      itemName: formItemName.trim(),
      quantity: formQty.trim(),
      unit: formUnit.trim(),
      batchNo: formBatchNo.trim(),
      vendor: formVendor.trim(),
      repairReason: formReason.trim(),
      dispatchDate: now.toISOString().split("T")[0],
      dispatchTime: now.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      dispatchedBy: formCreatedBy.trim() || currentUser.name,
      createdByName: formCreatedBy.trim() || currentUser.name,
      expectedReturnDate: formExpectedReturn || undefined,
      status: "SentForRepair",
    };
    onAddItem(newItem);

    // Show gatepass modal
    const gp: GeneratedGatepass = {
      passId: gatepassId,
      barcodeNumber,
      item: newItem,
      createdBy: currentUser.name,
      createdById: currentUser.username,
      createdDate: now.toISOString().split("T")[0],
      createdTime: now.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
    setGeneratedGatepass(gp);
    setShowAddForm(false);
    resetForm();
    setSubmitting(false);
  };

  const handlePrint = () => {
    if (!passRef.current) return;
    const content = passRef.current.innerHTML;
    const win = window.open("", "_blank", "width=620,height=700");
    if (!win) return;
    win.document.write(`
      <html>
        <head>
          <title>Return/Repair Gatepass</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
            .pass { border: 2px solid #B71C1C; max-width: 500px; margin: 0 auto; border-radius: 8px; overflow: hidden; }
            .header { background: #B71C1C; color: white; text-align: center; padding: 12px 20px; }
            .header .company { font-size: 13px; font-weight: bold; opacity: 0.85; }
            .header .title { font-size: 15px; font-weight: bold; margin: 2px 0; }
            .header .addr { font-size: 10px; opacity: 0.7; }
            .pass-id-row { display: flex; justify-content: space-between; align-items: center; padding: 14px 20px; background: #f9f9f9; border-bottom: 1px solid #e5e7eb; }
            .pass-id-label { font-size: 9px; color: #888; text-transform: uppercase; letter-spacing: 1px; }
            .pass-id-val { font-size: 18px; font-weight: bold; color: #1f2937; }
            .barcode-text { font-family: monospace; font-size: 11px; font-weight: bold; letter-spacing: 3px; color: #374151; }
            .barcode-bars { display: flex; gap: 1px; margin-top: 4px; justify-content: flex-end; }
            .bar { background: #111; display: inline-block; height: 22px; }
            .details { padding: 14px 20px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
            .field-label { font-size: 9px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.5px; }
            .field-val { font-size: 12px; font-weight: 600; color: #111; margin-top: 2px; }
            .vendor-row { padding: 10px 20px; background: #FFF7ED; border-top: 1px solid #FED7AA; }
            .vendor-label { font-size: 9px; color: #C2410C; text-transform: uppercase; letter-spacing: 1px; font-weight: bold; }
            .vendor-val { font-size: 14px; font-weight: bold; color: #9a3412; margin-top: 2px; }
            .sig-section { padding: 12px 20px; border-top: 1px solid #e5e7eb; background: white; }
            .sig-label { font-size: 9px; color: #9ca3af; text-transform: uppercase; letter-spacing: 1px; font-weight: bold; margin-bottom: 8px; }
            .sig-box { border: 1px solid #d1d5db; border-radius: 6px; padding: 10px; text-align: center; background: #f9fafb; }
            .sig-name { font-size: 14px; font-weight: bold; color: #B71C1C; font-style: italic; }
            .sig-id { font-size: 10px; color: #6b7280; margin-top: 2px; }
            .sig-role { font-size: 9px; color: #9ca3af; margin-top: 2px; }
            .sig-verified { font-size: 9px; color: #16a34a; margin-top: 4px; font-weight: 600; }
            .footer { display: flex; justify-content: space-between; padding: 8px 20px; background: #f9fafb; border-top: 1px solid #e5e7eb; font-size: 9px; color: #9ca3af; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>${content}</body>
      </html>
    `);
    win.document.close();
    setTimeout(() => win.print(), 300);
  };

  // Dispatch Manager marks item as "returned" -> sends to Security for gate verification
  const handleSendToSecurityVerify = (item: ReturnRepairItem) => {
    const now = new Date();
    onUpdateItem(item.id, {
      status: "PendingReturnVerify",
      returnInitiatedDate: now.toISOString().split("T")[0],
      returnInitiatedTime: now.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      returnInitiatedBy: currentUser.name,
    });
    toast.success(
      `${item.itemName} — Security ko gate pe verify karne ke liye bhej diya gaya (Gatepass: ${item.gatepassId || item.referenceId})`,
    );
    setShowSendToSecurityDialog(null);
  };

  // Dispatch Manager accepts item after Security verified
  const handleAcceptReturn = () => {
    if (!showAcceptDialog) return;
    const now = new Date();
    onUpdateItem(showAcceptDialog.id, {
      status: "Returned",
      returnDate: now.toISOString().split("T")[0],
      returnTime: now.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      receivedBy: receivedBy.trim() || currentUser.name,
      returnNotes: acceptNotes.trim() || undefined,
    });
    toast.success(
      `${showAcceptDialog.itemName} successfully received — workflow complete!`,
    );
    setShowAcceptDialog(null);
    setAcceptNotes("");
    setReceivedBy(currentUser.name);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onNavigate("dispatch-gatepass")}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex items-center gap-2">
            <Wrench size={20} className="text-[#D32F2F]" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Return &amp; Repair Items
              </h1>
              <p className="text-xs text-gray-500">
                {activeItems.length} active repair(s) &middot;{" "}
                {pendingAcceptItems.length} awaiting your acceptance &middot;{" "}
                {returnedItems.length} returned
              </p>
            </div>
          </div>
        </div>
        <Button
          data-ocid="return_repair.send_for_repair.button"
          onClick={() => setShowAddForm(true)}
          className="bg-[#D32F2F] hover:bg-[#B71C1C] text-white"
          size="sm"
        >
          <Plus size={14} className="mr-2" />
          Send for Repair
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center">
            <Wrench size={18} className="text-orange-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Active Repairs</p>
            <p className="text-2xl font-bold text-gray-900">
              {activeItems.length}
            </p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center ${pendingAcceptItems.length > 0 ? "bg-purple-100" : "bg-gray-100"}`}
          >
            <ShieldCheck
              size={18}
              className={
                pendingAcceptItems.length > 0
                  ? "text-purple-600"
                  : "text-gray-400"
              }
            />
          </div>
          <div>
            <p className="text-xs text-gray-500">Awaiting Accept</p>
            <p
              className={`text-2xl font-bold ${pendingAcceptItems.length > 0 ? "text-purple-600" : "text-gray-900"}`}
            >
              {pendingAcceptItems.length}
            </p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
            <CheckCircle2 size={18} className="text-green-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Returned</p>
            <p className="text-2xl font-bold text-gray-900">
              {returnedItems.length}
            </p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
            <ClipboardList size={18} className="text-blue-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Total</p>
            <p className="text-2xl font-bold text-gray-900">{items.length}</p>
          </div>
        </div>
      </div>

      {/* Pending Accept Alert */}
      {pendingAcceptItems.length > 0 && (
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 flex items-start gap-3">
          <ShieldCheck
            size={18}
            className="text-purple-600 flex-shrink-0 mt-0.5"
          />
          <div>
            <p className="text-sm font-semibold text-purple-800">
              {pendingAcceptItems.length} item
              {pendingAcceptItems.length > 1 ? "s" : ""} Security ne verify kar
              diye — Please accept karein
            </p>
            <p className="text-xs text-purple-700 mt-0.5">
              "Accept Pending" tab mein jaayein aur items receive karein.
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 pt-4 pb-0 gap-3 border-b border-gray-100">
          <div className="flex gap-1">
            {(["active", "pending_accept", "history"] as const).map((tab) => (
              <button
                type="button"
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-all ${
                  activeTab === tab
                    ? "border-[#D32F2F] text-[#D32F2F]"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab === "active" ? (
                  <span className="flex items-center gap-1.5">
                    <Wrench size={13} /> Active Repairs
                    {activeItems.length > 0 && (
                      <span className="bg-orange-100 text-orange-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                        {activeItems.length}
                      </span>
                    )}
                  </span>
                ) : tab === "pending_accept" ? (
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck size={13} /> Accept Pending
                    {pendingAcceptItems.length > 0 && (
                      <span className="bg-purple-100 text-purple-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                        {pendingAcceptItems.length}
                      </span>
                    )}
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 size={13} /> Returned History
                  </span>
                )}
              </button>
            ))}
          </div>
          <div className="pb-3">
            <Input
              data-ocid="return_repair.search.input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search item, vendor, gatepass..."
              className="h-8 text-xs w-52"
            />
          </div>
        </div>

        {/* Active Repairs Tab */}
        {activeTab === "active" && (
          <div className="overflow-x-auto">
            {filteredActive.length === 0 ? (
              <div
                data-ocid="return_repair.active.empty_state"
                className="flex flex-col items-center justify-center py-14 text-gray-400"
              >
                <PackageOpen size={32} className="mb-3 opacity-30" />
                <p className="text-sm">Koi active repair nahi hai</p>
                <p className="text-xs mt-1">
                  "Send for Repair" button se naya item register karein
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="text-xs">Gatepass No.</TableHead>
                    <TableHead className="text-xs">Ref ID</TableHead>
                    <TableHead className="text-xs">Item Name</TableHead>
                    <TableHead className="text-xs">Qty/Unit</TableHead>
                    <TableHead className="text-xs">Vendor</TableHead>
                    <TableHead className="text-xs">Sent Date</TableHead>
                    <TableHead className="text-xs">Expected Return</TableHead>
                    <TableHead className="text-xs">Days Elapsed</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs text-center">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredActive.map((item, idx) => (
                    <TableRow
                      key={item.id}
                      data-ocid={`return_repair.active_item.${idx + 1}`}
                      className="hover:bg-gray-50/60"
                    >
                      <TableCell className="text-xs font-mono text-[#D32F2F] font-semibold py-3">
                        {item.gatepassId || item.referenceId}
                      </TableCell>
                      <TableCell className="text-xs font-mono text-gray-500 py-3">
                        {item.referenceId}
                      </TableCell>
                      <TableCell className="text-xs font-semibold text-gray-900 py-3">
                        {item.itemName}
                      </TableCell>
                      <TableCell className="text-xs text-gray-600 py-3">
                        {item.quantity} {item.unit}
                      </TableCell>
                      <TableCell className="text-xs text-gray-600 py-3">
                        {item.vendor}
                      </TableCell>
                      <TableCell className="text-xs text-gray-600 py-3">
                        {item.dispatchDate}
                        <br />
                        <span className="text-gray-400">
                          {item.dispatchTime}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-gray-500 py-3">
                        {item.expectedReturnDate || (
                          <span className="text-gray-300">\u2014</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs py-3">
                        <span className="inline-flex items-center gap-1 text-xs bg-orange-50 text-orange-700 px-2 py-0.5 rounded-full">
                          {getDaysDiff(item.dispatchDate)}
                        </span>
                      </TableCell>
                      <TableCell className="py-3">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${STATUS_CONFIG[item.status].className}`}
                        >
                          {STATUS_CONFIG[item.status].label}
                        </span>
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="flex items-center gap-1 justify-center">
                          <button
                            type="button"
                            onClick={() => setViewItem(item)}
                            title="View Details"
                            className="p-1.5 rounded hover:bg-blue-50 text-blue-600 transition-colors"
                          >
                            <Eye size={13} />
                          </button>
                          {item.status === "SentForRepair" && (
                            <button
                              type="button"
                              data-ocid={`return_repair.return_aaya.button.${idx + 1}`}
                              onClick={() => setShowSendToSecurityDialog(item)}
                              title="Item Return Aa Gaya — Security Ko Bhejo"
                              className="p-1.5 rounded hover:bg-blue-50 text-blue-600 transition-colors text-[10px] font-semibold flex items-center gap-1"
                            >
                              <Truck size={13} />
                              <span className="hidden sm:inline">
                                Return Aaya
                              </span>
                            </button>
                          )}
                          {item.status === "PendingReturnVerify" && (
                            <span className="text-[10px] text-blue-600 font-medium flex items-center gap-1 px-1">
                              <ShieldCheck size={12} /> Gate pe verify ho raha
                              hai...
                            </span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        )}

        {/* Pending Accept Tab */}
        {activeTab === "pending_accept" && (
          <div className="overflow-x-auto">
            {filteredPendingAccept.length === 0 ? (
              <div
                data-ocid="return_repair.pending_accept.empty_state"
                className="flex flex-col items-center justify-center py-14 text-gray-400"
              >
                <Truck size={32} className="mb-3 opacity-30" />
                <p className="text-sm">
                  Koi item accept karne ke liye pending nahi hai
                </p>
                <p className="text-xs mt-1">
                  Jab Security guard verify karega, items yahan aayenge
                </p>
              </div>
            ) : (
              <>
                <div className="bg-purple-50 border-b border-purple-100 px-4 py-2">
                  <p className="text-xs text-purple-700 font-medium flex items-center gap-1.5">
                    <ShieldCheck size={13} />
                    Security Guard ne in items ko gate pe verify kar diya hai —
                    Please receive karein
                  </p>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="text-xs">Gatepass No.</TableHead>
                      <TableHead className="text-xs">Return Gatepass</TableHead>
                      <TableHead className="text-xs">Item Name</TableHead>
                      <TableHead className="text-xs">Qty/Unit</TableHead>
                      <TableHead className="text-xs">Vendor</TableHead>
                      <TableHead className="text-xs">Repair Sent</TableHead>
                      <TableHead className="text-xs">
                        Security Verified
                      </TableHead>
                      <TableHead className="text-xs">Security Guard</TableHead>
                      <TableHead className="text-xs text-center">
                        Action
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPendingAccept.map((item, idx) => (
                      <TableRow
                        key={item.id}
                        data-ocid={`return_repair.pending_accept_item.${idx + 1}`}
                        className="hover:bg-purple-50/40"
                      >
                        <TableCell className="text-xs font-mono text-[#D32F2F] font-semibold py-3">
                          {item.gatepassId || item.referenceId}
                        </TableCell>
                        <TableCell className="text-xs font-mono text-green-700 font-semibold py-3">
                          {item.returnGatepassId || "\u2014"}
                        </TableCell>
                        <TableCell className="text-xs font-semibold text-gray-900 py-3">
                          {item.itemName}
                        </TableCell>
                        <TableCell className="text-xs text-gray-600 py-3">
                          {item.quantity} {item.unit}
                        </TableCell>
                        <TableCell className="text-xs text-gray-600 py-3">
                          {item.vendor}
                        </TableCell>
                        <TableCell className="text-xs text-gray-600 py-3">
                          {item.dispatchDate} {item.dispatchTime}
                        </TableCell>
                        <TableCell className="text-xs text-gray-600 py-3">
                          {item.securityVerifiedDate}
                          <br />
                          <span className="text-gray-400">
                            {item.securityVerifiedTime}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs py-3">
                          <span className="flex items-center gap-1 text-green-700 font-medium">
                            <ShieldCheck size={11} />
                            {item.securityVerifiedBy}
                          </span>
                          {item.securityNotes && (
                            <p className="text-[10px] text-gray-400 mt-0.5">
                              {item.securityNotes}
                            </p>
                          )}
                        </TableCell>
                        <TableCell className="py-3">
                          <Button
                            data-ocid={`return_repair.receive.button.${idx + 1}`}
                            size="sm"
                            onClick={() => {
                              setShowAcceptDialog(item);
                              setReceivedBy(currentUser.name);
                            }}
                            className="bg-green-600 hover:bg-green-700 text-white text-xs h-8"
                          >
                            <CheckCircle2 size={12} className="mr-1" />
                            Receive Karein
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </>
            )}
          </div>
        )}

        {/* History Tab */}
        {activeTab === "history" && (
          <div className="overflow-x-auto">
            {filteredHistory.length === 0 ? (
              <div
                data-ocid="return_repair.history.empty_state"
                className="flex flex-col items-center justify-center py-14 text-gray-400"
              >
                <RotateCcw size={32} className="mb-3 opacity-30" />
                <p className="text-sm">Koi returned item nahi hai abhi</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="text-xs">Gatepass No.</TableHead>
                    <TableHead className="text-xs">Return Gatepass</TableHead>
                    <TableHead className="text-xs">Item Name</TableHead>
                    <TableHead className="text-xs">Qty/Unit</TableHead>
                    <TableHead className="text-xs">Vendor</TableHead>
                    <TableHead className="text-xs">Sent Date</TableHead>
                    <TableHead className="text-xs">Return Date</TableHead>
                    <TableHead className="text-xs">Total Days</TableHead>
                    <TableHead className="text-xs">Received By</TableHead>
                    <TableHead className="text-xs text-center">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredHistory.map((item, idx) => (
                    <TableRow
                      key={item.id}
                      data-ocid={`return_repair.history_item.${idx + 1}`}
                      className="hover:bg-gray-50/60"
                    >
                      <TableCell className="text-xs font-mono text-[#D32F2F] py-3">
                        {item.gatepassId || item.referenceId}
                      </TableCell>
                      <TableCell className="text-xs font-mono text-green-700 py-3">
                        {item.returnGatepassId || "\u2014"}
                      </TableCell>
                      <TableCell className="text-xs font-semibold text-gray-900 py-3">
                        {item.itemName}
                      </TableCell>
                      <TableCell className="text-xs text-gray-600 py-3">
                        {item.quantity} {item.unit}
                      </TableCell>
                      <TableCell className="text-xs text-gray-600 py-3">
                        {item.vendor}
                      </TableCell>
                      <TableCell className="text-xs text-gray-600 py-3">
                        {item.dispatchDate}
                      </TableCell>
                      <TableCell className="text-xs text-gray-600 py-3">
                        {item.returnDate || "\u2014"}
                      </TableCell>
                      <TableCell className="text-xs py-3">
                        <span className="inline-flex items-center gap-1 text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">
                          {getDaysDiff(item.dispatchDate, item.returnDate)}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-gray-600 py-3">
                        {item.receivedBy || "\u2014"}
                      </TableCell>
                      <TableCell className="py-3 text-center">
                        <button
                          type="button"
                          onClick={() => setViewItem(item)}
                          className="p-1.5 rounded hover:bg-blue-50 text-blue-600 transition-colors"
                        >
                          <Eye size={13} />
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        )}
      </div>

      {/* Add Form Dialog */}
      <Dialog
        open={showAddForm}
        onOpenChange={(open) => {
          if (!open) {
            setShowAddForm(false);
            resetForm();
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wrench size={16} className="text-[#D32F2F]" />
              New Item — Send for Repair
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label className="text-sm font-medium">
                  Created By (Dispatch Manager){" "}
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  data-ocid="return_repair.created_by.input"
                  value={formCreatedBy}
                  onChange={(e) => setFormCreatedBy(e.target.value)}
                  placeholder="Dispatch Manager ka naam"
                  className="mt-1"
                />
                <p className="text-[10px] text-gray-400 mt-1">
                  Auto-filled from login. Yahan naam change kar sakte hain.
                </p>
              </div>
              <div className="col-span-2">
                <Label className="text-sm font-medium">
                  Item Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  data-ocid="return_repair.item_name.input"
                  value={formItemName}
                  onChange={(e) => setFormItemName(e.target.value)}
                  placeholder="e.g. Filling Machine Pump"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-sm font-medium">
                  Quantity <span className="text-red-500">*</span>
                </Label>
                <Input
                  data-ocid="return_repair.quantity.input"
                  value={formQty}
                  onChange={(e) => setFormQty(e.target.value)}
                  placeholder="e.g. 1"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-sm font-medium">
                  Unit <span className="text-red-500">*</span>
                </Label>
                <Input
                  data-ocid="return_repair.unit.input"
                  value={formUnit}
                  onChange={(e) => setFormUnit(e.target.value)}
                  placeholder="e.g. pcs"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-sm font-medium">Batch / Serial No</Label>
                <Input
                  data-ocid="return_repair.batch_no.input"
                  value={formBatchNo}
                  onChange={(e) => setFormBatchNo(e.target.value)}
                  placeholder="e.g. SN-2024-001"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-sm font-medium">
                  Vendor / Service Center{" "}
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  data-ocid="return_repair.vendor.input"
                  value={formVendor}
                  onChange={(e) => setFormVendor(e.target.value)}
                  placeholder="e.g. TechServ Solutions"
                  className="mt-1"
                />
              </div>
              <div className="col-span-2">
                <Label className="text-sm font-medium">
                  Repair Reason <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  data-ocid="return_repair.repair_reason.textarea"
                  value={formReason}
                  onChange={(e) => setFormReason(e.target.value)}
                  placeholder="Describe the issue or reason for repair"
                  className="mt-1 resize-none"
                  rows={2}
                />
              </div>
              <div>
                <Label className="text-sm font-medium">
                  Expected Return Date
                </Label>
                <Input
                  data-ocid="return_repair.expected_return.input"
                  type="date"
                  value={formExpectedReturn}
                  onChange={(e) => setFormExpectedReturn(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
              <p className="text-xs text-blue-700">
                <strong>Note:</strong> Repair Gatepass (RRG-XXXXXXXX-XXXX)
                generate hoga aur Security Guard ko notification jaayegi.
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                data-ocid="return_repair.add_form_cancel.button"
                variant="outline"
                onClick={() => {
                  setShowAddForm(false);
                  resetForm();
                }}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                data-ocid="return_repair.add_form_submit.button"
                onClick={handleAddItem}
                disabled={submitting}
                className="bg-[#D32F2F] hover:bg-[#B71C1C] text-white"
              >
                {submitting
                  ? "Generating Gatepass..."
                  : "Register & Generate Gatepass"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Generated Gatepass Modal */}
      <Dialog
        open={!!generatedGatepass}
        onOpenChange={(open) => !open && setGeneratedGatepass(null)}
      >
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle
              data-ocid="return_repair.gatepass_modal"
              className="flex items-center gap-2"
            >
              <Wrench size={16} className="text-[#D32F2F]" />
              Return / Repair Gatepass Generated
            </DialogTitle>
          </DialogHeader>
          {generatedGatepass && (
            <div className="space-y-4">
              <div ref={passRef}>
                <div className="border-2 border-[#B71C1C] rounded-xl overflow-hidden">
                  {/* Red header */}
                  <div className="bg-[#B71C1C] text-white px-5 py-3 text-center">
                    <p className="text-xs font-semibold opacity-80">
                      SWIFT LIFE SCIENCES
                    </p>
                    <p className="text-sm font-bold">
                      RETURN / REPAIR GATEPASS
                    </p>
                    <p className="text-xs opacity-70">
                      D-1, Sara Industrial Estate, Selaqui, Dehradun
                    </p>
                  </div>

                  {/* Pass ID + barcode */}
                  <div className="px-5 py-4 bg-gray-50 flex items-center justify-between border-b border-gray-200">
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wide">
                        Pass ID
                      </p>
                      <p className="text-lg font-bold text-gray-900">
                        {generatedGatepass.passId}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-gray-400">Barcode</p>
                      <p className="font-mono text-xs font-bold tracking-widest text-gray-700">
                        {generatedGatepass.barcodeNumber}
                      </p>
                      {/* Barcode visual */}
                      <div className="flex gap-px mt-1 justify-end">
                        {Array.from({ length: 28 }).map((_, i) => (
                          <div
                            // biome-ignore lint/suspicious/noArrayIndexKey: barcode bars
                            key={i}
                            className="bg-gray-900"
                            style={{ width: i % 3 === 0 ? 3 : 1.5, height: 24 }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Item details */}
                  <div className="px-5 py-4">
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <p className="text-gray-400 text-[10px] uppercase tracking-wide">
                          Item Name
                        </p>
                        <p className="font-semibold text-gray-900">
                          {generatedGatepass.item.itemName}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-[10px] uppercase tracking-wide">
                          Quantity / Unit
                        </p>
                        <p className="font-semibold text-gray-900">
                          {generatedGatepass.item.quantity}{" "}
                          {generatedGatepass.item.unit}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-[10px] uppercase tracking-wide">
                          Batch / Serial No.
                        </p>
                        <p className="font-semibold text-gray-900">
                          {generatedGatepass.item.batchNo || "\u2014"}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-[10px] uppercase tracking-wide">
                          Dispatched By
                        </p>
                        <p className="font-semibold text-gray-900">
                          {generatedGatepass.createdBy}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-[10px] uppercase tracking-wide">
                          Dispatch Date
                        </p>
                        <p className="font-semibold text-gray-900">
                          {generatedGatepass.createdDate}{" "}
                          {generatedGatepass.createdTime}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-[10px] uppercase tracking-wide">
                          Expected Return
                        </p>
                        <p className="font-semibold text-gray-900">
                          {generatedGatepass.item.expectedReturnDate ||
                            "\u2014"}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-gray-400 text-[10px] uppercase tracking-wide">
                          Repair Reason
                        </p>
                        <p className="font-semibold text-gray-900">
                          {generatedGatepass.item.repairReason}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Vendor destination */}
                  <div className="px-5 py-3 bg-orange-50 border-t border-orange-100">
                    <p className="text-[10px] text-orange-600 uppercase tracking-wide font-semibold">
                      Sent To Vendor / Service Center
                    </p>
                    <p className="text-base font-bold text-orange-800">
                      {generatedGatepass.item.vendor}
                    </p>
                  </div>

                  {/* Digital Signature */}
                  <div className="px-5 py-4 border-t border-gray-200 bg-white">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold mb-3">
                      Authorized By
                    </p>
                    <div className="border border-gray-200 rounded-lg p-3 bg-gray-50 text-center">
                      <p className="text-sm font-bold text-[#B71C1C] italic">
                        {generatedGatepass.createdBy}
                      </p>
                      <p className="text-[10px] text-gray-500 mt-0.5">
                        ID: {generatedGatepass.createdById}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-1">
                        Dispatch Manager
                      </p>
                      <p className="text-[10px] text-green-600 mt-1 font-medium">
                        ✓ Authorized — {generatedGatepass.createdDate}{" "}
                        {generatedGatepass.createdTime}
                      </p>
                    </div>
                    <div className="mt-3 border border-dashed border-gray-300 rounded-lg p-3 bg-gray-50 text-center">
                      <p className="text-[10px] text-gray-400 mb-1">
                        Security Guard Verification
                      </p>
                      <p className="text-xs text-gray-400 italic">
                        Pending gate verification...
                      </p>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="px-5 py-3 bg-gray-50 border-t border-gray-200 flex justify-between text-[10px] text-gray-500">
                    <span>
                      Dispatch Manager: {generatedGatepass.createdBy} (
                      {generatedGatepass.createdById})
                    </span>
                    <span>
                      {generatedGatepass.createdDate} &bull;{" "}
                      {generatedGatepass.createdTime}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  data-ocid="return_repair.gatepass_close.button"
                  variant="outline"
                  size="sm"
                  onClick={() => setGeneratedGatepass(null)}
                >
                  Close
                </Button>
                <Button
                  data-ocid="return_repair.gatepass_print.button"
                  size="sm"
                  className="bg-[#D32F2F] hover:bg-[#B71C1C] text-white"
                  onClick={handlePrint}
                >
                  <Printer size={13} className="mr-2" />
                  Print Gatepass
                </Button>
                <Button
                  data-ocid="return_repair.gatepass_download.button"
                  size="sm"
                  variant="outline"
                  onClick={handlePrint}
                >
                  <Download size={13} className="mr-2" />
                  Download
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Send to Security Verify Dialog */}
      <Dialog
        open={!!showSendToSecurityDialog}
        onOpenChange={(open) => !open && setShowSendToSecurityDialog(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Truck size={16} className="text-blue-600" />
              Item Return Aaya — Security Ko Notify Karein
            </DialogTitle>
          </DialogHeader>
          {showSendToSecurityDialog && (
            <div className="space-y-4 mt-2">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
                <p className="font-semibold text-gray-900">
                  {showSendToSecurityDialog.itemName}
                </p>
                <p className="text-gray-500 text-xs mt-1">
                  {showSendToSecurityDialog.quantity}{" "}
                  {showSendToSecurityDialog.unit} &middot;{" "}
                  {showSendToSecurityDialog.vendor}
                </p>
                <p className="text-gray-400 text-xs mt-0.5">
                  Repair ke liye bheja: {showSendToSecurityDialog.dispatchDate}{" "}
                  {showSendToSecurityDialog.dispatchTime}
                </p>
                {showSendToSecurityDialog.gatepassId && (
                  <p className="text-[#D32F2F] text-xs font-mono font-semibold mt-1">
                    Gatepass: {showSendToSecurityDialog.gatepassId}
                  </p>
                )}
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-xs text-yellow-800 font-medium">
                  Yeh karne ke baad kya hoga:
                </p>
                <ul className="text-xs text-yellow-700 mt-1 space-y-1 list-disc list-inside">
                  <li>
                    Security Guard ko gate pe "Return Verify" alert aayega
                  </li>
                  <li>Security Gatepass No. se item verify karega</li>
                  <li>
                    Security verify karne ke baad Return Gatepass generate hoga
                  </li>
                  <li>Aapko "Accept Pending" mein notification aayegi</li>
                </ul>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  data-ocid="return_repair.send_to_security_cancel.button"
                  variant="outline"
                  onClick={() => setShowSendToSecurityDialog(null)}
                >
                  Cancel
                </Button>
                <Button
                  data-ocid="return_repair.send_to_security_confirm.button"
                  onClick={() =>
                    handleSendToSecurityVerify(showSendToSecurityDialog)
                  }
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Truck size={14} className="mr-1" /> Security Ko Bhejo
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Accept Return Dialog */}
      <Dialog
        open={!!showAcceptDialog}
        onOpenChange={(open) => {
          if (!open) {
            setShowAcceptDialog(null);
            setAcceptNotes("");
            setReceivedBy(currentUser.name);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-green-600" />
              Item Receive Karein (Final Confirmation)
            </DialogTitle>
          </DialogHeader>
          {showAcceptDialog && (
            <div className="space-y-4 mt-2">
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm">
                <p className="font-semibold text-gray-900">
                  {showAcceptDialog.itemName}
                </p>
                <p className="text-gray-500 text-xs mt-1">
                  {showAcceptDialog.quantity} {showAcceptDialog.unit} &middot;{" "}
                  {showAcceptDialog.vendor}
                </p>
                {showAcceptDialog.gatepassId && (
                  <p className="text-[#D32F2F] text-xs font-mono font-semibold mt-1">
                    Repair Gatepass: {showAcceptDialog.gatepassId}
                  </p>
                )}
                {showAcceptDialog.returnGatepassId && (
                  <p className="text-green-700 text-xs font-mono font-semibold mt-0.5">
                    Return Gatepass: {showAcceptDialog.returnGatepassId}
                  </p>
                )}
                <div className="mt-2 flex items-center gap-1 text-green-700 text-xs font-medium">
                  <ShieldCheck size={12} />
                  Security Verified by: {showAcceptDialog.securityVerifiedBy} on{" "}
                  {showAcceptDialog.securityVerifiedDate}
                </div>
                {showAcceptDialog.securityNotes && (
                  <p className="text-xs text-gray-500 mt-1">
                    Guard Notes: {showAcceptDialog.securityNotes}
                  </p>
                )}
              </div>
              <div>
                <Label className="text-sm font-medium">Received By</Label>
                <Input
                  data-ocid="return_repair.received_by.input"
                  value={receivedBy}
                  onChange={(e) => setReceivedBy(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-sm font-medium">
                  Return Notes (optional)
                </Label>
                <Textarea
                  data-ocid="return_repair.return_notes.textarea"
                  value={acceptNotes}
                  onChange={(e) => setAcceptNotes(e.target.value)}
                  placeholder="e.g. Fully repaired, tested OK"
                  className="mt-1 resize-none"
                  rows={2}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  data-ocid="return_repair.accept_cancel.button"
                  variant="outline"
                  onClick={() => {
                    setShowAcceptDialog(null);
                    setAcceptNotes("");
                    setReceivedBy(currentUser.name);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  data-ocid="return_repair.accept_confirm.button"
                  onClick={handleAcceptReturn}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <CheckCircle2 size={14} className="mr-1" /> Confirm Receive
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* View Detail Dialog */}
      <Dialog
        open={!!viewItem}
        onOpenChange={(open) => !open && setViewItem(null)}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Item Details — {viewItem?.gatepassId || viewItem?.referenceId}
            </DialogTitle>
          </DialogHeader>
          {viewItem && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {[
                  ["Gatepass No.", viewItem.gatepassId || viewItem.referenceId],
                  ["Return Gatepass", viewItem.returnGatepassId || "\u2014"],
                  ["Item Name", viewItem.itemName],
                  ["Qty / Unit", `${viewItem.quantity} ${viewItem.unit}`],
                  ["Batch / Serial", viewItem.batchNo || "\u2014"],
                  ["Vendor", viewItem.vendor],
                  ["Repair Reason", viewItem.repairReason],
                  ["Dispatched By", viewItem.dispatchedBy],
                  [
                    "Sent Date",
                    `${viewItem.dispatchDate} ${viewItem.dispatchTime}`,
                  ],
                  ["Expected Return", viewItem.expectedReturnDate || "\u2014"],
                  [
                    "Status",
                    <span
                      key="s"
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${STATUS_CONFIG[viewItem.status].className}`}
                    >
                      {STATUS_CONFIG[viewItem.status].label}
                    </span>,
                  ],
                  ...(viewItem.securityVerifiedBy
                    ? [
                        ["Security Guard", viewItem.securityVerifiedBy],
                        [
                          "Gate Verified On",
                          `${viewItem.securityVerifiedDate} ${viewItem.securityVerifiedTime}`,
                        ],
                        ...(viewItem.securityNotes
                          ? [["Guard Notes", viewItem.securityNotes]]
                          : []),
                      ]
                    : []),
                  ...(viewItem.status === "Returned"
                    ? [
                        [
                          "Return Date",
                          `${viewItem.returnDate} ${viewItem.returnTime}`,
                        ],
                        ["Received By", viewItem.receivedBy || "\u2014"],
                        ["Return Notes", viewItem.returnNotes || "\u2014"],
                        [
                          "Total Days",
                          getDaysDiff(
                            viewItem.dispatchDate,
                            viewItem.returnDate,
                          ),
                        ],
                      ]
                    : []),
                ].map(([label, value]) => (
                  <div
                    key={String(label)}
                    className="bg-gray-50 rounded-lg p-2.5"
                  >
                    <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wide">
                      {String(label)}
                    </p>
                    <div className="text-sm text-gray-900 mt-0.5 font-medium">
                      {value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
