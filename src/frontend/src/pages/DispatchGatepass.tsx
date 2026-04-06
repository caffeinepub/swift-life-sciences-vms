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
  CheckCircle2,
  ClipboardList,
  Eye,
  Package,
  PackageOpen,
  Plus,
  Printer,
  RotateCcw,
  ShieldCheck,
  Truck,
  Wrench,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type {
  AppView,
  CurrentUser,
  DepartmentTransfer,
  DispatchGatepass,
  DispatchStatus,
  ReturnRepairItem,
  ReturnRepairStatus,
} from "../types";

interface DispatchGatepassProps {
  gatepasses: DispatchGatepass[];
  currentUser: CurrentUser;
  onNavigate: (view: AppView) => void;
  onCreateGatepass: (gp: DispatchGatepass) => void;
  returnRepairItems: ReturnRepairItem[];
  onAddReturnRepairItem: (item: ReturnRepairItem) => void;
  onUpdateReturnRepairItem: (
    id: string,
    updates: Partial<ReturnRepairItem>,
  ) => void;
  departmentTransfers?: DepartmentTransfer[];
  onUpdateDepartmentTransfer?: (
    id: string,
    updates: Partial<DepartmentTransfer>,
  ) => void;
}

const STATUS_COLORS: Record<DispatchStatus, string> = {
  Draft: "bg-gray-100 text-gray-600 border-gray-200",
  Submitted: "bg-yellow-100 text-yellow-700 border-yellow-200",
  SecurityVerifying: "bg-blue-100 text-blue-700 border-blue-200",
  Released: "bg-green-100 text-green-700 border-green-200",
  Rejected: "bg-red-100 text-red-700 border-red-200",
};

const RR_STATUS_CONFIG: Record<
  ReturnRepairStatus,
  { label: string; className: string }
> = {
  PendingSecurityOut: {
    label: "Security Verify Pending",
    className: "bg-yellow-100 text-yellow-700 border-yellow-200",
  },
  SentForRepair: {
    label: "Repair Mein (In Process)",
    className: "bg-orange-100 text-orange-700 border-orange-200",
  },
  PendingReturnVerify: {
    label: "Wapas Aa Raha — Gate Verify Pending",
    className: "bg-blue-100 text-blue-700 border-blue-200",
  },
  PendingDispatchAccept: {
    label: "Verify Ho Gaya — Accept Karein",
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
  if (diff < 0) return "—";
  return `${diff} day${diff !== 1 ? "s" : ""}`;
}

function BarcodeDisplay({ code }: { code: string }) {
  const pattern = code
    .split("")
    .map((c) => c.charCodeAt(0))
    .join("");
  const bars: { width: number; isBlack: boolean; idx: number }[] = [];
  for (let i = 0; i < 60; i++) {
    const charCode = pattern.charCodeAt(i % pattern.length);
    const width = 1 + (charCode % 3);
    const isBlack = charCode % 2 === 0;
    bars.push({ width, isBlack, idx: i });
  }
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex items-end gap-[1px] h-12 bg-white px-2 py-1 border border-gray-200 rounded">
        {bars.map((bar) => (
          <div
            key={bar.idx}
            style={{
              width: `${bar.width * 2}px`,
              height: "100%",
              display: "inline-block",
              backgroundColor: bar.isBlack ? "#111" : "transparent",
            }}
          />
        ))}
      </div>
      <p className="text-[10px] font-mono text-gray-600 tracking-widest">
        {code}
      </p>
    </div>
  );
}

// Shared gatepass print HTML generator — used for ALL gatepass types
function buildGatepassPrintHTML(options: {
  passId: string;
  passType: string;
  barcodeNumber: string;
  fields: Array<[string, string]>;
  itemsTable?: string;
  signatureName?: string;
  signatureId?: string;
  signatureRole?: string;
  signatureVerified?: string;
  orangeRef?: { label: string; value: string };
  copies?: number;
}): string {
  const {
    passId,
    passType,
    barcodeNumber,
    fields,
    itemsTable,
    signatureName,
    signatureId,
    signatureRole,
    signatureVerified,
    orangeRef,
    copies = 1,
  } = options;

  // Build barcode bars
  const pattern = barcodeNumber
    .split("")
    .map((c) => c.charCodeAt(0))
    .join("");
  let barHtml = "";
  for (let i = 0; i < 42; i++) {
    const cc = pattern.charCodeAt(i % pattern.length);
    const w = cc % 2 === 0 ? 3 : 1.5;
    barHtml += `<div class="bar" style="width:${w}px"></div>`;
  }

  const signatureSection =
    signatureName && signatureId
      ? `
    <div class="sig-section">
      <div class="sig-label">DIGITAL SIGNATURE</div>
      <div class="sig-box">
        <div class="sig-name">${signatureName}</div>
        <div class="sig-id">ID: ${signatureId}</div>
        <div class="sig-role">${signatureRole || ""}</div>
        ${signatureVerified ? `<div class="sig-verified">&#10003; ${signatureVerified}</div>` : ""}
      </div>
    </div>`
      : "";

  const orangeSection = orangeRef
    ? `
    <div class="orange-ref">
      <div class="orange-label">${orangeRef.label}</div>
      <div class="orange-val">${orangeRef.value}</div>
    </div>`
    : "";

  const fieldsHtml = fields
    .map(
      ([label, value]) =>
        `<div><div class="field-label">${label}</div><div class="field-val">${value}</div></div>`,
    )
    .join("");

  const singlePass = `
    <div class="pass">
      <div class="header">
        <div class="company">SWIFT LIFE SCIENCES PVT. LTD.</div>
        <div class="title">${passType}</div>
        <div class="addr">D-1, Sara Industrial Estate, Selaqui, Dehradun | Ph: 0135 269 9975</div>
      </div>
      <div class="pass-id-row">
        <div>
          <div class="pass-id-label">GATEPASS ID</div>
          <div class="pass-id-val">${passId}</div>
        </div>
        <div class="text-right">
          <div class="barcode-text">${barcodeNumber}</div>
          <div class="barcode-bars">${barHtml}</div>
        </div>
      </div>
      <div class="details">
        <div class="grid">${fieldsHtml}</div>
        ${itemsTable || ""}
      </div>
      ${orangeSection}
      ${signatureSection}
      <div class="footer">
        <span>This pass must be surrendered at exit. Swift Life Sciences Pvt. Ltd.</span>
        <span>${new Date().toLocaleDateString("en-IN")}</span>
      </div>
    </div>`;

  const passesHtml = Array(copies)
    .fill(singlePass)
    .join(
      '<div class="cut-line">✂ — — — — — — — — — — — — — — — — — — — — — — — — — — — — — — — — — — — —</div>',
    );

  return `<html><head><title>${passType} — ${passId}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: Arial, sans-serif; margin: 0; padding: 6px; background: white; }
    .pass { border: 1.5px solid #B71C1C; max-width: 100%; margin: 0 auto; border-radius: 6px; overflow: hidden; page-break-inside: avoid; }
    .header { background: #B71C1C; color: white; text-align: center; padding: 6px 12px; }
    .company { font-size: 10px; font-weight: bold; opacity: 0.9; }
    .title { font-size: 11px; font-weight: bold; margin: 1px 0; }
    .addr { font-size: 7px; opacity: 0.75; }
    .pass-id-row { display: flex; justify-content: space-between; align-items: center; padding: 5px 12px; background: #f9f9f9; border-bottom: 1px solid #e5e7eb; }
    .pass-id-label { font-size: 6.5px; color: #888; text-transform: uppercase; letter-spacing: 0.8px; }
    .pass-id-val { font-size: 12px; font-weight: bold; color: #1f2937; }
    .barcode-text { font-family: monospace; font-size: 8px; font-weight: bold; letter-spacing: 1.5px; color: #374151; text-align: right; }
    .barcode-bars { display: flex; gap: 1px; margin-top: 2px; justify-content: flex-end; }
    .bar { background: #111; display: inline-block; height: 14px; }
    .details { padding: 6px 12px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; }
    .field-label { font-size: 6.5px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.4px; }
    .field-val { font-size: 9px; font-weight: 600; color: #111; margin-top: 1px; }
    table.items { width: 100%; border-collapse: collapse; margin-top: 5px; font-size: 8px; }
    table.items th { background: #f5f5f5; padding: 2.5px 5px; text-align: left; border: 1px solid #ddd; font-size: 7.5px; }
    table.items td { padding: 2.5px 5px; border: 1px solid #ddd; }
    .orange-ref { padding: 4px 12px; background: #FFF7ED; border-top: 1px solid #FED7AA; }
    .orange-label { font-size: 7px; color: #C2410C; text-transform: uppercase; letter-spacing: 0.8px; font-weight: bold; }
    .orange-val { font-size: 10px; font-weight: bold; color: #9a3412; margin-top: 1px; }
    .sig-section { padding: 5px 12px; border-top: 1px solid #e5e7eb; }
    .sig-label { font-size: 6.5px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.8px; font-weight: bold; margin-bottom: 3px; }
    .sig-box { border: 1px solid #d1d5db; border-radius: 4px; padding: 5px; text-align: center; background: #f9fafb; }
    .sig-name { font-size: 10px; font-weight: bold; color: #B71C1C; font-style: italic; }
    .sig-id { font-size: 7.5px; color: #6b7280; margin-top: 1px; }
    .sig-role { font-size: 7px; color: #9ca3af; }
    .sig-verified { font-size: 7.5px; color: #16a34a; margin-top: 2px; font-weight: 600; }
    .footer { display: flex; justify-content: space-between; padding: 4px 12px; background: #f9fafb; border-top: 1px solid #e5e7eb; font-size: 7px; color: #9ca3af; }
    .cut-line { text-align: center; font-size: 8px; color: #bbb; margin: 3px 0; }
    @media print { @page { margin: 8mm; size: A4; } .no-print { display: none; } }
  </style></head><body>${passesHtml}</body></html>`;
}

export function DispatchGatepassList({
  gatepasses,
  currentUser,
  onNavigate,
  returnRepairItems,
  onAddReturnRepairItem,
  onUpdateReturnRepairItem,
  departmentTransfers = [],
  onUpdateDepartmentTransfer,
}: DispatchGatepassProps) {
  const [activeTab, setActiveTab] = useState<
    | "dispatch"
    | "repair_active"
    | "repair_accept"
    | "repair_history"
    | "inward_materials"
  >("dispatch");
  const [viewGp, setViewGp] = useState<DispatchGatepass | null>(null);
  const [search, setSearch] = useState("");
  const [showAddRepairForm, setShowAddRepairForm] = useState(false);
  const [showAcceptDialog, setShowAcceptDialog] =
    useState<ReturnRepairItem | null>(null);
  const [acceptNotes, setAcceptNotes] = useState("");
  const [receivedBy, setReceivedBy] = useState(currentUser.name);
  const [viewRRItem, setViewRRItem] = useState<ReturnRepairItem | null>(null);

  // Repair form state
  const [formItemName, setFormItemName] = useState("");
  const [formQty, setFormQty] = useState("");
  const [formUnit, setFormUnit] = useState("");
  const [formBatchNo, setFormBatchNo] = useState("");
  const [formVendor, setFormVendor] = useState("");
  const [formReason, setFormReason] = useState("");
  const [formExpectedReturn, setFormExpectedReturn] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const activeRepairItems = returnRepairItems.filter(
    (i) =>
      i.status === "PendingSecurityOut" ||
      i.status === "SentForRepair" ||
      i.status === "PendingReturnVerify",
  );
  const pendingAcceptItems = returnRepairItems.filter(
    (i) => i.status === "PendingDispatchAccept",
  );
  const returnedItems = returnRepairItems.filter(
    (i) => i.status === "Returned",
  );

  // Filter department transfers for Dispatch Manager (Bug 1 Fix)
  const inwardMaterials = departmentTransfers.filter(
    (t) => t.department === "Dispatch",
  );

  const filterGP = (gp: DispatchGatepass) => {
    const q = search.toLowerCase();
    return (
      gp.passId.toLowerCase().includes(q) ||
      gp.destination.toLowerCase().includes(q) ||
      gp.vehicleNo.toLowerCase().includes(q) ||
      gp.driverName.toLowerCase().includes(q)
    );
  };

  const filterRR = (i: ReturnRepairItem) => {
    const q = search.toLowerCase();
    return (
      i.itemName.toLowerCase().includes(q) ||
      i.vendor.toLowerCase().includes(q) ||
      (i.gatepassId || "").toLowerCase().includes(q)
    );
  };

  const resetRepairForm = () => {
    setFormItemName("");
    setFormQty("");
    setFormUnit("");
    setFormBatchNo("");
    setFormVendor("");
    setFormReason("");
    setFormExpectedReturn("");
  };

  const handleAddRepairItem = async () => {
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
    await new Promise((r) => setTimeout(r, 300));
    const now = new Date();
    const dateStr = now.toISOString().split("T")[0].replace(/-/g, "");
    const seq = String(Math.floor(Math.random() * 9000) + 1000);
    const newItem: ReturnRepairItem = {
      id: `RR-${dateStr}-${seq}`,
      referenceId: `RR-${dateStr}-${seq}`,
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
      dispatchedBy: currentUser.name,
      expectedReturnDate: formExpectedReturn || undefined,
      status: "PendingSecurityOut",
    };
    onAddReturnRepairItem(newItem);
    setShowAddRepairForm(false);
    resetRepairForm();
    setSubmitting(false);
    toast.success(
      "Item Security Guard ko verify ke liye bhej diya — Gatepass Gate pe banega",
    );
  };

  const handleAcceptReturn = () => {
    if (!showAcceptDialog) return;
    const now = new Date();
    onUpdateReturnRepairItem(showAcceptDialog.id, {
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

  const handlePrintDispatchGatepass = (gp: DispatchGatepass, copies = 1) => {
    const itemsTableHtml =
      gp.items.length > 0
        ? `
      <table class="items">
        <tr><th>#</th><th>Item Name</th><th>Qty</th><th>Unit</th><th>Batch No</th><th>Description</th></tr>
        ${gp.items.map((it, i) => `<tr><td>${i + 1}</td><td>${it.itemName}</td><td>${it.quantity}</td><td>${it.unit}</td><td>${it.batchNo}</td><td>${it.description}</td></tr>`).join("")}
      </table>`
        : "";

    const html = buildGatepassPrintHTML({
      passId: gp.passId,
      passType: "DISPATCH GATE PASS",
      barcodeNumber: gp.barcodeNumber,
      fields: [
        ["Vehicle No", gp.vehicleNo],
        ["Driver", gp.driverName],
        ["Destination", gp.destination],
        ["Purpose", gp.purpose],
        ["Created By", gp.createdBy],
        ["Date", `${gp.date} ${gp.createdTime}`],
        ["Status", gp.status],
        ["Items", `${gp.items.length} item(s)`],
      ],
      itemsTable: itemsTableHtml,
      copies,
    });
    const win = window.open("", "_blank", "width=620,height=700");
    if (!win) return;
    win.document.write(html);
    win.document.close();
    setTimeout(() => win.print(), 300);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Truck size={20} className="text-[#D32F2F]" />
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              Dispatch & Repair Management
            </h1>
            <p className="text-xs text-gray-500">
              {gatepasses.length} dispatch gatepass(es) &middot;{" "}
              {activeRepairItems.length} active repair(s)
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === "repair_active" ||
          activeTab === "repair_accept" ||
          activeTab === "repair_history" ||
          activeTab === "inward_materials" ? (
            <Button
              onClick={() => setShowAddRepairForm(true)}
              className="bg-[#D32F2F] hover:bg-[#B71C1C] text-white"
              size="sm"
            >
              <Plus size={14} className="mr-2" />
              Send for Repair
            </Button>
          ) : (
            <Button
              data-ocid="dispatch.create.button"
              onClick={() => onNavigate("dispatch-gatepass-form")}
              className="bg-[#D32F2F] hover:bg-[#B71C1C] text-white"
              size="sm"
            >
              <Plus size={14} className="mr-2" />
              Create New Gatepass
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
            <Truck size={18} className="text-[#D32F2F]" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Dispatch Passes</p>
            <p className="text-2xl font-bold text-gray-900">
              {gatepasses.length}
            </p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center">
            <Wrench size={18} className="text-orange-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Active Repairs</p>
            <p className="text-2xl font-bold text-gray-900">
              {activeRepairItems.length}
            </p>
          </div>
        </div>
        <div
          className={`bg-white rounded-xl border shadow-sm p-4 flex items-center gap-3 ${pendingAcceptItems.length > 0 ? "border-purple-200" : "border-gray-100"}`}
        >
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
            <p className="text-xs text-gray-500">Accept Pending</p>
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
      </div>

      {/* Alert for pending accept */}
      {pendingAcceptItems.length > 0 && (
        <button
          type="button"
          onClick={() => setActiveTab("repair_accept")}
          className="w-full bg-purple-50 border border-purple-200 rounded-xl p-4 flex items-center justify-between cursor-pointer hover:bg-purple-100 transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <ShieldCheck size={18} className="text-purple-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-purple-800">
                {pendingAcceptItems.length} item
                {pendingAcceptItems.length !== 1 ? "s" : ""} Security ne verify
                kar diye — Accept karein
              </p>
              <p className="text-xs text-purple-600">
                "Accept Pending" tab mein jaayein
              </p>
            </div>
          </div>
          <RotateCcw size={16} className="text-purple-400" />
        </button>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 pt-4 pb-0 border-b border-gray-100 gap-3">
          <div className="flex gap-1 overflow-x-auto">
            {(
              [
                "dispatch",
                "repair_active",
                "repair_accept",
                "repair_history",
                "inward_materials",
              ] as const
            ).map((tab) => (
              <button
                type="button"
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-2 text-xs font-medium rounded-t-lg border-b-2 transition-all whitespace-nowrap ${
                  activeTab === tab
                    ? "border-[#D32F2F] text-[#D32F2F]"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab === "dispatch" && (
                  <span className="flex items-center gap-1.5">
                    <Truck size={12} /> Dispatch Gatepasses
                    {gatepasses.length > 0 && (
                      <span className="bg-red-100 text-red-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                        {gatepasses.length}
                      </span>
                    )}
                  </span>
                )}
                {tab === "repair_active" && (
                  <span className="flex items-center gap-1.5">
                    <Wrench size={12} /> Active Repairs
                    {activeRepairItems.length > 0 && (
                      <span className="bg-orange-100 text-orange-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                        {activeRepairItems.length}
                      </span>
                    )}
                  </span>
                )}
                {tab === "repair_accept" && (
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck size={12} /> Accept Pending
                    {pendingAcceptItems.length > 0 && (
                      <span className="bg-purple-100 text-purple-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                        {pendingAcceptItems.length}
                      </span>
                    )}
                  </span>
                )}
                {tab === "repair_history" && (
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 size={12} /> Return History
                  </span>
                )}
                {tab === "inward_materials" && (
                  <span className="flex items-center gap-1.5">
                    <PackageOpen size={12} /> Inward Materials
                    {inwardMaterials.filter((t) => !t.acknowledged).length >
                      0 && (
                      <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                        {inwardMaterials.filter((t) => !t.acknowledged).length}
                      </span>
                    )}
                  </span>
                )}
              </button>
            ))}
          </div>
          <div className="pb-3">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="h-8 text-xs w-44"
            />
          </div>
        </div>

        {/* Dispatch Gatepasses Tab */}
        {activeTab === "dispatch" && (
          <div className="overflow-x-auto">
            {gatepasses.filter(filterGP).length === 0 ? (
              <div
                data-ocid="dispatch.empty_state"
                className="flex flex-col items-center justify-center py-14 text-gray-400"
              >
                <Package size={32} className="mb-3 opacity-30" />
                <p className="text-sm">No dispatch gatepasses yet</p>
                <p className="text-xs mt-1">
                  Create your first gatepass to get started
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="text-xs">Pass ID</TableHead>
                    <TableHead className="text-xs">Destination</TableHead>
                    <TableHead className="text-xs">Vehicle</TableHead>
                    <TableHead className="text-xs">Driver</TableHead>
                    <TableHead className="text-xs">Items</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs">Date</TableHead>
                    <TableHead className="text-xs text-center">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {gatepasses.filter(filterGP).map((gp, idx) => (
                    <TableRow
                      key={gp.id}
                      data-ocid={`dispatch.item.${idx + 1}`}
                      className="hover:bg-gray-50/60"
                    >
                      <TableCell className="text-xs font-mono text-gray-500 py-3">
                        {gp.passId}
                      </TableCell>
                      <TableCell className="text-xs font-semibold text-gray-900 py-3">
                        {gp.destination}
                      </TableCell>
                      <TableCell className="text-xs text-gray-600 py-3">
                        {gp.vehicleNo}
                      </TableCell>
                      <TableCell className="text-xs text-gray-600 py-3">
                        {gp.driverName}
                      </TableCell>
                      <TableCell className="py-3">
                        <span className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">
                          <Package size={10} />
                          {gp.items.length}
                        </span>
                      </TableCell>
                      <TableCell className="py-3">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${STATUS_COLORS[gp.status]}`}
                        >
                          {gp.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-gray-500 py-3">
                        {gp.date}
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="flex items-center gap-1 justify-center">
                          <button
                            type="button"
                            onClick={() => setViewGp(gp)}
                            title="View"
                            className="p-1.5 rounded hover:bg-blue-50 text-blue-600"
                          >
                            <Eye size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handlePrintDispatchGatepass(gp, 1)}
                            title="Print 1 Copy"
                            className="p-1.5 rounded hover:bg-gray-100 text-gray-600"
                          >
                            <Printer size={13} />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        )}

        {/* Active Repairs Tab */}
        {activeTab === "repair_active" && (
          <div className="overflow-x-auto">
            {activeRepairItems.filter(filterRR).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 text-gray-400">
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
                  {activeRepairItems.filter(filterRR).map((item, idx) => (
                    <TableRow
                      key={item.id}
                      data-ocid={`repair.active_item.${idx + 1}`}
                      className="hover:bg-gray-50/60"
                    >
                      <TableCell className="text-xs font-mono text-[#D32F2F] font-semibold py-3">
                        {item.gatepassId || item.referenceId}
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
                          <span className="text-gray-300">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs py-3">
                        <span className="inline-flex items-center gap-1 text-xs bg-orange-50 text-orange-700 px-2 py-0.5 rounded-full">
                          {getDaysDiff(item.dispatchDate)}
                        </span>
                      </TableCell>
                      <TableCell className="py-3">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${RR_STATUS_CONFIG[item.status].className}`}
                        >
                          {RR_STATUS_CONFIG[item.status].label}
                        </span>
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="flex items-center gap-1 justify-center">
                          <button
                            type="button"
                            onClick={() => setViewRRItem(item)}
                            className="p-1.5 rounded hover:bg-blue-50 text-blue-600"
                          >
                            <Eye size={13} />
                          </button>
                          {item.status === "PendingSecurityOut" && (
                            <span className="text-[10px] text-yellow-700 font-medium flex items-center gap-1 px-1 bg-yellow-50 rounded-full py-0.5">
                              <ShieldCheck size={12} /> Security Verify
                              Pending...
                            </span>
                          )}
                          {item.status === "SentForRepair" && (
                            <span className="text-[10px] text-orange-700 font-medium flex items-center gap-1 px-2 bg-orange-50 rounded-full py-1 border border-orange-200">
                              <RotateCcw size={11} /> Security Gate Entry ka
                              Wait...
                            </span>
                          )}
                          {item.status === "PendingReturnVerify" && (
                            <span className="text-[10px] text-blue-600 font-medium flex items-center gap-1 px-2 bg-blue-50 rounded-full py-1 border border-blue-200">
                              <ShieldCheck size={11} /> Gate Verify Ho Raha
                              Hai...
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

        {/* Accept Pending Tab */}
        {activeTab === "repair_accept" && (
          <div className="overflow-x-auto">
            {pendingAcceptItems.filter(filterRR).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 text-gray-400">
                <Truck size={32} className="mb-3 opacity-30" />
                <p className="text-sm">
                  Koi item accept karne ke liye pending nahi
                </p>
                <p className="text-xs mt-1">
                  Jab Security guard verify karega, items yahan aayenge
                </p>
              </div>
            ) : (
              <>
                <div className="bg-purple-50 border-b border-purple-100 px-4 py-2">
                  <p className="text-xs text-purple-700 font-medium flex items-center gap-1.5">
                    <ShieldCheck size={13} /> Security Guard ne in items ko gate
                    pe verify kar diya — Please receive karein
                  </p>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="text-xs">Repair Gatepass</TableHead>
                      <TableHead className="text-xs">Return Gatepass</TableHead>
                      <TableHead className="text-xs">Item Name</TableHead>
                      <TableHead className="text-xs">Qty/Unit</TableHead>
                      <TableHead className="text-xs">Vendor</TableHead>
                      <TableHead className="text-xs">
                        Security Verified
                      </TableHead>
                      <TableHead className="text-xs">Guard</TableHead>
                      <TableHead className="text-xs text-center">
                        Action
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingAcceptItems.filter(filterRR).map((item, idx) => (
                      <TableRow
                        key={item.id}
                        data-ocid={`repair.accept_item.${idx + 1}`}
                        className="hover:bg-purple-50/40"
                      >
                        <TableCell className="text-xs font-mono text-[#D32F2F] font-semibold py-3">
                          {item.gatepassId || item.referenceId}
                        </TableCell>
                        <TableCell className="text-xs font-mono text-green-700 font-semibold py-3">
                          {item.returnGatepassId || "—"}
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
                            data-ocid={`repair.receive.button.${idx + 1}`}
                            size="sm"
                            onClick={() => {
                              setShowAcceptDialog(item);
                              setReceivedBy(currentUser.name);
                            }}
                            className="bg-green-600 hover:bg-green-700 text-white text-xs h-8"
                          >
                            <CheckCircle2 size={12} className="mr-1" /> Receive
                            Karein
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

        {/* Return History Tab */}
        {activeTab === "repair_history" && (
          <div className="overflow-x-auto">
            {returnedItems.filter(filterRR).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 text-gray-400">
                <RotateCcw size={32} className="mb-3 opacity-30" />
                <p className="text-sm">Koi returned item nahi hai abhi</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="text-xs">Repair Gatepass</TableHead>
                    <TableHead className="text-xs">Return Gatepass</TableHead>
                    <TableHead className="text-xs">Item Name</TableHead>
                    <TableHead className="text-xs">Qty/Unit</TableHead>
                    <TableHead className="text-xs">Vendor</TableHead>
                    <TableHead className="text-xs">Sent Date</TableHead>
                    <TableHead className="text-xs">Return Date</TableHead>
                    <TableHead className="text-xs">Total Days</TableHead>
                    <TableHead className="text-xs">Received By</TableHead>
                    <TableHead className="text-xs text-center">View</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {returnedItems.filter(filterRR).map((item, idx) => (
                    <TableRow
                      key={item.id}
                      data-ocid={`repair.history_item.${idx + 1}`}
                      className="hover:bg-gray-50/60"
                    >
                      <TableCell className="text-xs font-mono text-[#D32F2F] py-3">
                        {item.gatepassId || item.referenceId}
                      </TableCell>
                      <TableCell className="text-xs font-mono text-green-700 py-3">
                        {item.returnGatepassId || "—"}
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
                        {item.returnDate || "—"}
                      </TableCell>
                      <TableCell className="text-xs py-3">
                        <span className="inline-flex items-center gap-1 text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">
                          {getDaysDiff(item.dispatchDate, item.returnDate)}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-gray-600 py-3">
                        {item.receivedBy || "—"}
                      </TableCell>
                      <TableCell className="py-3 text-center">
                        <button
                          type="button"
                          onClick={() => setViewRRItem(item)}
                          className="p-1.5 rounded hover:bg-blue-50 text-blue-600"
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

        {/* Inward Materials Tab — Bug 1 Fix: Shows materials forwarded by Security to Dispatch Manager */}
        {activeTab === "inward_materials" && (
          <div className="overflow-x-auto">
            {inwardMaterials.length === 0 ? (
              <div
                data-ocid="dispatch.inward_materials.empty_state"
                className="flex flex-col items-center justify-center py-14 text-gray-400"
              >
                <PackageOpen size={32} className="mb-3 opacity-30" />
                <p className="text-sm">
                  Security se koi material forward nahi hua abhi
                </p>
                <p className="text-xs mt-1">
                  Jab Security Guard koi material verify karke Dispatch ko
                  forward karega, yahan dikhega
                </p>
              </div>
            ) : (
              <>
                <div className="bg-blue-50 border-b border-blue-100 px-4 py-2">
                  <p className="text-xs text-blue-700 font-medium flex items-center gap-1.5">
                    <PackageOpen size={13} /> Security Guard ne in materials ko
                    gate pe verify karke Dispatch ko forward kiya hai — Please
                    acknowledge karein
                  </p>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="text-xs">Gatepass ID</TableHead>
                      <TableHead className="text-xs">Material Name</TableHead>
                      <TableHead className="text-xs">Qty / Unit</TableHead>
                      <TableHead className="text-xs">Company</TableHead>
                      <TableHead className="text-xs">Forwarded By</TableHead>
                      <TableHead className="text-xs">Date / Time</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                      <TableHead className="text-xs text-center">
                        Action
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inwardMaterials.map((transfer, idx) => (
                      <TableRow
                        key={transfer.id}
                        data-ocid={`dispatch.inward_item.${idx + 1}`}
                        className={`hover:bg-blue-50/40 ${transfer.acknowledged ? "opacity-60" : ""}`}
                      >
                        <TableCell className="text-xs font-mono text-[#D32F2F] font-semibold py-3">
                          {transfer.gatepassId}
                        </TableCell>
                        <TableCell className="text-xs font-semibold text-gray-900 py-3">
                          {transfer.materialName}
                        </TableCell>
                        <TableCell className="text-xs text-gray-600 py-3">
                          {transfer.quantity} {transfer.unit}
                        </TableCell>
                        <TableCell className="text-xs text-gray-600 py-3">
                          {transfer.company}
                        </TableCell>
                        <TableCell className="text-xs text-gray-600 py-3">
                          <span className="flex items-center gap-1 text-green-700 font-medium">
                            <ShieldCheck size={11} />
                            {transfer.transferredBy}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs text-gray-500 py-3">
                          {transfer.transferDate}
                          <br />
                          <span className="text-gray-400">
                            {transfer.transferTime}
                          </span>
                        </TableCell>
                        <TableCell className="py-3">
                          {transfer.acknowledged ? (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-green-100 text-green-700 border-green-200">
                              Acknowledged
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-blue-100 text-blue-700 border-blue-200">
                              Pending Acknowledge
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="py-3 text-center">
                          {!transfer.acknowledged ? (
                            <Button
                              data-ocid={`dispatch.inward_acknowledge.button.${idx + 1}`}
                              size="sm"
                              onClick={() => {
                                if (!onUpdateDepartmentTransfer) return;
                                const now = new Date();
                                onUpdateDepartmentTransfer(transfer.id, {
                                  acknowledged: true,
                                  acknowledgedBy: currentUser.name,
                                  acknowledgedDate: now
                                    .toISOString()
                                    .split("T")[0],
                                  acknowledgedTime: now.toLocaleTimeString(
                                    "en-IN",
                                    {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    },
                                  ),
                                });
                                toast.success(
                                  `${transfer.materialName} acknowledged`,
                                );
                              }}
                              className="bg-[#D32F2F] hover:bg-[#B71C1C] text-white text-xs h-8"
                            >
                              <CheckCircle2 size={12} className="mr-1" />{" "}
                              Acknowledge
                            </Button>
                          ) : (
                            <div className="text-[10px] text-gray-400">
                              <p>By: {transfer.acknowledgedBy}</p>
                              <p>{transfer.acknowledgedDate}</p>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </>
            )}
          </div>
        )}
      </div>

      {/* Dispatch Gatepass Detail Modal */}
      <Dialog open={!!viewGp} onOpenChange={(open) => !open && setViewGp(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle data-ocid="dispatch.detail.modal">
              Dispatch Gatepass — {viewGp?.passId}
            </DialogTitle>
          </DialogHeader>
          {viewGp && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                {(
                  [
                    ["Vehicle No", viewGp.vehicleNo],
                    ["Driver", viewGp.driverName],
                    ["Destination", viewGp.destination],
                    ["Purpose", viewGp.purpose],
                    ["Created By", viewGp.createdBy],
                    ["Date", viewGp.date],
                    ["Time", viewGp.createdTime],
                    [
                      "Status",
                      <span
                        key="s"
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${STATUS_COLORS[viewGp.status]}`}
                      >
                        {viewGp.status}
                      </span>,
                    ],
                  ] as [string, React.ReactNode][]
                ).map(([label, value]) => (
                  <div
                    key={String(label)}
                    className="bg-gray-50 rounded-lg p-2.5"
                  >
                    <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wide">
                      {String(label)}
                    </p>
                    <p className="text-sm text-gray-900 mt-0.5 font-medium">
                      {value}
                    </p>
                  </div>
                ))}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">
                  Items ({viewGp.items.length})
                </h3>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="text-xs">#</TableHead>
                        <TableHead className="text-xs">Item Name</TableHead>
                        <TableHead className="text-xs">Qty</TableHead>
                        <TableHead className="text-xs">Unit</TableHead>
                        <TableHead className="text-xs">Batch No</TableHead>
                        <TableHead className="text-xs">Description</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {viewGp.items.map((item, i) => (
                        <TableRow key={item.id}>
                          <TableCell className="text-xs py-2">
                            {i + 1}
                          </TableCell>
                          <TableCell className="text-xs font-semibold py-2">
                            {item.itemName}
                          </TableCell>
                          <TableCell className="text-xs py-2">
                            {item.quantity}
                          </TableCell>
                          <TableCell className="text-xs py-2">
                            {item.unit}
                          </TableCell>
                          <TableCell className="text-xs font-mono py-2">
                            {item.batchNo}
                          </TableCell>
                          <TableCell className="text-xs text-gray-500 py-2">
                            {item.description}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
              <div className="flex flex-col items-center py-4 bg-gray-50 rounded-xl border border-gray-200">
                <p className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wider">
                  Barcode
                </p>
                <BarcodeDisplay code={viewGp.barcodeNumber} />
              </div>
              {viewGp.remarks && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-xs font-semibold text-yellow-800">
                    Remarks
                  </p>
                  <p className="text-sm text-yellow-700 mt-1">
                    {viewGp.remarks}
                  </p>
                </div>
              )}
              <div className="flex justify-end gap-2">
                <Button
                  onClick={() => handlePrintDispatchGatepass(viewGp, 1)}
                  className="bg-[#D32F2F] hover:bg-[#B71C1C] text-white"
                  size="sm"
                >
                  <Printer size={14} className="mr-2" /> Print 1 Copy
                </Button>
                <Button
                  onClick={() => handlePrintDispatchGatepass(viewGp, 2)}
                  variant="outline"
                  size="sm"
                >
                  <Printer size={14} className="mr-2" /> Print 2 Copies
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Repair Item Form Dialog */}
      <Dialog
        open={showAddRepairForm}
        onOpenChange={(open) => {
          if (!open) {
            setShowAddRepairForm(false);
            resetRepairForm();
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wrench size={16} className="text-[#D32F2F]" /> Send Item for
              Repair
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold">Item Name *</Label>
                <Input
                  value={formItemName}
                  onChange={(e) => setFormItemName(e.target.value)}
                  placeholder="e.g. pH Meter"
                  className="mt-1 h-9 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold">
                  Vendor / Service Center *
                </Label>
                <Input
                  value={formVendor}
                  onChange={(e) => setFormVendor(e.target.value)}
                  placeholder="e.g. ABC Instruments"
                  className="mt-1 h-9 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold">Quantity *</Label>
                <Input
                  value={formQty}
                  onChange={(e) => setFormQty(e.target.value)}
                  placeholder="1"
                  className="mt-1 h-9 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold">Unit *</Label>
                <Input
                  value={formUnit}
                  onChange={(e) => setFormUnit(e.target.value)}
                  placeholder="pcs / kg / set"
                  className="mt-1 h-9 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold">
                  Batch / Serial No.
                </Label>
                <Input
                  value={formBatchNo}
                  onChange={(e) => setFormBatchNo(e.target.value)}
                  placeholder="Optional"
                  className="mt-1 h-9 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold">
                  Expected Return Date
                </Label>
                <Input
                  type="date"
                  value={formExpectedReturn}
                  onChange={(e) => setFormExpectedReturn(e.target.value)}
                  className="mt-1 h-9 text-sm"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs font-semibold">Repair Reason *</Label>
              <Textarea
                value={formReason}
                onChange={(e) => setFormReason(e.target.value)}
                placeholder="Describe the repair reason or issue"
                className="mt-1 resize-none text-sm"
                rows={2}
              />
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-800 font-medium">
                Submit karne par Security Guard ko notification jaayegi —
                Security gate pe verify karke gatepass generate karega
              </p>
              <ul className="text-xs text-blue-700 mt-1 space-y-0.5 list-disc list-inside">
                <li>Item Security Guard ke portal mein dikhega</li>
                <li>Security gate pe physically verify karega</li>
                <li>Verify hone ke baad RRG Gatepass generate hoga</li>
              </ul>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddRepairForm(false);
                  resetRepairForm();
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddRepairItem}
                disabled={submitting}
                className="bg-[#D32F2F] hover:bg-[#B71C1C] text-white"
              >
                {submitting ? "Submitting..." : "Send for Security Verify"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Accept Return Dialog */}
      <Dialog
        open={!!showAcceptDialog}
        onOpenChange={(open) => {
          if (!open) {
            setShowAcceptDialog(null);
            setAcceptNotes("");
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-green-600" /> Item Receive
              Karein
            </DialogTitle>
          </DialogHeader>
          {showAcceptDialog && (
            <div className="space-y-3 mt-2">
              <div className="bg-gray-50 rounded-lg p-3 text-sm">
                <p className="font-semibold">{showAcceptDialog.itemName}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {showAcceptDialog.quantity} {showAcceptDialog.unit} ·{" "}
                  {showAcceptDialog.vendor}
                </p>
                <p className="text-xs font-mono text-green-700 mt-1">
                  Return Gatepass: {showAcceptDialog.returnGatepassId || "—"}
                </p>
                <p className="text-xs text-gray-400">
                  Security Verified by: {showAcceptDialog.securityVerifiedBy} on{" "}
                  {showAcceptDialog.securityVerifiedDate}
                </p>
              </div>
              <div>
                <Label className="text-xs font-semibold">Received By *</Label>
                <Input
                  value={receivedBy}
                  onChange={(e) => setReceivedBy(e.target.value)}
                  className="mt-1 h-9 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold">
                  Notes (optional)
                </Label>
                <Textarea
                  value={acceptNotes}
                  onChange={(e) => setAcceptNotes(e.target.value)}
                  placeholder="e.g. Item repaired, working condition verified"
                  className="mt-1 resize-none"
                  rows={2}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAcceptDialog(null);
                    setAcceptNotes("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAcceptReturn}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <CheckCircle2 size={14} className="mr-1" /> Receive Confirm
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* RR Item Detail Modal */}
      <Dialog
        open={!!viewRRItem}
        onOpenChange={(open) => !open && setViewRRItem(null)}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Repair Item — {viewRRItem?.gatepassId || viewRRItem?.referenceId}
            </DialogTitle>
          </DialogHeader>
          {viewRRItem && (
            <div className="grid grid-cols-2 gap-3">
              {(
                [
                  [
                    "Repair Gatepass",
                    viewRRItem.gatepassId || viewRRItem.referenceId,
                  ],
                  ["Return Gatepass", viewRRItem.returnGatepassId || "—"],
                  ["Item Name", viewRRItem.itemName],
                  ["Qty / Unit", `${viewRRItem.quantity} ${viewRRItem.unit}`],
                  ["Batch / Serial", viewRRItem.batchNo || "—"],
                  ["Vendor", viewRRItem.vendor],
                  ["Repair Reason", viewRRItem.repairReason],
                  ["Status", RR_STATUS_CONFIG[viewRRItem.status].label],
                  [
                    "Sent Date",
                    `${viewRRItem.dispatchDate} ${viewRRItem.dispatchTime}`,
                  ],
                  ["Dispatched By", viewRRItem.dispatchedBy],
                  ...(viewRRItem.securityVerifiedBy
                    ? [["Verified By", viewRRItem.securityVerifiedBy]]
                    : []),
                  ...(viewRRItem.returnDate
                    ? [
                        [
                          "Return Date",
                          `${viewRRItem.returnDate} ${viewRRItem.returnTime}`,
                        ],
                      ]
                    : []),
                  ...(viewRRItem.receivedBy
                    ? [["Received By", viewRRItem.receivedBy]]
                    : []),
                ] as [string, string][]
              ).map(([label, value]) => (
                <div key={label} className="bg-gray-50 rounded-lg p-2.5">
                  <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wide">
                    {label}
                  </p>
                  <p className="text-sm text-gray-900 mt-0.5 font-medium">
                    {value}
                  </p>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export { buildGatepassPrintHTML };
