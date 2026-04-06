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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertTriangle,
  CheckCircle,
  CheckSquare,
  History,
  Package,
  Printer,
  ScanLine,
  Search,
  Square,
  Wrench,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type {
  AppView,
  CurrentUser,
  DispatchGatepass,
  DispatchItem,
  DispatchStatus,
  ReturnRepairItem,
} from "../types";
import { buildGatepassPrintHTML } from "./DispatchGatepass";

interface SecurityDispatchVerifyProps {
  gatepasses: DispatchGatepass[];
  currentUser: CurrentUser;
  onUpdateGatepass: (id: string, updates: Partial<DispatchGatepass>) => void;
  onNavigate: (view: AppView) => void;
  returnRepairItems?: ReturnRepairItem[];
  onUpdateReturnRepairItem?: (
    id: string,
    updates: Partial<ReturnRepairItem>,
  ) => void;
}

const STATUS_COLORS: Record<DispatchStatus, string> = {
  Draft: "bg-gray-100 text-gray-600",
  Submitted: "bg-yellow-100 text-yellow-700",
  SecurityVerifying: "bg-blue-100 text-blue-700",
  Released: "bg-green-100 text-green-700",
  Rejected: "bg-red-100 text-red-700",
};

function printDispatchGatepass(
  gp: DispatchGatepass,
  securityName: string,
  copies: 1 | 2 = 1,
) {
  const itemsTableHtml =
    gp.items.length > 0
      ? `<table class="items">
        <tr><th>#</th><th>Item Name</th><th>Qty</th><th>Unit</th><th>Batch No</th><th>Description</th><th>Verified</th></tr>
        ${gp.items.map((it, i) => `<tr><td>${i + 1}</td><td><strong>${it.itemName}</strong></td><td>${it.quantity}</td><td>${it.unit}</td><td style="font-family:monospace">${it.batchNo}</td><td>${it.description || "-"}</td><td style="color:#155724;font-weight:bold">&#10003; Yes</td></tr>`).join("")}
      </table>`
      : "";

  const now = new Date();
  const printTime = now.toLocaleString("en-IN");
  const verifiedTime = gp.releasedTime
    ? `Released: ${gp.releasedTime}`
    : `Printed: ${printTime}`;

  const html = buildGatepassPrintHTML({
    passId: gp.passId,
    passType: "DISPATCH GATE PASS",
    barcodeNumber: gp.barcodeNumber,
    fields: [
      ["Vehicle Number", gp.vehicleNo],
      ["Driver Name", gp.driverName],
      ["Destination", gp.destination],
      ["Date", gp.date],
      ["Created By", gp.createdBy],
      ["Created Time", gp.createdTime],
      ["Purpose", gp.purpose],
      ["Status", "RELEASED"],
      ["Released Time", gp.releasedTime || "-"],
      ["Verified By (Security)", securityName],
    ],
    itemsTable: itemsTableHtml,
    signatureName: securityName,
    signatureId: securityName,
    signatureRole: "Security Guard",
    signatureVerified: verifiedTime,
    copies,
  });

  const win = window.open("", "_blank", "width=620,height=700");
  if (!win) return;
  win.document.write(html);
  win.document.close();
  setTimeout(() => win.print(), 400);
}

export function SecurityDispatchVerify({
  gatepasses,
  currentUser,
  onUpdateGatepass,
  onNavigate: _onNavigate,
  returnRepairItems = [],
  onUpdateReturnRepairItem,
}: SecurityDispatchVerifyProps) {
  const [tab, setTab] = useState<"pending" | "repair" | "history">("pending");
  const [search, setSearch] = useState("");
  const [historySearch, setHistorySearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<DispatchStatus | "all">(
    "all",
  );

  // Repair verify state
  const [repairSearch, setRepairSearch] = useState("");
  const [verifyingRepairItem, setVerifyingRepairItem] =
    useState<ReturnRepairItem | null>(null);
  const [repairVerifyNotes, setRepairVerifyNotes] = useState("");

  const pending = gatepasses.filter(
    (gp) => gp.status === "Submitted" || gp.status === "SecurityVerifying",
  );

  const history = gatepasses.filter(
    (gp) =>
      gp.status === "Released" ||
      gp.status === "Rejected" ||
      gp.status === "Draft",
  );

  // Repair items pending security outgoing verification
  const pendingRepairItems = returnRepairItems.filter(
    (i) => i.status === "PendingSecurityOut",
  );

  const filteredPending = pending.filter((gp) => {
    const q = search.toLowerCase();
    return (
      gp.passId.toLowerCase().includes(q) ||
      gp.vehicleNo.toLowerCase().includes(q) ||
      gp.driverName.toLowerCase().includes(q) ||
      gp.destination.toLowerCase().includes(q)
    );
  });

  const filteredHistory = history.filter((gp) => {
    const q = historySearch.toLowerCase();
    const matchSearch =
      gp.passId.toLowerCase().includes(q) ||
      gp.vehicleNo.toLowerCase().includes(q) ||
      gp.driverName.toLowerCase().includes(q);
    const matchStatus = statusFilter === "all" || gp.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const filteredRepairItems = pendingRepairItems.filter((item) => {
    const q = repairSearch.toLowerCase();
    return (
      item.itemName.toLowerCase().includes(q) ||
      item.referenceId.toLowerCase().includes(q) ||
      item.vendor.toLowerCase().includes(q) ||
      item.dispatchedBy.toLowerCase().includes(q)
    );
  });

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [itemVerified, setItemVerified] = useState<Record<string, boolean>>({});
  const [rejectReason, setRejectReason] = useState<Record<string, string>>({});
  const [showRejectInput, setShowRejectInput] = useState<
    Record<string, boolean>
  >({});
  const [_releasedGpId, setReleasedGpId] = useState<string | null>(null);
  const [printDialogGp, setPrintDialogGp] = useState<DispatchGatepass | null>(
    null,
  );

  const getKey = (gpId: string, itemId: string) => `${gpId}__${itemId}`;

  const toggleExpand = (gp: DispatchGatepass) => {
    if (expandedId === gp.id) {
      setExpandedId(null);
    } else {
      setExpandedId(gp.id);
      if (gp.status === "Submitted") {
        onUpdateGatepass(gp.id, { status: "SecurityVerifying" });
      }
      const init: Record<string, boolean> = {};
      for (const item of gp.items) {
        const key = getKey(gp.id, item.id);
        init[key] = item.verified;
      }
      setItemVerified((prev) => ({ ...prev, ...init }));
    }
  };

  const toggleItemVerified = (gpId: string, itemId: string) => {
    const key = getKey(gpId, itemId);
    setItemVerified((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const getVerifiedCount = (gp: DispatchGatepass) => {
    return gp.items.filter((item) => !!itemVerified[getKey(gp.id, item.id)])
      .length;
  };

  const handleAllowOut = (gp: DispatchGatepass) => {
    const now = new Date();
    const releasedTime = now.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const updatedItems: DispatchItem[] = gp.items.map((item) => ({
      ...item,
      verified: !!itemVerified[getKey(gp.id, item.id)],
    }));
    const updatedGp: DispatchGatepass = {
      ...gp,
      status: "Released",
      releasedTime,
      items: updatedItems,
      securityName: currentUser.name,
    };
    onUpdateGatepass(gp.id, {
      status: "Released",
      releasedTime,
      items: updatedItems,
      securityName: currentUser.name,
    });
    toast.success(`Gatepass ${gp.passId} released — Print options available`);
    setExpandedId(null);
    setReleasedGpId(gp.id);
    // Show print dialog for 1 or 2 copies
    setPrintDialogGp(updatedGp);
  };

  const handleReject = (gp: DispatchGatepass) => {
    const reason = rejectReason[gp.id] || "";
    if (!reason.trim()) {
      toast.error("Please enter a rejection reason");
      return;
    }
    onUpdateGatepass(gp.id, { status: "Rejected", remarks: reason.trim() });
    toast.error(`Gatepass ${gp.passId} rejected`);
    setExpandedId(null);
    setShowRejectInput((prev) => ({ ...prev, [gp.id]: false }));
  };

  const handleReprintReleased = (gp: DispatchGatepass) => {
    setPrintDialogGp(gp);
  };

  const handleVerifyRepairItem = (item: ReturnRepairItem) => {
    setVerifyingRepairItem(item);
    setRepairVerifyNotes("");
  };

  const handleConfirmRepairVerify = () => {
    if (!verifyingRepairItem || !onUpdateReturnRepairItem) return;

    const item = verifyingRepairItem;
    const now = new Date();
    const dateStr = now.toLocaleDateString("en-IN");
    const timeStr = now.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });

    // Generate RRG gatepass ID
    const datePart = now.toISOString().slice(0, 10).replace(/-/g, "");
    const randPart = String(Math.floor(1000 + Math.random() * 9000));
    const gatepassId = `RRG-${datePart}-${randPart}`;
    const barcodeNumber = `RRG${datePart}${randPart}`;

    const verifiedDate = dateStr;
    const verifiedTime = timeStr;

    onUpdateReturnRepairItem(item.id, {
      status: "SentForRepair",
      gatepassId,
      gatepassNumber: gatepassId,
      securityOutVerifiedDate: verifiedDate,
      securityOutVerifiedTime: verifiedTime,
      securityOutVerifiedBy: currentUser.name,
      securityOutVerifiedById: currentUser.username,
      securityOutNotes: repairVerifyNotes,
    });

    toast.success(`Repair item verified! Gatepass ${gatepassId} generated.`);

    // Print gatepass using shared builder — 2 copies
    const html = buildGatepassPrintHTML({
      passId: gatepassId,
      passType: "REPAIR / RETURN GATE PASS",
      barcodeNumber,
      fields: [
        ["Item Name", item.itemName],
        ["Qty / Unit", `${item.quantity} ${item.unit}`],
        ["Batch / Serial No", item.batchNo],
        ["Vendor / Service Center", item.vendor],
        ["Repair Reason", item.repairReason],
        ["Dispatched Date", item.dispatchDate],
        ["Dispatched Time", item.dispatchTime],
        ["Created By (Dispatch Mgr)", item.dispatchedBy],
        ["Gate Verified On", `${verifiedDate} ${verifiedTime}`],
        ["Verified By", currentUser.name],
      ],
      signatureName: currentUser.name,
      signatureId: currentUser.name,
      signatureRole: "Security Guard",
      signatureVerified: `Verified: ${verifiedDate} ${verifiedTime}`,
      copies: 2,
    });

    const win = window.open("", "_blank", "width=650,height=900");
    if (win) {
      win.document.write(html);
      win.document.close();
      setTimeout(() => win.print(), 400);
    }

    setVerifyingRepairItem(null);
    setRepairVerifyNotes("");
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <ScanLine size={20} className="text-[#D32F2F]" />
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            Dispatch Verification
          </h1>
          <p className="text-xs text-gray-500">
            {pending.length} pending &bull; {history.length} processed &bull;
            Security:{" "}
            <span className="font-semibold text-[#D32F2F]">
              {currentUser.name}
            </span>
          </p>
        </div>
      </div>

      {/* Alert banner for pending repair items */}
      {pendingRepairItems.length > 0 && (
        <div className="flex items-center gap-3 bg-orange-50 border border-orange-300 rounded-xl px-4 py-3">
          <AlertTriangle size={18} className="text-orange-500 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-orange-800">
              {pendingRepairItems.length} repair item
              {pendingRepairItems.length > 1 ? "s" : ""} gate pe verify karne ke
              liye pending hain
            </p>
            <p className="text-xs text-orange-600 mt-0.5">
              Repair Verify tab mein jaayein aur item ko physically verify karke
              gatepass generate karein
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="border-orange-400 text-orange-700 hover:bg-orange-100 text-xs"
            onClick={() => setTab("repair")}
          >
            Repair Verify Tab
          </Button>
        </div>
      )}

      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <TabsList className="bg-gray-100">
          <TabsTrigger data-ocid="dispatch_verify.pending.tab" value="pending">
            Pending ({pending.length})
          </TabsTrigger>
          <TabsTrigger
            data-ocid="dispatch_verify.repair.tab"
            value="repair"
            className="relative"
          >
            <Wrench size={13} className="mr-1" />
            Repair Verify
            {pendingRepairItems.length > 0 && (
              <span className="ml-1.5 bg-orange-500 text-white text-[10px] font-bold rounded-full w-4 h-4 inline-flex items-center justify-center">
                {pendingRepairItems.length > 9
                  ? "9+"
                  : pendingRepairItems.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger data-ocid="dispatch_verify.history.tab" value="history">
            <History size={13} className="mr-1" />
            History ({history.length})
          </TabsTrigger>
        </TabsList>

        {/* PENDING TAB */}
        <TabsContent value="pending">
          <div className="space-y-4">
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <Input
                data-ocid="dispatch_verify.search.input"
                placeholder="Search by pass ID, vehicle, driver, destination..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-white"
              />
            </div>

            {filteredPending.length === 0 ? (
              <div
                data-ocid="security_verify.empty_state"
                className="flex flex-col items-center justify-center py-14 bg-white rounded-xl border border-gray-100 shadow-sm text-gray-400"
              >
                <CheckCircle size={32} className="mb-3 opacity-30" />
                <p className="text-sm">No pending dispatch verifications</p>
                <p className="text-xs mt-1">
                  All gatepasses have been processed
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredPending.map((gp, idx) => {
                  const verifiedCount = getVerifiedCount(gp);
                  const totalCount = gp.items.length;
                  const allVerified = verifiedCount === totalCount;
                  const isExpanded = expandedId === gp.id;

                  return (
                    <div
                      key={gp.id}
                      data-ocid={`security_verify.item.${idx + 1}`}
                      className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden"
                    >
                      <div className="px-5 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
                            <Package size={18} className="text-[#D32F2F]" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900">
                              {gp.passId}
                            </p>
                            <p className="text-xs text-gray-500">
                              {gp.vehicleNo} &bull; {gp.driverName} &bull;{" "}
                              {gp.destination}
                            </p>
                            <p className="text-xs text-gray-400">
                              By: {gp.createdBy}
                            </p>
                          </div>
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[gp.status]}`}
                          >
                            {gp.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          {isExpanded && (
                            <span className="text-xs font-semibold text-gray-600">
                              <span
                                className={
                                  allVerified
                                    ? "text-green-600"
                                    : "text-orange-600"
                                }
                              >
                                {verifiedCount}/{totalCount}
                              </span>{" "}
                              items verified
                            </span>
                          )}
                          <Button
                            data-ocid={`security_verify.verify_items.button.${idx + 1}`}
                            size="sm"
                            variant={isExpanded ? "outline" : "default"}
                            className={
                              !isExpanded
                                ? "bg-[#D32F2F] hover:bg-[#B71C1C] text-white"
                                : ""
                            }
                            onClick={() => toggleExpand(gp)}
                          >
                            {isExpanded ? "Collapse" : "Verify Items"}
                          </Button>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="px-5 pb-5 border-t border-gray-100">
                          {/* Security name display */}
                          <div className="mt-3 mb-3 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 flex items-center gap-2">
                            <CheckCircle size={14} className="text-blue-600" />
                            <span className="text-xs text-blue-700">
                              Verified by: <strong>{currentUser.name}</strong>{" "}
                              (Security)
                            </span>
                          </div>

                          <div className="space-y-2">
                            {gp.items.map((item, iIdx) => {
                              const key = getKey(gp.id, item.id);
                              const verified = !!itemVerified[key];
                              return (
                                <div
                                  key={item.id}
                                  data-ocid={`security_verify.item_row.${iIdx + 1}`}
                                  className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                                    verified
                                      ? "bg-green-50 border-green-200"
                                      : "bg-gray-50 border-gray-200"
                                  }`}
                                >
                                  <button
                                    type="button"
                                    data-ocid={`security_verify.item_check.${iIdx + 1}`}
                                    onClick={() =>
                                      toggleItemVerified(gp.id, item.id)
                                    }
                                    className={`flex-shrink-0 transition-colors ${
                                      verified
                                        ? "text-green-600"
                                        : "text-gray-400 hover:text-gray-600"
                                    }`}
                                  >
                                    {verified ? (
                                      <CheckSquare size={18} />
                                    ) : (
                                      <Square size={18} />
                                    )}
                                  </button>
                                  <div className="flex-1 grid grid-cols-5 gap-2 text-xs">
                                    <div>
                                      <p className="text-gray-400 text-[10px]">
                                        Item
                                      </p>
                                      <p className="font-semibold text-gray-900">
                                        {item.itemName}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-gray-400 text-[10px]">
                                        Qty
                                      </p>
                                      <p className="text-gray-700">
                                        {item.quantity} {item.unit}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-gray-400 text-[10px]">
                                        Batch No
                                      </p>
                                      <p className="font-mono text-gray-700">
                                        {item.batchNo}
                                      </p>
                                    </div>
                                    <div className="col-span-2">
                                      <p className="text-gray-400 text-[10px]">
                                        Description
                                      </p>
                                      <p className="text-gray-600">
                                        {item.description}
                                      </p>
                                    </div>
                                  </div>
                                  {verified && (
                                    <CheckCircle
                                      size={16}
                                      className="text-green-500 flex-shrink-0"
                                    />
                                  )}
                                </div>
                              );
                            })}
                          </div>

                          <div className="mt-4">
                            <div className="flex justify-between text-xs text-gray-600 mb-1">
                              <span>Verification Progress</span>
                              <span
                                className={
                                  allVerified
                                    ? "text-green-600 font-semibold"
                                    : "text-orange-600"
                                }
                              >
                                {verifiedCount}/{totalCount} verified
                              </span>
                            </div>
                            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  allVerified ? "bg-green-500" : "bg-orange-400"
                                }`}
                                style={{
                                  width: `${(verifiedCount / totalCount) * 100}%`,
                                }}
                              />
                            </div>
                          </div>

                          <div className="mt-4 flex items-start gap-3">
                            <Button
                              data-ocid={`security_verify.allow_out.button.${idx + 1}`}
                              onClick={() => handleAllowOut(gp)}
                              disabled={!allVerified}
                              className="bg-green-600 hover:bg-green-700 text-white"
                              size="sm"
                            >
                              <CheckCircle size={14} className="mr-2" />
                              Allow Out & Print Gatepass
                            </Button>

                            <div className="flex-1">
                              {showRejectInput[gp.id] ? (
                                <div className="flex gap-2">
                                  <Textarea
                                    data-ocid={`security_verify.reject_reason.${idx + 1}`}
                                    value={rejectReason[gp.id] || ""}
                                    onChange={(e) =>
                                      setRejectReason((prev) => ({
                                        ...prev,
                                        [gp.id]: e.target.value,
                                      }))
                                    }
                                    placeholder="Enter rejection reason..."
                                    className="resize-none text-xs"
                                    rows={2}
                                  />
                                  <div className="flex flex-col gap-1">
                                    <Button
                                      data-ocid={`security_verify.reject_confirm.button.${idx + 1}`}
                                      onClick={() => handleReject(gp)}
                                      size="sm"
                                      className="bg-red-600 hover:bg-red-700 text-white text-xs"
                                    >
                                      <XCircle size={12} className="mr-1" />{" "}
                                      Reject
                                    </Button>
                                    <Button
                                      data-ocid={`security_verify.reject_cancel.button.${idx + 1}`}
                                      onClick={() =>
                                        setShowRejectInput((prev) => ({
                                          ...prev,
                                          [gp.id]: false,
                                        }))
                                      }
                                      size="sm"
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <Button
                                  data-ocid={`security_verify.reject.button.${idx + 1}`}
                                  onClick={() =>
                                    setShowRejectInput((prev) => ({
                                      ...prev,
                                      [gp.id]: true,
                                    }))
                                  }
                                  variant="outline"
                                  size="sm"
                                  className="border-red-200 text-red-600 hover:bg-red-50"
                                >
                                  <AlertTriangle size={14} className="mr-2" />
                                  Reject Gatepass
                                </Button>
                              )}
                            </div>
                          </div>

                          {!allVerified && (
                            <p className="text-xs text-orange-600 mt-2 flex items-center gap-1">
                              <AlertTriangle size={11} />
                              All items must be verified before allowing out
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </TabsContent>

        {/* REPAIR VERIFY TAB */}
        <TabsContent value="repair">
          <div className="space-y-4">
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <Input
                data-ocid="repair_verify.search.input"
                placeholder="Search by item name, ref ID, vendor, dispatched by..."
                value={repairSearch}
                onChange={(e) => setRepairSearch(e.target.value)}
                className="pl-9 bg-white"
              />
            </div>

            {filteredRepairItems.length === 0 ? (
              <div
                data-ocid="repair_verify.empty_state"
                className="flex flex-col items-center justify-center py-14 bg-white rounded-xl border border-gray-100 shadow-sm text-gray-400"
              >
                <Wrench size={32} className="mb-3 opacity-30" />
                <p className="text-sm">
                  Koi repair item verify karne ke liye nahi hai
                </p>
                <p className="text-xs mt-1">
                  Dispatch Manager ke repair requests yahan dikhenge
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredRepairItems.map((item, idx) => (
                  <div
                    key={item.id}
                    data-ocid={`repair_verify.item.${idx + 1}`}
                    className="bg-white rounded-xl border border-orange-200 shadow-sm overflow-hidden"
                  >
                    <div className="px-5 py-4 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0">
                          <Wrench size={18} className="text-orange-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-bold text-gray-900">
                              {item.itemName}
                            </p>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">
                              Repair Pending
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">
                            Ref:{" "}
                            <span className="font-mono">
                              {item.referenceId}
                            </span>{" "}
                            &bull; Qty: {item.quantity} {item.unit}
                            {item.batchNo && (
                              <>
                                {" "}
                                &bull; Batch:{" "}
                                <span className="font-mono">
                                  {item.batchNo}
                                </span>
                              </>
                            )}
                          </p>
                          <p className="text-xs text-gray-400">
                            Vendor: {item.vendor} &bull; By: {item.dispatchedBy}{" "}
                            &bull; {item.dispatchDate} {item.dispatchTime}
                          </p>
                          {item.repairReason && (
                            <p className="text-xs text-orange-600 mt-1">
                              Reason: {item.repairReason}
                            </p>
                          )}
                        </div>
                      </div>
                      <Button
                        data-ocid={`repair_verify.verify_button.${idx + 1}`}
                        size="sm"
                        className="bg-orange-500 hover:bg-orange-600 text-white flex-shrink-0"
                        onClick={() => handleVerifyRepairItem(item)}
                      >
                        <CheckCircle size={14} className="mr-1.5" />
                        Verify & Gatepass
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* HISTORY TAB */}
        <TabsContent value="history">
          <div className="space-y-3">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <Input
                  data-ocid="dispatch_verify.history_search.input"
                  placeholder="Search by pass ID, vehicle, driver..."
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  className="pl-9 bg-white"
                />
              </div>
              <Select
                value={statusFilter}
                onValueChange={(v) =>
                  setStatusFilter(v as DispatchStatus | "all")
                }
              >
                <SelectTrigger
                  data-ocid="dispatch_verify.status_filter.select"
                  className="w-36"
                >
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Released">Released</SelectItem>
                  <SelectItem value="Rejected">Rejected</SelectItem>
                  <SelectItem value="Draft">Draft</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              {filteredHistory.length === 0 ? (
                <div
                  data-ocid="dispatch_verify.history_empty_state"
                  className="flex flex-col items-center justify-center py-12 text-gray-400"
                >
                  <History size={28} className="mb-2 opacity-30" />
                  <p className="text-sm">No records found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="text-xs">Pass ID</TableHead>
                        <TableHead className="text-xs">Vehicle</TableHead>
                        <TableHead className="text-xs">Driver</TableHead>
                        <TableHead className="text-xs">Destination</TableHead>
                        <TableHead className="text-xs">Date</TableHead>
                        <TableHead className="text-xs">Status</TableHead>
                        <TableHead className="text-xs">Remarks</TableHead>
                        <TableHead className="text-xs text-center">
                          Print
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredHistory.map((gp, idx) => (
                        <TableRow
                          key={gp.id}
                          data-ocid={`dispatch_verify.history_item.${idx + 1}`}
                          className="hover:bg-gray-50/60"
                        >
                          <TableCell className="text-xs font-mono text-gray-600 py-3">
                            {gp.passId}
                          </TableCell>
                          <TableCell className="text-xs text-gray-700 py-3">
                            {gp.vehicleNo}
                          </TableCell>
                          <TableCell className="text-xs text-gray-700 py-3">
                            {gp.driverName}
                          </TableCell>
                          <TableCell className="text-xs text-gray-600 py-3">
                            {gp.destination}
                          </TableCell>
                          <TableCell className="text-xs text-gray-500 py-3">
                            {gp.date}
                          </TableCell>
                          <TableCell className="py-3">
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[gp.status]}`}
                            >
                              {gp.status}
                            </span>
                          </TableCell>
                          <TableCell className="text-xs text-gray-500 py-3 max-w-[120px] truncate">
                            {gp.remarks || "—"}
                          </TableCell>
                          <TableCell className="py-3 text-center">
                            {gp.status === "Released" && (
                              <button
                                type="button"
                                data-ocid={`dispatch_verify.reprint.button.${idx + 1}`}
                                onClick={() => handleReprintReleased(gp)}
                                title="Print Final Gatepass"
                                className="p-1.5 rounded hover:bg-green-50 text-green-600 transition-colors"
                              >
                                <Printer size={14} />
                              </button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Repair Verify Confirm Dialog */}
      <Dialog
        open={!!verifyingRepairItem}
        onOpenChange={(open) => {
          if (!open) {
            setVerifyingRepairItem(null);
            setRepairVerifyNotes("");
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wrench size={18} className="text-orange-500" />
              Repair Item Verify & Gatepass
            </DialogTitle>
          </DialogHeader>

          {verifyingRepairItem && (
            <div className="space-y-4">
              {/* Item details */}
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 space-y-2">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="text-gray-400 text-[10px] uppercase font-semibold">
                      Item Name
                    </p>
                    <p className="font-bold text-gray-900">
                      {verifyingRepairItem.itemName}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-[10px] uppercase font-semibold">
                      Qty / Unit
                    </p>
                    <p className="text-gray-700">
                      {verifyingRepairItem.quantity} {verifyingRepairItem.unit}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-[10px] uppercase font-semibold">
                      Batch / Serial
                    </p>
                    <p className="font-mono text-gray-700">
                      {verifyingRepairItem.batchNo || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-[10px] uppercase font-semibold">
                      Vendor
                    </p>
                    <p className="text-gray-700">
                      {verifyingRepairItem.vendor}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-gray-400 text-[10px] uppercase font-semibold">
                      Repair Reason
                    </p>
                    <p className="text-gray-700">
                      {verifyingRepairItem.repairReason}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-[10px] uppercase font-semibold">
                      Dispatched By
                    </p>
                    <p className="text-gray-700">
                      {verifyingRepairItem.dispatchedBy}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-[10px] uppercase font-semibold">
                      Ref ID
                    </p>
                    <p className="font-mono text-gray-700">
                      {verifyingRepairItem.referenceId}
                    </p>
                  </div>
                </div>
              </div>

              {/* Guard instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-xs text-blue-700">
                <p className="font-semibold mb-1">
                  Security Guard Instructions:
                </p>
                <ul className="list-disc list-inside space-y-1">
                  <li>
                    Item ko physically check karein — naam, qty, aur condition
                    verify karein
                  </li>
                  <li>
                    Confirm karne ke baad RRG Gatepass generate hoga (2 copies
                    print honge)
                  </li>
                  <li>1 copy vendor ko dein, 1 apne record ke liye rakhein</li>
                  <li>
                    Dispatch Manager ko gatepass number forward ho jayega
                    automatically
                  </li>
                </ul>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-700">
                  Verification Notes (optional)
                </Label>
                <Textarea
                  data-ocid="repair_verify.notes.textarea"
                  value={repairVerifyNotes}
                  onChange={(e) => setRepairVerifyNotes(e.target.value)}
                  placeholder="Koi notes ya observations..."
                  className="resize-none text-xs"
                  rows={2}
                />
              </div>

              <div className="flex gap-3">
                <Button
                  data-ocid="repair_verify.confirm.button"
                  onClick={handleConfirmRepairVerify}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
                >
                  <CheckCircle size={14} className="mr-2" />
                  Verify & Generate Gatepass
                </Button>
                <Button
                  data-ocid="repair_verify.cancel.button"
                  variant="outline"
                  onClick={() => {
                    setVerifyingRepairItem(null);
                    setRepairVerifyNotes("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Print Copies Dialog — shown after Security releases a Dispatch Gatepass */}
      <Dialog
        open={!!printDialogGp}
        onOpenChange={(open) => {
          if (!open) setPrintDialogGp(null);
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Printer size={18} className="text-green-600" />
              Gatepass Print Karein
            </DialogTitle>
          </DialogHeader>
          {printDialogGp && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3">
                <p className="text-sm font-semibold text-green-800">
                  Gatepass {printDialogGp.passId} release ho gaya!
                </p>
                <p className="text-xs text-green-600 mt-1">
                  Kitni copies print karni hain? Security 1 copy driver ko de
                  aur 1 apne record ke liye rakhe.
                </p>
              </div>
              <div className="flex gap-3">
                <Button
                  data-ocid="dispatch_print.1copy.button"
                  variant="outline"
                  className="flex-1 border-gray-300"
                  onClick={() => {
                    printDispatchGatepass(
                      printDialogGp,
                      printDialogGp.securityName || currentUser.name,
                      1,
                    );
                    setPrintDialogGp(null);
                  }}
                >
                  <Printer size={14} className="mr-2" />1 Copy
                </Button>
                <Button
                  data-ocid="dispatch_print.2copies.button"
                  className="flex-1 bg-[#D32F2F] hover:bg-[#B71C1C] text-white"
                  onClick={() => {
                    printDispatchGatepass(
                      printDialogGp,
                      printDialogGp.securityName || currentUser.name,
                      2,
                    );
                    setPrintDialogGp(null);
                  }}
                >
                  <Printer size={14} className="mr-2" />2 Copies
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
