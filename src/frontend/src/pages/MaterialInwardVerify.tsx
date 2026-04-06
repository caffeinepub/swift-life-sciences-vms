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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import {
  ArrowRight,
  CheckCircle,
  ClipboardCheck,
  Download,
  FileCheck,
  History,
  PackageOpen,
  Printer,
  Search,
  Truck,
  Warehouse,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import type {
  AppView,
  CurrentUser,
  DepartmentTransfer,
  Material,
  StoreInwardItem,
} from "../types";
import { buildGatepassPrintHTML } from "./DispatchGatepass";

// Only Store Manager and Dispatch Manager as forwarding options
const FORWARD_OPTIONS = [
  { value: "Store", label: "Store Manager" },
  { value: "Dispatch", label: "Dispatch Manager" },
];

interface MaterialInwardVerifyProps {
  materials: Material[];
  onUpdateMaterial: (id: string, updates: Partial<Material>) => void;
  onAddStoreItem: (item: StoreInwardItem) => void;
  onAddDepartmentTransfer: (transfer: DepartmentTransfer) => void;
  onNavigate: (view: AppView) => void;
  currentUser: CurrentUser | null;
}

interface GeneratedPass {
  passId: string;
  material: Material;
  destination: string;
  verifiedAt: string;
  verifiedDate: string;
  barcodeNumber: string;
  securityName: string;
  securityId: string;
}

export function MaterialInwardVerify({
  materials,
  onUpdateMaterial,
  onAddStoreItem,
  onAddDepartmentTransfer,
  currentUser,
}: MaterialInwardVerifyProps) {
  const [tab, setTab] = useState<"pending" | "history">("pending");
  const [search, setSearch] = useState("");
  const [historySearch, setHistorySearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(
    null,
  );
  const [destinationMap, setDestinationMap] = useState<Record<string, string>>(
    {},
  );
  const [generatedPass, setGeneratedPass] = useState<GeneratedPass | null>(
    null,
  );
  const passRef = useRef<HTMLDivElement>(null);

  const pendingMaterials = materials.filter(
    (m) => m.type === "In" && m.status === "Pending",
  );
  const clearedMaterials = materials.filter(
    (m) => m.type === "In" && m.status === "Cleared",
  );

  const filteredPending = pendingMaterials.filter((m) => {
    const q = search.toLowerCase();
    return (
      m.name.toLowerCase().includes(q) ||
      m.company.toLowerCase().includes(q) ||
      m.vehicle.toLowerCase().includes(q) ||
      m.driverName.toLowerCase().includes(q)
    );
  });

  const filteredHistory = clearedMaterials.filter((m) => {
    const q = historySearch.toLowerCase();
    const matchSearch =
      m.name.toLowerCase().includes(q) ||
      m.company.toLowerCase().includes(q) ||
      m.passId.toLowerCase().includes(q);
    const matchDate = dateFilter ? m.date === dateFilter : true;
    return matchSearch && matchDate;
  });

  const getDestination = (id: string) => destinationMap[id] || "Store";

  const setDestination = (id: string, value: string) => {
    setDestinationMap((prev) => ({ ...prev, [id]: value }));
  };

  const handleVerify = (material: Material) => {
    const destination = getDestination(material.id);
    const now = new Date();
    const verifiedAt = format(now, "hh:mm aa");
    const verifiedDate = format(now, "yyyy-MM-dd");
    const dateStr = format(now, "yyyyMMdd");
    const seq = String(Math.floor(Math.random() * 9000) + 1000);
    const passId = `MIG-${dateStr}-${seq}`;

    // Update material status
    onUpdateMaterial(material.id, { status: "Cleared", destination });

    if (destination === "Store") {
      // Send to store manager
      const storeItem: StoreInwardItem = {
        id: `SI-${Date.now()}`,
        materialId: material.id,
        materialName: material.name,
        quantity: material.quantity,
        unit: material.unit,
        company: material.company,
        receivedDate: verifiedDate,
        receivedTime: verifiedAt,
        acknowledged: false,
        gatepassId: passId,
      };
      onAddStoreItem(storeItem);
      toast.success("Material forwarded to Store Manager");
    } else {
      // Send to Dispatch Manager
      const transfer: DepartmentTransfer = {
        id: `DT-${Date.now()}`,
        materialId: material.id,
        materialName: material.name,
        quantity: material.quantity,
        unit: material.unit,
        company: material.company,
        department: destination,
        transferredBy: currentUser?.name || "Security",
        transferDate: verifiedDate,
        transferTime: verifiedAt,
        gatepassId: passId,
      };
      onAddDepartmentTransfer(transfer);
      toast.success("Material forwarded to Dispatch Manager");
    }

    const securityId = currentUser?.username || currentUser?.name || "Security";

    const gp: GeneratedPass = {
      passId,
      material,
      destination,
      verifiedAt,
      verifiedDate,
      barcodeNumber: `MIG${dateStr}${seq}`,
      securityName: currentUser?.name || "Security Guard",
      securityId,
    };
    setGeneratedPass(gp);
    setSelectedMaterial(null);
  };

  const handlePrint = (copies = 1) => {
    if (!generatedPass) return;
    const html = buildGatepassPrintHTML({
      passId: generatedPass.passId,
      passType: "MATERIAL INWARD GATE PASS",
      barcodeNumber: generatedPass.barcodeNumber,
      fields: [
        ["Material", generatedPass.material.name],
        [
          "Quantity",
          `${generatedPass.material.quantity} ${generatedPass.material.unit}`,
        ],
        ["Company / Supplier", generatedPass.material.company],
        ["Vehicle No.", generatedPass.material.vehicle],
        ["Driver Name", generatedPass.material.driverName],
        ["Entry Time", generatedPass.material.inTime],
        ["Verified Date", generatedPass.verifiedDate],
        ["Verified Time", generatedPass.verifiedAt],
      ],
      orangeRef: {
        label: "Forwarded To",
        value:
          generatedPass.destination === "Store"
            ? "Store Manager"
            : "Dispatch Manager",
      },
      signatureName: generatedPass.securityName,
      signatureId: generatedPass.securityId,
      signatureRole: "Security Guard",
      signatureVerified: `Digitally Verified — ${generatedPass.verifiedDate} ${generatedPass.verifiedAt}`,
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
          <PackageOpen size={20} className="text-[#D32F2F]" />
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              Material Inward Verification
            </h1>
            <p className="text-xs text-gray-500">
              <span className="text-yellow-600 font-medium">
                {pendingMaterials.length} pending
              </span>{" "}
              &bull;{" "}
              <span className="text-green-600 font-medium">
                {clearedMaterials.length} cleared
              </span>
            </p>
          </div>
        </div>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <TabsList className="bg-gray-100">
          <TabsTrigger data-ocid="material_inward.pending.tab" value="pending">
            <ClipboardCheck size={14} className="mr-1" />
            Pending ({pendingMaterials.length})
          </TabsTrigger>
          <TabsTrigger data-ocid="material_inward.history.tab" value="history">
            <History size={14} className="mr-1" />
            History ({clearedMaterials.length})
          </TabsTrigger>
        </TabsList>

        {/* PENDING TAB */}
        <TabsContent value="pending">
          <div className="space-y-3">
            {/* Search */}
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <Input
                data-ocid="material_inward.search.input"
                placeholder="Search by material, company, vehicle, driver..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-white"
              />
            </div>

            {filteredPending.length === 0 ? (
              <div
                data-ocid="material_inward.empty_state"
                className="flex flex-col items-center justify-center py-14 bg-white rounded-xl border border-gray-100 shadow-sm text-gray-400"
              >
                <CheckCircle size={32} className="mb-3 opacity-30" />
                <p className="text-sm">No pending material inward entries</p>
                <p className="text-xs mt-1">All materials have been verified</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredPending.map((mat, idx) => (
                  <div
                    key={mat.id}
                    data-ocid={`material_inward.item.${idx + 1}`}
                    className="bg-white rounded-xl border border-gray-100 shadow-sm p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                          <PackageOpen size={18} className="text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">
                            {mat.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {mat.quantity} {mat.unit} &bull; {mat.company}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            Vehicle: {mat.vehicle} &bull; Driver:{" "}
                            {mat.driverName}
                          </p>
                          <p className="text-xs font-mono text-gray-400 mt-0.5">
                            Barcode: {mat.barcodeNumber}
                          </p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <Badge
                          variant="outline"
                          className="bg-yellow-50 text-yellow-700 border-yellow-200 text-[10px]"
                        >
                          Pending Verification
                        </Badge>
                        <p className="text-xs text-gray-400 mt-1">
                          {mat.date} &bull; {mat.inTime}
                        </p>
                      </div>
                    </div>

                    {/* Forward To: only Store Manager or Dispatch Manager */}
                    <div className="mt-4 pt-4 border-t border-gray-100 flex items-end gap-3 flex-wrap">
                      <div className="flex-1 min-w-[200px]">
                        <Label className="text-xs font-medium text-gray-600 mb-1 block">
                          Forward To
                        </Label>
                        <Select
                          value={getDestination(mat.id)}
                          onValueChange={(v) => setDestination(mat.id, v)}
                        >
                          <SelectTrigger
                            data-ocid={`material_inward.destination.select.${idx + 1}`}
                            className="h-9 text-sm"
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {FORWARD_OPTIONS.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                <span className="flex items-center gap-2">
                                  {opt.value === "Store" ? (
                                    <Warehouse
                                      size={12}
                                      className="text-green-600"
                                    />
                                  ) : (
                                    <Truck
                                      size={12}
                                      className="text-blue-600"
                                    />
                                  )}
                                  {opt.label}
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button
                        data-ocid={`material_inward.verify.button.${idx + 1}`}
                        onClick={() => {
                          setSelectedMaterial(mat);
                        }}
                        className="bg-[#D32F2F] hover:bg-[#B71C1C] text-white h-9"
                        size="sm"
                      >
                        <FileCheck size={14} className="mr-2" />
                        Verify &amp; Generate Pass
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
                  data-ocid="material_inward.history_search.input"
                  placeholder="Search cleared materials..."
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  className="pl-9 bg-white"
                />
              </div>
              <Input
                data-ocid="material_inward.date_filter.input"
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-40 bg-white"
              />
              {dateFilter && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDateFilter("")}
                >
                  Clear
                </Button>
              )}
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              {filteredHistory.length === 0 ? (
                <div
                  data-ocid="material_inward.history_empty_state"
                  className="flex flex-col items-center justify-center py-12 text-gray-400"
                >
                  <History size={28} className="mb-2 opacity-30" />
                  <p className="text-sm">No cleared material records found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="text-xs">Pass ID</TableHead>
                        <TableHead className="text-xs">Material</TableHead>
                        <TableHead className="text-xs">Qty</TableHead>
                        <TableHead className="text-xs">Company</TableHead>
                        <TableHead className="text-xs">Vehicle</TableHead>
                        <TableHead className="text-xs">Forwarded To</TableHead>
                        <TableHead className="text-xs">Date</TableHead>
                        <TableHead className="text-xs">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredHistory.map((mat, idx) => (
                        <TableRow
                          key={mat.id}
                          data-ocid={`material_inward.history_item.${idx + 1}`}
                          className="hover:bg-gray-50/60"
                        >
                          <TableCell className="text-xs font-mono text-gray-600 py-3">
                            {mat.passId}
                          </TableCell>
                          <TableCell className="text-sm font-semibold text-gray-900 py-3">
                            {mat.name}
                          </TableCell>
                          <TableCell className="text-xs text-gray-600 py-3">
                            {mat.quantity} {mat.unit}
                          </TableCell>
                          <TableCell className="text-xs text-gray-600 py-3">
                            {mat.company}
                          </TableCell>
                          <TableCell className="text-xs text-gray-500 py-3">
                            {mat.vehicle}
                          </TableCell>
                          <TableCell className="py-3">
                            <Badge
                              variant="outline"
                              className={
                                mat.destination === "Store" || !mat.destination
                                  ? "bg-green-50 text-green-700 border-green-200 text-[10px]"
                                  : "bg-blue-50 text-blue-700 border-blue-200 text-[10px]"
                              }
                            >
                              {mat.destination === "Store"
                                ? "Store Manager"
                                : mat.destination === "Dispatch"
                                  ? "Dispatch Manager"
                                  : mat.destination || "Store Manager"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-gray-500 py-3">
                            {mat.date}
                          </TableCell>
                          <TableCell className="py-3">
                            <Badge
                              variant="outline"
                              className="bg-green-50 text-green-700 border-green-200 text-[10px]"
                            >
                              Cleared
                            </Badge>
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

      {/* Confirm Verify Dialog */}
      <Dialog
        open={!!selectedMaterial}
        onOpenChange={(open) => !open && setSelectedMaterial(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle data-ocid="material_inward.confirm_modal">
              Confirm Material Verification
            </DialogTitle>
          </DialogHeader>
          {selectedMaterial && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="text-gray-400">Material Name</p>
                    <p className="font-semibold text-gray-900">
                      {selectedMaterial.name}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400">Quantity</p>
                    <p className="font-semibold text-gray-900">
                      {selectedMaterial.quantity} {selectedMaterial.unit}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400">Company</p>
                    <p className="font-semibold text-gray-900">
                      {selectedMaterial.company}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400">Vehicle</p>
                    <p className="font-semibold text-gray-900">
                      {selectedMaterial.vehicle}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400">Driver</p>
                    <p className="font-semibold text-gray-900">
                      {selectedMaterial.driverName}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400">Forward To</p>
                    <p className="font-semibold text-orange-700">
                      {getDestination(selectedMaterial.id) === "Store"
                        ? "Store Manager"
                        : "Dispatch Manager"}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {(currentUser?.name || "S").charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-xs text-blue-700 font-semibold">
                    {currentUser?.name || "Security Guard"}
                  </p>
                  <p className="text-[10px] text-blue-500">
                    Security Guard — Digital Signature will be added
                  </p>
                </div>
              </div>
              <p className="text-xs text-gray-500">
                This will generate a Material Inward Gatepass and forward the
                material to{" "}
                <span className="font-semibold">
                  {getDestination(selectedMaterial.id) === "Store"
                    ? "Store Manager"
                    : "Dispatch Manager"}
                </span>
                .
              </p>
            </div>
          )}
          <DialogFooter>
            <Button
              data-ocid="material_inward.confirm_cancel.button"
              variant="outline"
              onClick={() => setSelectedMaterial(null)}
            >
              Cancel
            </Button>
            <Button
              data-ocid="material_inward.confirm_verify.button"
              onClick={() => selectedMaterial && handleVerify(selectedMaterial)}
              className="bg-[#D32F2F] hover:bg-[#B71C1C] text-white"
            >
              <FileCheck size={14} className="mr-2" />
              Verify &amp; Generate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Generated Pass Modal */}
      <Dialog
        open={!!generatedPass}
        onOpenChange={(open) => !open && setGeneratedPass(null)}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle data-ocid="material_inward.pass_modal">
              Material Inward Gatepass Generated
            </DialogTitle>
          </DialogHeader>
          {generatedPass && (
            <div className="space-y-4">
              <div ref={passRef}>
                <div className="border-2 border-[#B71C1C] rounded-xl overflow-hidden">
                  {/* Pass header */}
                  <div className="bg-[#B71C1C] text-white px-5 py-3 text-center">
                    <p className="text-xs font-semibold opacity-80">
                      SWIFT LIFE SCIENCES
                    </p>
                    <p className="text-sm font-bold">
                      MATERIAL INWARD GATEPASS
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
                        {generatedPass.passId}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-gray-400">Barcode</p>
                      <p className="font-mono text-xs font-bold tracking-widest text-gray-700">
                        {generatedPass.barcodeNumber}
                      </p>
                      {/* Barcode visual */}
                      <div className="flex gap-px mt-1 justify-end">
                        {Array.from({ length: 28 }).map((_, i) => (
                          <div
                            // biome-ignore lint/suspicious/noArrayIndexKey: barcode bars
                            key={i}
                            className="bg-gray-900"
                            style={{
                              width: i % 3 === 0 ? 3 : 1.5,
                              height: 24,
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Material details */}
                  <div className="px-5 py-4">
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <p className="text-gray-400 text-[10px] uppercase tracking-wide">
                          Material
                        </p>
                        <p className="font-semibold text-gray-900">
                          {generatedPass.material.name}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-[10px] uppercase tracking-wide">
                          Quantity
                        </p>
                        <p className="font-semibold text-gray-900">
                          {generatedPass.material.quantity}{" "}
                          {generatedPass.material.unit}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-[10px] uppercase tracking-wide">
                          Company / Supplier
                        </p>
                        <p className="font-semibold text-gray-900">
                          {generatedPass.material.company}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-[10px] uppercase tracking-wide">
                          Vehicle No.
                        </p>
                        <p className="font-semibold text-gray-900">
                          {generatedPass.material.vehicle}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-[10px] uppercase tracking-wide">
                          Driver Name
                        </p>
                        <p className="font-semibold text-gray-900">
                          {generatedPass.material.driverName}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-[10px] uppercase tracking-wide">
                          Entry Time
                        </p>
                        <p className="font-semibold text-gray-900">
                          {generatedPass.material.inTime}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Destination */}
                  <div className="px-5 py-3 bg-orange-50 border-t border-orange-100">
                    <p className="text-[10px] text-orange-600 uppercase tracking-wide font-semibold">
                      Forwarded To
                    </p>
                    <p className="text-base font-bold text-orange-800">
                      {generatedPass.destination === "Store"
                        ? "Store Manager"
                        : "Dispatch Manager"}
                    </p>
                  </div>

                  {/* Digital Signature */}
                  <div className="px-5 py-4 border-t border-gray-200 bg-white">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold mb-3">
                      Digital Signature
                    </p>
                    <div className="border border-gray-200 rounded-lg p-3 bg-gray-50 text-center">
                      <p className="text-sm font-bold text-[#B71C1C] italic">
                        {generatedPass.securityName}
                      </p>
                      <p className="text-[10px] text-gray-500 mt-0.5">
                        ID: {generatedPass.securityId}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-1">
                        Security Guard
                      </p>
                      <p className="text-[10px] text-green-600 mt-1 font-medium">
                        ✓ Digitally Verified — {generatedPass.verifiedDate}{" "}
                        {generatedPass.verifiedAt}
                      </p>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="px-5 py-3 bg-gray-50 border-t border-gray-200 flex justify-between text-[10px] text-gray-500">
                    <span>
                      Verified by: {generatedPass.securityName} (
                      {generatedPass.securityId})
                    </span>
                    <span>
                      {generatedPass.verifiedDate} &bull;{" "}
                      {generatedPass.verifiedAt}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  data-ocid="material_inward.pass_close.button"
                  variant="outline"
                  size="sm"
                  onClick={() => setGeneratedPass(null)}
                >
                  Close
                </Button>
                <Button
                  data-ocid="material_inward.pass_print1.button"
                  size="sm"
                  className="bg-[#D32F2F] hover:bg-[#B71C1C] text-white"
                  onClick={() => handlePrint(1)}
                >
                  <Printer size={13} className="mr-2" />
                  Print 1 Copy
                </Button>
                <Button
                  data-ocid="material_inward.pass_print2.button"
                  size="sm"
                  variant="outline"
                  onClick={() => handlePrint(2)}
                >
                  <Printer size={13} className="mr-2" />
                  Print 2 Copies
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
