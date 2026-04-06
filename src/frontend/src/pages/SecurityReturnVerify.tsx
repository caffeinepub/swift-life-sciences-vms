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
  PackageCheck,
  Printer,
  RotateCcw,
  Search,
  ShieldCheck,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import type { AppView, CurrentUser, ReturnRepairItem } from "../types";
import { buildGatepassPrintHTML } from "./DispatchGatepass";

interface SecurityReturnVerifyProps {
  items: ReturnRepairItem[];
  currentUser: CurrentUser;
  onUpdateItem: (id: string, updates: Partial<ReturnRepairItem>) => void;
  onNavigate: (view: AppView) => void;
}

interface ReturnGatepass {
  passId: string;
  barcodeNumber: string;
  originalGatepassId: string;
  item: ReturnRepairItem;
  securityName: string;
  securityId: string;
  verifiedDate: string;
  verifiedTime: string;
}

interface OutgoingGatepass {
  passId: string;
  barcodeNumber: string;
  item: ReturnRepairItem;
  securityName: string;
  securityId: string;
  verifiedDate: string;
  verifiedTime: string;
}

export function SecurityReturnVerify({
  items,
  currentUser,
  onUpdateItem,
}: SecurityReturnVerifyProps) {
  const [gatepassSearch, setGatepassSearch] = useState("");
  const [search, setSearch] = useState("");
  const [guardNotes, setGuardNotes] = useState("");
  const [outgoingNotes, setOutgoingNotes] = useState("");
  const [viewItem, setViewItem] = useState<ReturnRepairItem | null>(null);
  const [activeTab, setActiveTab] = useState<
    "outgoing" | "incoming" | "pending" | "done"
  >("outgoing");
  const [verifyItem, setVerifyItem] = useState<ReturnRepairItem | null>(null);
  const [outgoingVerifyItem, setOutgoingVerifyItem] =
    useState<ReturnRepairItem | null>(null);
  const [returnGatepass, setReturnGatepass] = useState<ReturnGatepass | null>(
    null,
  );
  const [outgoingGatepass, setOutgoingGatepass] =
    useState<OutgoingGatepass | null>(null);
  const passRef = useRef<HTMLDivElement>(null);

  // Items waiting for security to verify before going out for repair
  const outgoingItems = items.filter((i) => i.status === "PendingSecurityOut");
  // All repair items that security should see (sent for repair - so they know what went out)
  const incomingItems = items.filter((i) => i.status === "SentForRepair");
  // Items waiting for gate verification (dispatch manager marked "return aaya")
  const pendingItems = items.filter((i) => i.status === "PendingReturnVerify");
  // Items security has already verified
  const doneItems = items.filter(
    (i) => i.status === "PendingDispatchAccept" || i.status === "Returned",
  );

  // Search in both incoming (SentForRepair) and pending (PendingReturnVerify) items
  const searchedItem: ReturnRepairItem | null =
    gatepassSearch.trim().length >= 4
      ? ([...incomingItems, ...pendingItems].find(
          (i) =>
            (i.gatepassId || "").toLowerCase() ===
              gatepassSearch.trim().toLowerCase() ||
            (i.referenceId || "").toLowerCase() ===
              gatepassSearch.trim().toLowerCase(),
        ) ?? null)
      : null;

  const filterFn = (i: ReturnRepairItem) =>
    i.itemName.toLowerCase().includes(search.toLowerCase()) ||
    i.vendor.toLowerCase().includes(search.toLowerCase()) ||
    (i.gatepassId || "").toLowerCase().includes(search.toLowerCase()) ||
    i.referenceId.toLowerCase().includes(search.toLowerCase());

  const filteredIncoming = incomingItems.filter(filterFn);
  const filteredPending = pendingItems.filter(filterFn);
  const filteredDone = doneItems.filter(filterFn);

  const handleVerify = (item: ReturnRepairItem, notes: string) => {
    const now = new Date();
    const dateStr = now.toISOString().split("T")[0].replace(/-/g, "");
    const seq = String(Math.floor(Math.random() * 9000) + 1000);
    const returnGatepassId = `RRG-RET-${dateStr}-${seq}`;
    const barcodeNumber = `RRGRET${dateStr}${seq}`;
    const verifiedDate = now.toISOString().split("T")[0];
    const verifiedTime = now.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const rgp: ReturnGatepass = {
      passId: returnGatepassId,
      barcodeNumber,
      originalGatepassId: item.gatepassId || item.referenceId,
      item,
      securityName: currentUser.name,
      securityId: currentUser.username,
      verifiedDate,
      verifiedTime,
    };

    onUpdateItem(item.id, {
      status: "PendingDispatchAccept",
      securityVerifiedDate: verifiedDate,
      securityVerifiedTime: verifiedTime,
      securityVerifiedBy: currentUser.name,
      securityNotes: notes.trim() || undefined,
      returnGatepassId,
      returnGatepassNumber: returnGatepassId,
    });

    setGatepassSearch("");
    setVerifyItem(null);
    setGuardNotes("");
    setReturnGatepass(rgp);
    toast.success(
      `${item.itemName} verified — Return Gatepass ${returnGatepassId} generate ho gaya`,
    );
  };

  const handleVerifyOutgoing = (item: ReturnRepairItem, notes: string) => {
    const now = new Date();
    const dateStr = now.toISOString().split("T")[0].replace(/-/g, "");
    const seq = String(Math.floor(Math.random() * 9000) + 1000);
    const gatepassId = `RRG-${dateStr}-${seq}`;
    const barcodeNumber = `RRG${dateStr}${seq}`;
    const verifiedDate = now.toISOString().split("T")[0];
    const verifiedTime = now.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const ogp: OutgoingGatepass = {
      passId: gatepassId,
      barcodeNumber,
      item,
      securityName: currentUser.name,
      securityId: currentUser.username,
      verifiedDate,
      verifiedTime,
    };

    onUpdateItem(item.id, {
      status: "SentForRepair",
      gatepassId,
      gatepassNumber: gatepassId,
      securityOutVerifiedDate: verifiedDate,
      securityOutVerifiedTime: verifiedTime,
      securityOutVerifiedBy: currentUser.name,
      securityOutVerifiedById: currentUser.username,
      securityOutNotes: notes.trim() || undefined,
    });

    setOutgoingVerifyItem(null);
    setOutgoingNotes("");
    setOutgoingGatepass(ogp);
    toast.success(
      `${item.itemName} verified — Gatepass ${gatepassId} generate ho gaya — Print karein`,
    );
  };

  const handlePrintOutgoingGatepass = (ogp: OutgoingGatepass, copies = 1) => {
    const html = buildGatepassPrintHTML({
      passId: ogp.passId,
      passType: "REPAIR / RETURN GATE PASS",
      barcodeNumber: ogp.barcodeNumber,
      fields: [
        ["Item Name", ogp.item.itemName],
        ["Qty / Unit", `${ogp.item.quantity} ${ogp.item.unit}`],
        ["Batch / Serial", ogp.item.batchNo || "—"],
        ["Vendor / Service Center", ogp.item.vendor],
        ["Repair Reason", ogp.item.repairReason],
        ["Dispatched Date", ogp.item.dispatchDate],
        ["Dispatched Time", ogp.item.dispatchTime],
        ["Created By (Dispatch Mgr)", ogp.item.dispatchedBy],
        ["Gate Verified On", `${ogp.verifiedDate} ${ogp.verifiedTime}`],
        ["Verified By", ogp.securityName],
      ],
      signatureName: ogp.securityName,
      signatureId: ogp.securityId,
      signatureRole: "Security Guard",
      signatureVerified: `Gate Verified (Outgoing) — ${ogp.verifiedDate} ${ogp.verifiedTime}`,
      copies,
    });
    const win = window.open("", "_blank", "width=620,height=700");
    if (!win) return;
    win.document.write(html);
    win.document.close();
    setTimeout(() => win.print(), 300);
  };

  const handlePrintReturnGatepass = (rgp: ReturnGatepass, copies = 1) => {
    const html = buildGatepassPrintHTML({
      passId: rgp.passId,
      passType: "RETURN VERIFICATION GATE PASS",
      barcodeNumber: rgp.barcodeNumber,
      fields: [
        ["Item Name", rgp.item.itemName],
        ["Qty / Unit", `${rgp.item.quantity} ${rgp.item.unit}`],
        ["Batch / Serial", rgp.item.batchNo || "—"],
        ["Vendor / Service Center", rgp.item.vendor],
        ["Repair Reason", rgp.item.repairReason],
        ["Dispatch Date", rgp.item.dispatchDate],
        ["Return Verified On", `${rgp.verifiedDate} ${rgp.verifiedTime}`],
        ["Verified By", rgp.securityName],
      ],
      orangeRef: {
        label: "Original Repair Gatepass",
        value: rgp.originalGatepassId,
      },
      signatureName: rgp.securityName,
      signatureId: rgp.securityId,
      signatureRole: "Security Guard",
      signatureVerified: `Gate Verified — ${rgp.verifiedDate} ${rgp.verifiedTime}`,
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
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
          <PackageCheck size={20} className="text-[#D32F2F]" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            Repair & Return Verify
          </h1>
          <p className="text-xs text-gray-500">
            Outgoing repair items aur return items ki gate pe verification —{" "}
            <span className="font-semibold text-[#D32F2F]">
              {currentUser.name}
            </span>
          </p>
        </div>
      </div>

      {/* Gatepass Search Box */}
      <div className="bg-white rounded-xl border-2 border-[#B71C1C]/20 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-3">
          <Search size={16} className="text-[#D32F2F]" />
          <h2 className="text-sm font-bold text-gray-900">
            Gatepass Number se Return Gate Entry Karein
          </h2>
          {pendingItems.length > 0 && (
            <span className="ml-auto bg-yellow-100 text-yellow-700 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
              <RotateCcw size={10} /> {pendingItems.length} Pending
            </span>
          )}
        </div>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search
              size={13}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <Input
              data-ocid="security_return.gatepass_search.input"
              value={gatepassSearch}
              onChange={(e) => setGatepassSearch(e.target.value)}
              placeholder="Repair Gatepass No. type karein — e.g. RRG-20260406-1234"
              className="pl-9 font-mono text-sm"
            />
          </div>
          {gatepassSearch && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setGatepassSearch("")}
            >
              Clear
            </Button>
          )}
        </div>

        {gatepassSearch.trim().length >= 4 && (
          <div className="mt-4">
            {searchedItem ? (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                      <PackageCheck size={18} className="text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">
                        {searchedItem.itemName}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {searchedItem.quantity} {searchedItem.unit} &middot;{" "}
                        {searchedItem.vendor}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Batch: {searchedItem.batchNo || "—"} &middot; Reason:{" "}
                        {searchedItem.repairReason}
                      </p>
                      <p className="text-xs font-mono text-[#D32F2F] font-semibold mt-1">
                        Gatepass:{" "}
                        {searchedItem.gatepassId || searchedItem.referenceId}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">
                      {searchedItem.status === "SentForRepair"
                        ? "Repair Mein — Return Gate Entry Karein"
                        : "Return Gate Entry Pending"}
                    </span>
                    <Button
                      data-ocid="security_return.search_verify.button"
                      size="sm"
                      className="bg-[#D32F2F] hover:bg-[#B71C1C] text-white"
                      onClick={() => {
                        setVerifyItem(searchedItem);
                        setGuardNotes("");
                      }}
                    >
                      <ShieldCheck size={13} className="mr-1" /> Gate Entry
                      (Return)
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
                <Search size={16} className="text-red-400 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-red-700">
                    Gatepass nahi mila
                  </p>
                  <p className="text-xs text-red-500 mt-0.5">
                    "<span className="font-mono">{gatepassSearch}</span>" — Koi
                    pending return verify item nahi mila.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        <div
          className={`bg-white rounded-xl border shadow-sm p-4 flex items-center gap-3 ${outgoingItems.length > 0 ? "border-orange-200" : "border-gray-100"}`}
        >
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center ${outgoingItems.length > 0 ? "bg-orange-100" : "bg-gray-100"}`}
          >
            <ShieldCheck
              size={18}
              className={
                outgoingItems.length > 0 ? "text-orange-600" : "text-gray-400"
              }
            />
          </div>
          <div>
            <p className="text-xs text-gray-500">Outgoing Verify</p>
            <p
              className={`text-2xl font-bold ${outgoingItems.length > 0 ? "text-orange-600" : "text-gray-900"}`}
            >
              {outgoingItems.length}
            </p>
          </div>
        </div>
        <div
          className={`bg-white rounded-xl border shadow-sm p-4 flex items-center gap-3 ${incomingItems.length > 0 ? "border-green-200" : "border-gray-100"}`}
        >
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center ${incomingItems.length > 0 ? "bg-green-100" : "bg-blue-50"}`}
          >
            <RotateCcw
              size={18}
              className={
                incomingItems.length > 0 ? "text-green-600" : "text-blue-600"
              }
            />
          </div>
          <div>
            <p className="text-xs text-gray-500">
              Repair Mein (Gate Entry Karein)
            </p>
            <p
              className={`text-2xl font-bold ${incomingItems.length > 0 ? "text-green-600" : "text-gray-900"}`}
            >
              {incomingItems.length}
            </p>
          </div>
        </div>
        <div
          className={`bg-white rounded-xl border shadow-sm p-4 flex items-center gap-3 ${pendingItems.length > 0 ? "border-yellow-200" : "border-gray-100"}`}
        >
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center ${pendingItems.length > 0 ? "bg-yellow-100" : "bg-gray-100"}`}
          >
            <RotateCcw
              size={18}
              className={
                pendingItems.length > 0 ? "text-yellow-600" : "text-gray-400"
              }
            />
          </div>
          <div>
            <p className="text-xs text-gray-500">Return Verify Pending</p>
            <p
              className={`text-2xl font-bold ${pendingItems.length > 0 ? "text-yellow-600" : "text-gray-900"}`}
            >
              {pendingItems.length}
            </p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
            <ShieldCheck size={18} className="text-green-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Total Records</p>
            <p className="text-2xl font-bold text-gray-900">{items.length}</p>
          </div>
        </div>
      </div>

      {outgoingItems.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-start gap-3">
          <ShieldCheck
            size={18}
            className="text-orange-600 flex-shrink-0 mt-0.5"
          />
          <div>
            <p className="text-sm font-semibold text-orange-800">
              {outgoingItems.length} item{outgoingItems.length > 1 ? "s" : ""}{" "}
              outgoing gate verify karne ke liye pending hain
            </p>
            <p className="text-xs text-orange-700 mt-0.5">
              "Outgoing Verify" tab mein jaayein aur item ko gate pe physically
              verify karke gatepass generate karein.
            </p>
          </div>
        </div>
      )}

      {incomingItems.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
          <RotateCcw
            size={18}
            className="text-green-600 flex-shrink-0 mt-0.5"
          />
          <div>
            <p className="text-sm font-semibold text-green-800">
              {incomingItems.length} item{incomingItems.length > 1 ? "s" : ""}{" "}
              abhi repair mein hain — jab wapas aayein to "Gate Entry (Return)"
              karein
            </p>
            <p className="text-xs text-green-700 mt-0.5">
              Gatepass Number se search karein ya "Repair Mein" tab mein jaayein
            </p>
          </div>
        </div>
      )}
      {pendingItems.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start gap-3">
          <RotateCcw
            size={18}
            className="text-yellow-600 flex-shrink-0 mt-0.5"
          />
          <div>
            <p className="text-sm font-semibold text-yellow-800">
              {pendingItems.length} item{pendingItems.length > 1 ? "s" : ""}{" "}
              return gate pe verify karne ke liye pending hain
            </p>
            <p className="text-xs text-yellow-700 mt-0.5">
              "Return Verify" tab mein jaayein aur gate entry confirm karein.
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 pt-4 pb-0 gap-3 border-b border-gray-100">
          <div className="flex gap-1 overflow-x-auto">
            {(["outgoing", "incoming", "pending", "done"] as const).map(
              (tab) => (
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
                  {tab === "outgoing" && (
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck size={13} /> Outgoing Verify
                      {outgoingItems.length > 0 && (
                        <span className="bg-orange-100 text-orange-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                          {outgoingItems.length}
                        </span>
                      )}
                    </span>
                  )}
                  {tab === "incoming" && (
                    <span className="flex items-center gap-1.5">
                      <RotateCcw size={13} /> Repair Mein
                      {incomingItems.length > 0 && (
                        <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                          {incomingItems.length}
                        </span>
                      )}
                    </span>
                  )}
                  {tab === "pending" && (
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck size={13} /> Return Verify
                      {pendingItems.length > 0 && (
                        <span className="bg-yellow-100 text-yellow-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                          {pendingItems.length}
                        </span>
                      )}
                    </span>
                  )}
                  {tab === "done" && (
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 size={13} /> Verified History
                    </span>
                  )}
                </button>
              ),
            )}
          </div>
          <div className="pb-3">
            <div className="relative">
              <Search
                size={13}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className="h-8 text-xs w-48 pl-8"
              />
            </div>
          </div>
        </div>

        {/* Outgoing Verify Tab - items waiting for Security to verify before going out */}
        {activeTab === "outgoing" && (
          <div className="overflow-x-auto">
            {outgoingItems.filter(
              (i) =>
                i.itemName.toLowerCase().includes(search.toLowerCase()) ||
                i.vendor.toLowerCase().includes(search.toLowerCase()) ||
                i.referenceId.toLowerCase().includes(search.toLowerCase()),
            ).length === 0 ? (
              <div
                data-ocid="security_return.outgoing.empty_state"
                className="flex flex-col items-center justify-center py-14 text-gray-400"
              >
                <ShieldCheck size={32} className="mb-3 opacity-30" />
                <p className="text-sm">Koi outgoing verify item nahi hai</p>
                <p className="text-xs mt-1 text-center">
                  Jab Dispatch Manager "Send for Repair" karega, items yahan
                  aayenge
                </p>
              </div>
            ) : (
              <>
                <div className="bg-orange-50 border-b border-orange-100 px-4 py-2">
                  <p className="text-xs text-orange-700 font-medium flex items-center gap-1.5">
                    <ShieldCheck size={13} /> Ye items gate se nikalne se pehle
                    aapki verification chahiye — gate pe physically check karke
                    gatepass generate karein
                  </p>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="text-xs">Ref ID</TableHead>
                      <TableHead className="text-xs">Item Name</TableHead>
                      <TableHead className="text-xs">Qty/Unit</TableHead>
                      <TableHead className="text-xs">Batch/Serial</TableHead>
                      <TableHead className="text-xs">Vendor</TableHead>
                      <TableHead className="text-xs">Repair Reason</TableHead>
                      <TableHead className="text-xs">Created By</TableHead>
                      <TableHead className="text-xs text-center">
                        Action
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {outgoingItems
                      .filter(
                        (i) =>
                          i.itemName
                            .toLowerCase()
                            .includes(search.toLowerCase()) ||
                          i.vendor
                            .toLowerCase()
                            .includes(search.toLowerCase()) ||
                          i.referenceId
                            .toLowerCase()
                            .includes(search.toLowerCase()),
                      )
                      .map((item, idx) => (
                        <TableRow
                          key={item.id}
                          data-ocid={`security_return.outgoing_item.${idx + 1}`}
                          className="hover:bg-orange-50/30"
                        >
                          <TableCell className="text-xs font-mono text-gray-500 py-3">
                            {item.referenceId}
                          </TableCell>
                          <TableCell className="text-xs font-semibold text-gray-900 py-3">
                            {item.itemName}
                          </TableCell>
                          <TableCell className="text-xs text-gray-600 py-3">
                            {item.quantity} {item.unit}
                          </TableCell>
                          <TableCell className="text-xs text-gray-500 py-3">
                            {item.batchNo || "—"}
                          </TableCell>
                          <TableCell className="text-xs text-gray-600 py-3">
                            {item.vendor}
                          </TableCell>
                          <TableCell className="text-xs text-gray-500 py-3">
                            {item.repairReason}
                          </TableCell>
                          <TableCell className="text-xs text-gray-600 py-3">
                            {item.dispatchedBy}
                          </TableCell>
                          <TableCell className="py-3">
                            <div className="flex items-center gap-1 justify-center">
                              <button
                                type="button"
                                onClick={() => setViewItem(item)}
                                className="p-1.5 rounded hover:bg-blue-50 text-blue-600"
                              >
                                <Eye size={13} />
                              </button>
                              <Button
                                data-ocid={`security_return.outgoing_verify.button.${idx + 1}`}
                                size="sm"
                                className="bg-[#D32F2F] hover:bg-[#B71C1C] text-white text-[10px] h-7 px-2"
                                onClick={() => {
                                  setOutgoingVerifyItem(item);
                                  setOutgoingNotes("");
                                }}
                              >
                                <ShieldCheck size={11} className="mr-1" />{" "}
                                Verify & Gatepass
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </>
            )}
          </div>
        )}

        {/* Repair Mein Tab - items security knows are out for repair */}
        {activeTab === "incoming" && (
          <div className="overflow-x-auto">
            {filteredIncoming.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 text-gray-400">
                <RotateCcw size={32} className="mb-3 opacity-30" />
                <p className="text-sm">Koi item abhi repair mein nahi hai</p>
                <p className="text-xs mt-1">
                  Jab Dispatch Manager item repair ke liye bhejega, yahan
                  dikhega
                </p>
              </div>
            ) : (
              <>
                <div className="bg-green-50 border-b border-green-100 px-4 py-2">
                  <p className="text-xs text-green-700 font-medium flex items-center gap-1.5">
                    <RotateCcw size={13} /> Jab koi item wapas aaye — "Gate
                    Entry (Return)" button dabao. Security ka gate entry hone ke
                    baad hi Dispatch Manager ka status update hoga.
                  </p>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="text-xs">Gatepass No.</TableHead>
                      <TableHead className="text-xs">Item Name</TableHead>
                      <TableHead className="text-xs">Qty/Unit</TableHead>
                      <TableHead className="text-xs">Vendor</TableHead>
                      <TableHead className="text-xs">Sent Date</TableHead>
                      <TableHead className="text-xs">Repair Reason</TableHead>
                      <TableHead className="text-xs">Expected Return</TableHead>
                      <TableHead className="text-xs text-center">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredIncoming.map((item, idx) => (
                      <TableRow
                        key={item.id}
                        data-ocid={`security_return.incoming_item.${idx + 1}`}
                        className="hover:bg-blue-50/30"
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
                          {item.repairReason}
                        </TableCell>
                        <TableCell className="text-xs text-gray-500 py-3">
                          {item.expectedReturnDate || (
                            <span className="text-gray-300">—</span>
                          )}
                        </TableCell>
                        <TableCell className="py-3 text-center">
                          <div className="flex items-center gap-1 justify-center">
                            <button
                              type="button"
                              onClick={() => setViewItem(item)}
                              className="p-1.5 rounded hover:bg-blue-50 text-blue-600"
                            >
                              <Eye size={13} />
                            </button>
                            <Button
                              data-ocid={`security_return.gate_entry_return.button.${idx + 1}`}
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white text-[10px] h-7 px-2"
                              onClick={() => {
                                setVerifyItem(item);
                                setGuardNotes("");
                              }}
                            >
                              <RotateCcw size={11} className="mr-1" /> Gate
                              Entry (Return)
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </>
            )}
          </div>
        )}

        {/* Verify Pending Tab */}
        {activeTab === "pending" && (
          <div className="overflow-x-auto">
            {filteredPending.length === 0 ? (
              <div
                data-ocid="security_return.pending.empty_state"
                className="flex flex-col items-center justify-center py-14 text-gray-400"
              >
                <RotateCcw size={32} className="mb-3 opacity-30" />
                <p className="text-sm">Koi pending verify item nahi hai</p>
                <p className="text-xs mt-1 text-center">
                  Ye tab ab internal use ke liye hai — Security "Repair Mein"
                  tab se seedha Gate Entry kare
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
                    <TableHead className="text-xs">Return Initiated</TableHead>
                    <TableHead className="text-xs text-center">
                      Action
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPending.map((item, idx) => (
                    <TableRow
                      key={item.id}
                      data-ocid={`security_return.pending_item.${idx + 1}`}
                      className="hover:bg-yellow-50/40"
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
                      </TableCell>
                      <TableCell className="text-xs text-gray-600 py-3">
                        {item.returnInitiatedDate || "—"}
                        {item.returnInitiatedBy && (
                          <>
                            <br />
                            <span className="text-gray-400">
                              {item.returnInitiatedBy}
                            </span>
                          </>
                        )}
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="flex items-center gap-1 justify-center">
                          <button
                            type="button"
                            onClick={() => setViewItem(item)}
                            className="p-1.5 rounded hover:bg-blue-50 text-blue-600"
                          >
                            <Eye size={13} />
                          </button>
                          <Button
                            data-ocid={`security_return.list_verify.button.${idx + 1}`}
                            size="sm"
                            className="bg-[#D32F2F] hover:bg-[#B71C1C] text-white text-[10px] h-7 px-2"
                            onClick={() => {
                              setVerifyItem(item);
                              setGuardNotes("");
                            }}
                          >
                            <ShieldCheck size={11} className="mr-1" /> Return
                            Gate Entry
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        )}

        {/* Verified History Tab */}
        {activeTab === "done" && (
          <div className="overflow-x-auto">
            {filteredDone.length === 0 ? (
              <div
                data-ocid="security_return.done.empty_state"
                className="flex flex-col items-center justify-center py-14 text-gray-400"
              >
                <ShieldCheck size={32} className="mb-3 opacity-30" />
                <p className="text-sm">Koi verified item nahi hai abhi</p>
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
                    <TableHead className="text-xs">Verified By</TableHead>
                    <TableHead className="text-xs">Verified On</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs text-center">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDone.map((item, idx) => (
                    <TableRow
                      key={item.id}
                      data-ocid={`security_return.done_item.${idx + 1}`}
                      className="hover:bg-gray-50/60"
                    >
                      <TableCell className="text-xs font-mono text-[#D32F2F] py-3">
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
                      <TableCell className="text-xs py-3">
                        <span className="flex items-center gap-1 text-green-700 font-medium">
                          <ShieldCheck size={11} />
                          {item.securityVerifiedBy || "—"}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-gray-600 py-3">
                        {item.securityVerifiedDate}
                        {item.securityVerifiedTime && (
                          <>
                            <br />
                            <span className="text-gray-400">
                              {item.securityVerifiedTime}
                            </span>
                          </>
                        )}
                      </TableCell>
                      <TableCell className="py-3">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                            item.status === "Returned"
                              ? "bg-green-100 text-green-700 border-green-200"
                              : "bg-purple-100 text-purple-700 border-purple-200"
                          }`}
                        >
                          {item.status === "Returned"
                            ? "Returned"
                            : "Awaiting Acceptance"}
                        </span>
                      </TableCell>
                      <TableCell className="py-3 text-center">
                        <button
                          type="button"
                          onClick={() => setViewItem(item)}
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
      </div>

      {/* Outgoing Verify Confirm Dialog */}
      <Dialog
        open={!!outgoingVerifyItem}
        onOpenChange={(open) => {
          if (!open) {
            setOutgoingVerifyItem(null);
            setOutgoingNotes("");
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-[#D32F2F]" /> Gate Verify —
              Outgoing Item
            </DialogTitle>
          </DialogHeader>
          {outgoingVerifyItem && (
            <div className="space-y-4 mt-2">
              <div className="bg-gray-50 rounded-lg p-3 text-sm">
                <p className="font-semibold text-gray-900">
                  {outgoingVerifyItem.itemName}
                </p>
                <p className="text-gray-500 text-xs mt-1">
                  {outgoingVerifyItem.quantity} {outgoingVerifyItem.unit}{" "}
                  &middot; {outgoingVerifyItem.vendor}
                </p>
                <p className="text-gray-400 text-xs mt-0.5">
                  Batch/Serial: {outgoingVerifyItem.batchNo || "—"}
                </p>
                {outgoingVerifyItem.repairReason && (
                  <p className="text-gray-500 text-xs mt-1">
                    Repair reason: {outgoingVerifyItem.repairReason}
                  </p>
                )}
                <p className="text-gray-400 text-xs mt-1">
                  Dispatched By: {outgoingVerifyItem.dispatchedBy}
                </p>
              </div>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                <p className="text-xs text-orange-800 font-medium">
                  Gate Guard Instructions (Outgoing):
                </p>
                <ul className="text-xs text-orange-700 mt-1 space-y-1 list-disc list-inside">
                  <li>Item ko physically gate pe check karein</li>
                  <li>
                    Item ki condition, quantity, aur details verify karein
                  </li>
                  <li>Verify karne par RRG Gatepass generate hoga</li>
                  <li>
                    Print karke 1 copy item ke saath bhejen, 1 records ke liye
                    rakhen
                  </li>
                </ul>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-center gap-2">
                <ShieldCheck
                  size={14}
                  className="text-yellow-700 flex-shrink-0"
                />
                <p className="text-xs text-yellow-800">
                  Verify karne wale Security Guard:{" "}
                  <strong>{currentUser.name}</strong> ({currentUser.username})
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">
                  Guard Notes (optional)
                </Label>
                <Textarea
                  data-ocid="security_return.outgoing_notes.textarea"
                  value={outgoingNotes}
                  onChange={(e) => setOutgoingNotes(e.target.value)}
                  placeholder="e.g. Item checked — condition OK, all parts present"
                  className="mt-1 resize-none"
                  rows={2}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setOutgoingVerifyItem(null);
                    setOutgoingNotes("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  data-ocid="security_return.outgoing_verify_confirm.button"
                  onClick={() =>
                    handleVerifyOutgoing(outgoingVerifyItem, outgoingNotes)
                  }
                  className="bg-[#D32F2F] hover:bg-[#B71C1C] text-white"
                >
                  <CheckCircle2 size={14} className="mr-1" /> Verify & Generate
                  Gatepass
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Outgoing Gatepass Modal */}
      <Dialog
        open={!!outgoingGatepass}
        onOpenChange={(open) => !open && setOutgoingGatepass(null)}
      >
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle
              data-ocid="security_return.outgoing_gatepass_modal"
              className="flex items-center gap-2"
            >
              <ShieldCheck size={16} className="text-green-600" /> Repair
              Outgoing Gatepass Generated
            </DialogTitle>
          </DialogHeader>
          {outgoingGatepass && (
            <div className="space-y-4">
              <div className="border-2 border-[#B71C1C] rounded-xl overflow-hidden">
                <div className="bg-[#B71C1C] text-white px-5 py-3 text-center">
                  <p className="text-xs font-semibold opacity-80">
                    SWIFT LIFE SCIENCES PVT. LTD.
                  </p>
                  <p className="text-sm font-bold">REPAIR / RETURN GATE PASS</p>
                  <p className="text-xs opacity-70">
                    D-1, Sara Industrial Estate, Selaqui, Dehradun | Ph: 0135
                    269 9975
                  </p>
                </div>
                <div className="px-5 py-4 bg-gray-50 flex items-center justify-between border-b border-gray-200">
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide">
                      Gatepass ID
                    </p>
                    <p className="text-lg font-bold text-gray-900">
                      {outgoingGatepass.passId}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-gray-400">Barcode</p>
                    <p className="font-mono text-xs font-bold tracking-widest text-gray-700">
                      {outgoingGatepass.barcodeNumber}
                    </p>
                    <div className="flex gap-px mt-1 justify-end">
                      {[
                        "b0",
                        "b1",
                        "b2",
                        "b3",
                        "b4",
                        "b5",
                        "b6",
                        "b7",
                        "b8",
                        "b9",
                        "b10",
                        "b11",
                        "b12",
                        "b13",
                        "b14",
                        "b15",
                        "b16",
                        "b17",
                        "b18",
                        "b19",
                        "b20",
                        "b21",
                        "b22",
                        "b23",
                        "b24",
                        "b25",
                        "b26",
                        "b27",
                      ].map((k, i) => (
                        <div
                          key={k}
                          className="bg-gray-900"
                          style={{ width: i % 3 === 0 ? 3 : 1.5, height: 24 }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="px-5 py-4">
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    {[
                      ["Item Name", outgoingGatepass.item.itemName],
                      [
                        "Qty / Unit",
                        `${outgoingGatepass.item.quantity} ${outgoingGatepass.item.unit}`,
                      ],
                      ["Batch / Serial", outgoingGatepass.item.batchNo || "—"],
                      ["Vendor / Service Center", outgoingGatepass.item.vendor],
                      ["Repair Reason", outgoingGatepass.item.repairReason],
                      ["Dispatched By", outgoingGatepass.item.dispatchedBy],
                      [
                        "Gate Verified On",
                        `${outgoingGatepass.verifiedDate} ${outgoingGatepass.verifiedTime}`,
                      ],
                    ].map(([l, v]) => (
                      <div key={l}>
                        <p className="text-gray-400 text-[10px] uppercase tracking-wide">
                          {l}
                        </p>
                        <p className="font-semibold text-gray-900">{v}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="px-5 py-4 border-t border-gray-200 bg-white">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold mb-3">
                    Security Guard Digital Signature
                  </p>
                  <div className="border border-gray-200 rounded-lg p-3 bg-gray-50 text-center">
                    <p className="text-sm font-bold text-[#B71C1C] italic">
                      {outgoingGatepass.securityName}
                    </p>
                    <p className="text-[10px] text-gray-500 mt-0.5">
                      ID: {outgoingGatepass.securityId}
                    </p>
                    <p className="text-[10px] text-gray-400">Security Guard</p>
                    <p className="text-[10px] text-green-600 mt-1 font-medium">
                      &#10003; Gate Verified (Outgoing) —{" "}
                      {outgoingGatepass.verifiedDate}{" "}
                      {outgoingGatepass.verifiedTime}
                    </p>
                  </div>
                </div>
                <div className="px-5 py-3 bg-gray-50 border-t border-gray-200 flex justify-between text-[10px] text-gray-500">
                  <span>
                    Verified by: {outgoingGatepass.securityName} (
                    {outgoingGatepass.securityId})
                  </span>
                  <span>
                    {outgoingGatepass.verifiedDate} &bull;{" "}
                    {outgoingGatepass.verifiedTime}
                  </span>
                </div>
              </div>
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                <p className="text-xs text-blue-800 font-medium flex items-center gap-1.5">
                  <ShieldCheck size={13} /> Gatepass generate ho gaya — Dispatch
                  Manager ke Active Repairs mein dikhega
                </p>
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setOutgoingGatepass(null)}
                >
                  Close
                </Button>
                <Button
                  data-ocid="security_return.outgoing_print1.button"
                  size="sm"
                  className="bg-[#D32F2F] hover:bg-[#B71C1C] text-white"
                  onClick={() =>
                    handlePrintOutgoingGatepass(outgoingGatepass, 1)
                  }
                >
                  <Printer size={13} className="mr-1" /> Print 1 Copy
                </Button>
                <Button
                  data-ocid="security_return.outgoing_print2.button"
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    handlePrintOutgoingGatepass(outgoingGatepass, 2)
                  }
                >
                  <Printer size={13} className="mr-1" /> Print 2 Copies
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Gate Verify Confirm Dialog */}
      <Dialog
        open={!!verifyItem}
        onOpenChange={(open) => {
          if (!open) {
            setVerifyItem(null);
            setGuardNotes("");
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-[#D32F2F]" /> Gate Verify —
              Item Aaya Hai?
            </DialogTitle>
          </DialogHeader>
          {verifyItem && (
            <div className="space-y-4 mt-2">
              <div className="bg-gray-50 rounded-lg p-3 text-sm">
                <p className="font-semibold text-gray-900">
                  {verifyItem.itemName}
                </p>
                <p className="text-gray-500 text-xs mt-1">
                  {verifyItem.quantity} {verifyItem.unit} &middot;{" "}
                  {verifyItem.vendor}
                </p>
                <p className="text-gray-400 text-xs mt-0.5">
                  Repair ke liye bheja: {verifyItem.dispatchDate}{" "}
                  {verifyItem.dispatchTime}
                </p>
                {verifyItem.batchNo && (
                  <p className="text-gray-400 text-xs">
                    Batch/Serial: {verifyItem.batchNo}
                  </p>
                )}
                {verifyItem.repairReason && (
                  <p className="text-gray-500 text-xs mt-1">
                    Repair reason: {verifyItem.repairReason}
                  </p>
                )}
                <p className="text-[#D32F2F] text-xs font-mono font-semibold mt-2">
                  Gatepass: {verifyItem.gatepassId || verifyItem.referenceId}
                </p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-800 font-medium">
                  Gate Guard Instructions:
                </p>
                <ul className="text-xs text-blue-700 mt-1 space-y-1 list-disc list-inside">
                  <li>Physically item ko gate pe check karein</li>
                  <li>
                    Item ka condition, quantity, aur batch no. verify karein
                  </li>
                  <li>Verify karne par Return Gatepass generate hoga</li>
                  <li>Dispatch Manager ko automatically forward ho jaayega</li>
                </ul>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-center gap-2">
                <ShieldCheck
                  size={14}
                  className="text-yellow-700 flex-shrink-0"
                />
                <p className="text-xs text-yellow-800">
                  Verify karne wale Security Guard:{" "}
                  <strong>{currentUser.name}</strong>
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">
                  Guard Notes (optional)
                </Label>
                <Textarea
                  data-ocid="security_return.guard_notes.textarea"
                  value={guardNotes}
                  onChange={(e) => setGuardNotes(e.target.value)}
                  placeholder="e.g. Item checked — condition OK, packaging intact"
                  className="mt-1 resize-none"
                  rows={2}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setVerifyItem(null);
                    setGuardNotes("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  data-ocid="security_return.verify_confirm.button"
                  onClick={() => handleVerify(verifyItem, guardNotes)}
                  className="bg-[#D32F2F] hover:bg-[#B71C1C] text-white"
                >
                  <CheckCircle2 size={14} className="mr-1" /> Verify & Forward
                  to Dispatch
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Return Gatepass Modal */}
      <Dialog
        open={!!returnGatepass}
        onOpenChange={(open) => !open && setReturnGatepass(null)}
      >
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle
              data-ocid="security_return.return_gatepass_modal"
              className="flex items-center gap-2"
            >
              <ShieldCheck size={16} className="text-green-600" /> Return
              Gatepass Generated
            </DialogTitle>
          </DialogHeader>
          {returnGatepass && (
            <div className="space-y-4">
              <div ref={passRef}>
                <div className="border-2 border-[#B71C1C] rounded-xl overflow-hidden">
                  <div className="bg-[#B71C1C] text-white px-5 py-3 text-center">
                    <p className="text-xs font-semibold opacity-80">
                      SWIFT LIFE SCIENCES PVT. LTD.
                    </p>
                    <p className="text-sm font-bold">
                      RETURN VERIFICATION GATE PASS
                    </p>
                    <p className="text-xs opacity-70">
                      D-1, Sara Industrial Estate, Selaqui, Dehradun | Ph: 0135
                      269 9975
                    </p>
                  </div>
                  <div className="px-5 py-4 bg-gray-50 flex items-center justify-between border-b border-gray-200">
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wide">
                        Return Gatepass ID
                      </p>
                      <p className="text-lg font-bold text-gray-900">
                        {returnGatepass.passId}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-gray-400">Barcode</p>
                      <p className="font-mono text-xs font-bold tracking-widest text-gray-700">
                        {returnGatepass.barcodeNumber}
                      </p>
                      <div className="flex gap-px mt-1 justify-end">
                        {[
                          "b0",
                          "b1",
                          "b2",
                          "b3",
                          "b4",
                          "b5",
                          "b6",
                          "b7",
                          "b8",
                          "b9",
                          "b10",
                          "b11",
                          "b12",
                          "b13",
                          "b14",
                          "b15",
                          "b16",
                          "b17",
                          "b18",
                          "b19",
                          "b20",
                          "b21",
                          "b22",
                          "b23",
                          "b24",
                          "b25",
                          "b26",
                          "b27",
                        ].map((k, i) => (
                          <div
                            key={k}
                            className="bg-gray-900"
                            style={{ width: i % 3 === 0 ? 3 : 1.5, height: 24 }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="px-5 py-4">
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      {[
                        ["Item Name", returnGatepass.item.itemName],
                        [
                          "Quantity / Unit",
                          `${returnGatepass.item.quantity} ${returnGatepass.item.unit}`,
                        ],
                        [
                          "Batch / Serial No.",
                          returnGatepass.item.batchNo || "—",
                        ],
                        ["Vendor / Service Center", returnGatepass.item.vendor],
                        ["Dispatched Date", returnGatepass.item.dispatchDate],
                        [
                          "Return Verified On",
                          `${returnGatepass.verifiedDate} ${returnGatepass.verifiedTime}`,
                        ],
                      ].map(([l, v]) => (
                        <div key={l}>
                          <p className="text-gray-400 text-[10px] uppercase tracking-wide">
                            {l}
                          </p>
                          <p className="font-semibold text-gray-900">{v}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="px-5 py-3 bg-orange-50 border-t border-orange-100">
                    <p className="text-[10px] text-orange-600 uppercase tracking-wide font-semibold">
                      Original Repair Gatepass
                    </p>
                    <p className="text-base font-bold text-orange-800 font-mono">
                      {returnGatepass.originalGatepassId}
                    </p>
                  </div>
                  <div className="px-5 py-4 border-t border-gray-200 bg-white">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold mb-3">
                      Security Guard Digital Signature
                    </p>
                    <div className="border border-gray-200 rounded-lg p-3 bg-gray-50 text-center">
                      <p className="text-sm font-bold text-[#B71C1C] italic">
                        {returnGatepass.securityName}
                      </p>
                      <p className="text-[10px] text-gray-500 mt-0.5">
                        ID: {returnGatepass.securityId}
                      </p>
                      <p className="text-[10px] text-gray-400">
                        Security Guard
                      </p>
                      <p className="text-[10px] text-green-600 mt-1 font-medium">
                        &#10003; Gate Verified — {returnGatepass.verifiedDate}{" "}
                        {returnGatepass.verifiedTime}
                      </p>
                    </div>
                  </div>
                  <div className="px-5 py-3 bg-gray-50 border-t border-gray-200 flex justify-between text-[10px] text-gray-500">
                    <span>
                      Verified by: {returnGatepass.securityName} (
                      {returnGatepass.securityId})
                    </span>
                    <span>
                      {returnGatepass.verifiedDate} &bull;{" "}
                      {returnGatepass.verifiedTime}
                    </span>
                  </div>
                </div>
              </div>
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                <p className="text-xs text-blue-800 font-medium flex items-center gap-1.5">
                  <ShieldCheck size={13} /> Dispatch Manager ko notification
                  bhej di gayi hai. Woh "Accept Pending" mein item dekhenge.
                </p>
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setReturnGatepass(null)}
                >
                  Close
                </Button>
                <Button
                  data-ocid="security_return.print1.button"
                  size="sm"
                  className="bg-[#D32F2F] hover:bg-[#B71C1C] text-white"
                  onClick={() => handlePrintReturnGatepass(returnGatepass, 1)}
                >
                  <Printer size={13} className="mr-1" /> Print 1 Copy
                </Button>
                <Button
                  data-ocid="security_return.print2.button"
                  size="sm"
                  variant="outline"
                  onClick={() => handlePrintReturnGatepass(returnGatepass, 2)}
                >
                  <Printer size={13} className="mr-1" /> Print 2 Copies
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* View Item Dialog */}
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
            <div className="grid grid-cols-2 gap-3">
              {(
                [
                  [
                    "Repair Gatepass",
                    viewItem.gatepassId || viewItem.referenceId,
                  ],
                  ["Return Gatepass", viewItem.returnGatepassId || "—"],
                  ["Item Name", viewItem.itemName],
                  ["Qty / Unit", `${viewItem.quantity} ${viewItem.unit}`],
                  ["Batch / Serial", viewItem.batchNo || "—"],
                  ["Vendor", viewItem.vendor],
                  ["Repair Reason", viewItem.repairReason],
                  [
                    "Sent Date",
                    `${viewItem.dispatchDate} ${viewItem.dispatchTime}`,
                  ],
                  ["Return Initiated By", viewItem.returnInitiatedBy || "—"],
                  [
                    "Gate Verified By",
                    viewItem.securityVerifiedBy || "Pending",
                  ],
                  ...(viewItem.securityVerifiedDate
                    ? [
                        [
                          "Verified On",
                          `${viewItem.securityVerifiedDate} ${viewItem.securityVerifiedTime}`,
                        ],
                      ]
                    : []),
                  ...(viewItem.securityNotes
                    ? [["Guard Notes", viewItem.securityNotes]]
                    : []),
                  ...(viewItem.returnDate
                    ? [
                        [
                          "Final Return Date",
                          `${viewItem.returnDate} ${viewItem.returnTime}`,
                        ],
                      ]
                    : []),
                  ...(viewItem.receivedBy
                    ? [["Received By", viewItem.receivedBy]]
                    : []),
                ] as [string, string][]
              ).map(([label, value]) => (
                <div key={label} className="bg-gray-50 rounded-lg p-2.5">
                  <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wide">
                    {label}
                  </p>
                  <div className="text-sm text-gray-900 mt-0.5 font-medium">
                    {value}
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
