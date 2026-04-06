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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { CheckCircle2, Clock, Download, Search, Warehouse } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { CurrentUser, StoreInwardItem } from "../types";

interface StoreManagerInwardProps {
  storeItems: StoreInwardItem[];
  currentUser: CurrentUser;
  onUpdateStoreItem: (id: string, updates: Partial<StoreInwardItem>) => void;
}

export function StoreManagerInward({
  storeItems,
  currentUser,
  onUpdateStoreItem,
}: StoreManagerInwardProps) {
  const [tab, setTab] = useState<"all" | "pending" | "acknowledged">("all");
  const [ackItem, setAckItem] = useState<StoreInwardItem | null>(null);
  const [notes, setNotes] = useState("");
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [justUpdated, setJustUpdated] = useState(false);
  const prevCountRef = useRef(storeItems.length);

  useEffect(() => {
    if (storeItems.length !== prevCountRef.current) {
      prevCountRef.current = storeItems.length;
      setJustUpdated(true);
      const t = setTimeout(() => setJustUpdated(false), 2500);
      return () => clearTimeout(t);
    }
  }, [storeItems.length]);

  const pending = storeItems.filter((s) => !s.acknowledged);
  const acknowledged = storeItems.filter((s) => s.acknowledged);

  const applyFilters = (items: StoreInwardItem[]) => {
    return items.filter((s) => {
      const q = search.toLowerCase();
      const matchSearch =
        s.materialName.toLowerCase().includes(q) ||
        s.company.toLowerCase().includes(q) ||
        (s.gatepassId ?? "").toLowerCase().includes(q);
      const matchDate = dateFilter ? s.receivedDate === dateFilter : true;
      return matchSearch && matchDate;
    });
  };

  const baseDisplayed =
    tab === "all" ? storeItems : tab === "pending" ? pending : acknowledged;
  const displayed = applyFilters(baseDisplayed);

  const handleAcknowledge = () => {
    if (!ackItem) return;
    onUpdateStoreItem(ackItem.id, {
      acknowledged: true,
      acknowledgedBy: currentUser.name,
      notes: notes.trim() || undefined,
    });
    toast.success(`Receipt acknowledged for ${ackItem.materialName}`);
    setAckItem(null);
    setNotes("");
  };

  const exportCSV = () => {
    const headers = [
      "ID",
      "Gatepass ID",
      "Material",
      "Qty",
      "Unit",
      "Company",
      "Received Date",
      "Received Time",
      "Status",
      "Acknowledged By",
      "Notes",
    ];
    const rows = storeItems.map((s) => [
      s.id,
      s.gatepassId || "",
      s.materialName,
      s.quantity,
      s.unit,
      s.company,
      s.receivedDate,
      s.receivedTime,
      s.acknowledged ? "Acknowledged" : "Pending",
      s.acknowledgedBy || "",
      s.notes || "",
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((c) => `"${c}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `store-inward-${format(new Date(), "yyyyMMdd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Warehouse size={20} className="text-[#D32F2F]" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900">Inward Items</h1>
              {justUpdated && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700 animate-pulse">
                  ● New Item!
                </span>
              )}
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200">
                ● Live
              </span>
            </div>
            <p className="text-xs text-gray-500">
              {storeItems.length} total &bull;{" "}
              <span className="text-yellow-600 font-medium">
                {pending.length} pending
              </span>{" "}
              &bull;{" "}
              <span className="text-green-600 font-medium">
                {acknowledged.length} acknowledged
              </span>
            </p>
          </div>
        </div>
        <Button
          data-ocid="store_inward.export.button"
          onClick={exportCSV}
          variant="outline"
          size="sm"
          className="border-green-600 text-green-600 hover:bg-green-50"
        >
          <Download size={14} className="mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Search + Date filter */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <Input
            data-ocid="store_inward.search.input"
            placeholder="Search by material name, company, gatepass ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-white"
          />
        </div>
        <Input
          data-ocid="store_inward.date_filter.input"
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="w-40 bg-white"
        />
        {(search || dateFilter) && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearch("");
              setDateFilter("");
            }}
          >
            Clear
          </Button>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <TabsList className="bg-gray-100">
          <TabsTrigger data-ocid="store_inward.all.tab" value="all">
            All ({storeItems.length})
          </TabsTrigger>
          <TabsTrigger data-ocid="store_inward.pending.tab" value="pending">
            Pending ({pending.length})
          </TabsTrigger>
          <TabsTrigger
            data-ocid="store_inward.acknowledged.tab"
            value="acknowledged"
          >
            Acknowledged ({acknowledged.length})
          </TabsTrigger>
        </TabsList>

        {(["all", "pending", "acknowledged"] as const).map((t) => (
          <TabsContent key={t} value={t}>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              {displayed.length === 0 ? (
                <div
                  data-ocid="store_inward.empty_state"
                  className="flex flex-col items-center justify-center py-12 text-gray-400"
                >
                  <Warehouse size={28} className="mb-2 opacity-30" />
                  <p className="text-sm">No items found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="text-xs">Gatepass ID</TableHead>
                        <TableHead className="text-xs">Material Name</TableHead>
                        <TableHead className="text-xs">Qty</TableHead>
                        <TableHead className="text-xs">Company</TableHead>
                        <TableHead className="text-xs">Received Date</TableHead>
                        <TableHead className="text-xs">Time</TableHead>
                        <TableHead className="text-xs">Status</TableHead>
                        <TableHead className="text-xs">
                          Acknowledged By
                        </TableHead>
                        <TableHead className="text-xs text-center">
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {displayed.map((item, idx) => (
                        <TableRow
                          key={item.id}
                          data-ocid={`store_inward.item.${idx + 1}`}
                          className="hover:bg-gray-50/60"
                        >
                          <TableCell className="text-xs font-mono text-gray-500 py-3">
                            {item.gatepassId || "—"}
                          </TableCell>
                          <TableCell className="text-sm font-semibold text-gray-900 py-3">
                            {item.materialName}
                          </TableCell>
                          <TableCell className="text-xs text-gray-600 py-3">
                            {item.quantity} {item.unit}
                          </TableCell>
                          <TableCell className="text-xs text-gray-600 py-3">
                            {item.company}
                          </TableCell>
                          <TableCell className="text-xs text-gray-500 py-3">
                            {item.receivedDate}
                          </TableCell>
                          <TableCell className="text-xs text-gray-500 py-3">
                            {item.receivedTime}
                          </TableCell>
                          <TableCell className="py-3">
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                                item.acknowledged
                                  ? "bg-green-50 text-green-700 border-green-200"
                                  : "bg-yellow-50 text-yellow-700 border-yellow-200"
                              }`}
                            >
                              {item.acknowledged ? "Acknowledged" : "Pending"}
                            </span>
                          </TableCell>
                          <TableCell className="text-xs text-gray-500 py-3">
                            {item.acknowledgedBy || "—"}
                          </TableCell>
                          <TableCell className="py-3 text-center">
                            {!item.acknowledged ? (
                              <button
                                type="button"
                                data-ocid={`store_inward.acknowledge.button.${idx + 1}`}
                                onClick={() => {
                                  setAckItem(item);
                                  setNotes("");
                                }}
                                className="text-[11px] font-medium text-white bg-[#D32F2F] hover:bg-[#B71C1C] px-3 py-1 rounded-lg transition-colors"
                              >
                                Acknowledge
                              </button>
                            ) : (
                              <span className="flex items-center justify-center gap-1 text-green-600">
                                <CheckCircle2 size={14} />
                                <span className="text-[10px]">Done</span>
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Acknowledge Modal */}
      <Dialog
        open={!!ackItem}
        onOpenChange={(open) => !open && setAckItem(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle data-ocid="store_inward.ack_modal">
              Acknowledge Receipt
            </DialogTitle>
          </DialogHeader>
          {ackItem && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-gray-400">Material</p>
                    <p className="font-semibold text-gray-900">
                      {ackItem.materialName}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400">Quantity</p>
                    <p className="font-semibold text-gray-900">
                      {ackItem.quantity} {ackItem.unit}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400">Company</p>
                    <p className="font-semibold text-gray-900">
                      {ackItem.company}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400">Received</p>
                    <p className="font-semibold text-gray-900">
                      {ackItem.receivedDate} {ackItem.receivedTime}
                    </p>
                  </div>
                  {ackItem.gatepassId && (
                    <div className="col-span-2">
                      <p className="text-gray-400">Gatepass ID</p>
                      <p className="font-mono font-semibold text-gray-900">
                        {ackItem.gatepassId}
                      </p>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">Notes (optional)</Label>
                <Textarea
                  data-ocid="store_inward.notes.textarea"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Stored in Rack B-12, all units inspected..."
                  className="mt-1 resize-none"
                  rows={3}
                />
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Clock size={12} />
                Will be acknowledged by:{" "}
                <span className="font-semibold text-gray-700">
                  {currentUser.name}
                </span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              data-ocid="store_inward.ack_cancel.button"
              variant="outline"
              onClick={() => setAckItem(null)}
            >
              Cancel
            </Button>
            <Button
              data-ocid="store_inward.ack_confirm.button"
              onClick={handleAcknowledge}
              className="bg-[#D32F2F] hover:bg-[#B71C1C] text-white"
            >
              <CheckCircle2 size={14} className="mr-2" />
              Acknowledge Receipt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
