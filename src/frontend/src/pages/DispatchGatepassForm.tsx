import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Minus, Plus, Send, Truck, User } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type {
  AppView,
  CurrentUser,
  DispatchGatepass,
  DispatchItem,
} from "../types";

interface DispatchGatepassFormProps {
  currentUser: CurrentUser;
  onSubmit: (gp: DispatchGatepass) => void;
  onNavigate: (view: AppView) => void;
}

const emptyItem = (): DispatchItem => ({
  id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  itemName: "",
  quantity: "",
  unit: "",
  batchNo: "",
  description: "",
  verified: false,
});

export function DispatchGatepassForm({
  currentUser,
  onSubmit,
  onNavigate,
}: DispatchGatepassFormProps) {
  const [createdByName, setCreatedByName] = useState(currentUser.name);
  const [vehicleNo, setVehicleNo] = useState("");
  const [driverName, setDriverName] = useState("");
  const [destination, setDestination] = useState("");
  const [purpose, setPurpose] = useState("");
  const [items, setItems] = useState<DispatchItem[]>([emptyItem()]);
  const [submitting, setSubmitting] = useState(false);

  const addItem = () => {
    setItems((prev) => [...prev, emptyItem()]);
  };

  const removeItem = (id: string) => {
    if (items.length <= 1) {
      toast.error("At least one item is required");
      return;
    }
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  const updateItem = (id: string, field: keyof DispatchItem, value: string) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, [field]: value } : it)),
    );
  };

  const handleSubmit = async () => {
    if (
      !createdByName.trim() ||
      !vehicleNo.trim() ||
      !driverName.trim() ||
      !destination.trim() ||
      !purpose.trim()
    ) {
      toast.error("Please fill all required fields");
      return;
    }
    for (const item of items) {
      if (
        !item.itemName.trim() ||
        !item.quantity.trim() ||
        !item.unit.trim() ||
        !item.batchNo.trim()
      ) {
        toast.error(
          "Please complete all item rows (Name, Qty, Unit, Batch No are required)",
        );
        return;
      }
    }

    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 500));

    const now = new Date();
    const dateStr = now.toISOString().split("T")[0].replace(/-/g, "");
    const seq = String(Math.floor(Math.random() * 9000) + 1000);
    const passId = `DGP-${now.toISOString().split("T")[0].replace(/-/g, "").slice(0, 8)}-${seq}`;
    const barcodeNumber = `DGP${dateStr}${seq}`;
    const createdTime = now.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const gp: DispatchGatepass = {
      id: passId,
      passId,
      createdBy: createdByName.trim(),
      vehicleNo: vehicleNo.trim(),
      driverName: driverName.trim(),
      destination: destination.trim(),
      purpose: purpose.trim(),
      items,
      status: "Submitted",
      date: now.toISOString().split("T")[0],
      createdTime,
      barcodeNumber,
    };

    onSubmit(gp);
    toast.success(`Dispatch Gatepass ${passId} created successfully!`);
    onNavigate("dispatch-gatepass");
    setSubmitting(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          data-ocid="dispatch_form.back.button"
          onClick={() => onNavigate("dispatch-gatepass")}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex items-center gap-2">
          <Truck size={20} className="text-[#D32F2F]" />
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              Create Dispatch Gatepass
            </h1>
            <p className="text-xs text-gray-500">
              Fill the form to create a new dispatch entry
            </p>
          </div>
        </div>
      </div>

      {/* Created By */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100 flex items-center gap-2">
          <User size={15} className="text-[#D32F2F]" />
          Gatepass Creator
        </h2>
        <div className="max-w-sm">
          <Label className="text-sm font-medium">
            Created By (Name) <span className="text-red-500">*</span>
          </Label>
          <Input
            data-ocid="dispatch_form.created_by.input"
            value={createdByName}
            onChange={(e) => setCreatedByName(e.target.value)}
            placeholder="Enter your name"
            className="mt-1"
          />
          <p className="text-[10px] text-gray-400 mt-1">
            Auto-filled from login. Aap yahan naam change kar sakte hain.
          </p>
        </div>
      </div>

      {/* Vehicle Info */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">
          Vehicle & Transport Details
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-medium">
              Vehicle Number <span className="text-red-500">*</span>
            </Label>
            <Input
              data-ocid="dispatch_form.vehicle.input"
              value={vehicleNo}
              onChange={(e) => setVehicleNo(e.target.value)}
              placeholder="e.g. UK07-CA-5555"
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-sm font-medium">
              Driver Name <span className="text-red-500">*</span>
            </Label>
            <Input
              data-ocid="dispatch_form.driver.input"
              value={driverName}
              onChange={(e) => setDriverName(e.target.value)}
              placeholder="e.g. Kamal Singh"
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-sm font-medium">
              Destination <span className="text-red-500">*</span>
            </Label>
            <Input
              data-ocid="dispatch_form.destination.input"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="e.g. Delhi Warehouse"
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-sm font-medium">
              Purpose <span className="text-red-500">*</span>
            </Label>
            <Textarea
              data-ocid="dispatch_form.purpose.textarea"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="e.g. Export Shipment"
              className="mt-1 resize-none"
              rows={1}
            />
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">
            Items ({items.length})
          </h2>
          <Button
            data-ocid="dispatch_form.add_item.button"
            type="button"
            onClick={addItem}
            variant="outline"
            size="sm"
            className="text-xs border-[#D32F2F] text-[#D32F2F] hover:bg-red-50"
          >
            <Plus size={12} className="mr-1" />
            Add Item
          </Button>
        </div>

        <div className="space-y-3">
          {items.map((item, idx) => (
            <div
              key={item.id}
              data-ocid={`dispatch_form.item.${idx + 1}`}
              className="grid grid-cols-12 gap-2 items-start bg-gray-50 rounded-lg p-3"
            >
              <div className="col-span-1 flex items-center justify-center pt-6">
                <span className="text-xs font-bold text-gray-400">
                  {idx + 1}
                </span>
              </div>
              <div className="col-span-3">
                <Label className="text-[10px] text-gray-500">Item Name *</Label>
                <Input
                  value={item.itemName}
                  onChange={(e) =>
                    updateItem(item.id, "itemName", e.target.value)
                  }
                  placeholder="Item name"
                  className="mt-0.5 h-8 text-xs"
                />
              </div>
              <div className="col-span-1">
                <Label className="text-[10px] text-gray-500">Qty *</Label>
                <Input
                  value={item.quantity}
                  onChange={(e) =>
                    updateItem(item.id, "quantity", e.target.value)
                  }
                  placeholder="0"
                  className="mt-0.5 h-8 text-xs"
                />
              </div>
              <div className="col-span-1">
                <Label className="text-[10px] text-gray-500">Unit *</Label>
                <Input
                  value={item.unit}
                  onChange={(e) => updateItem(item.id, "unit", e.target.value)}
                  placeholder="kg"
                  className="mt-0.5 h-8 text-xs"
                />
              </div>
              <div className="col-span-2">
                <Label className="text-[10px] text-gray-500">Batch No *</Label>
                <Input
                  value={item.batchNo}
                  onChange={(e) =>
                    updateItem(item.id, "batchNo", e.target.value)
                  }
                  placeholder="B2026-001"
                  className="mt-0.5 h-8 text-xs"
                />
              </div>
              <div className="col-span-3">
                <Label className="text-[10px] text-gray-500">Description</Label>
                <Input
                  value={item.description}
                  onChange={(e) =>
                    updateItem(item.id, "description", e.target.value)
                  }
                  placeholder="Optional notes"
                  className="mt-0.5 h-8 text-xs"
                />
              </div>
              <div className="col-span-1 flex items-end justify-center pb-0.5">
                <button
                  type="button"
                  data-ocid={`dispatch_form.remove_item.button.${idx + 1}`}
                  onClick={() => removeItem(item.id)}
                  className="p-1.5 rounded hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors mt-5"
                  title="Remove item"
                >
                  <Minus size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Submit */}
      <div className="flex justify-end gap-3">
        <Button
          data-ocid="dispatch_form.cancel.button"
          variant="outline"
          onClick={() => onNavigate("dispatch-gatepass")}
          disabled={submitting}
        >
          Cancel
        </Button>
        <Button
          data-ocid="dispatch_form.submit.button"
          onClick={handleSubmit}
          disabled={submitting}
          className="bg-[#D32F2F] hover:bg-[#B71C1C] text-white"
        >
          {submitting ? (
            <span className="flex items-center gap-2">
              <svg
                className="animate-spin h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8z"
                />
              </svg>
              Creating...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Send size={14} />
              Submit Gatepass
            </span>
          )}
        </Button>
      </div>
    </div>
  );
}
