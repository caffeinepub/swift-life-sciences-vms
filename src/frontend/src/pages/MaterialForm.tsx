import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { ArrowLeft, Package, Plus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { AppView, Material, MaterialType } from "../types";

interface MaterialFormProps {
  onSubmit: (material: Material) => void;
  onNavigate: (view: AppView) => void;
  currentUserRole?: string;
}

interface FormValues {
  name: string;
  quantity: string;
  company: string;
  vehicle: string;
  driverName: string;
  purpose: string;
}

export function MaterialForm({
  onSubmit,
  onNavigate,
  currentUserRole,
}: MaterialFormProps) {
  const isSecurityRole = currentUserRole === "security";
  const [unit, setUnit] = useState("kg");
  const [entryType, setEntryType] = useState<MaterialType>("In");
  const now = new Date();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>();

  const onFormSubmit = (data: FormValues) => {
    const dateStr = format(now, "yyyyMMdd");
    const rand = String(Math.floor(Math.random() * 90000) + 10000);
    const passId = `MAT-${dateStr}-${rand.slice(0, 4)}`;
    const barcodeNumber = `MBAR${dateStr}${rand}`;

    const material: Material = {
      id: passId,
      passId,
      name: data.name,
      quantity: data.quantity,
      unit,
      company: data.company,
      vehicle: data.vehicle.toUpperCase(),
      driverName: data.driverName,
      purpose: data.purpose,
      type: entryType,
      status: "Pending",
      date: format(now, "yyyy-MM-dd"),
      inTime: format(now, "hh:mm aa"),
      barcodeNumber,
    };
    onSubmit(material);
    toast.success("Material pass created with barcode");
    onNavigate("material-pass");
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <button
          type="button"
          data-ocid="material_form.back.button"
          onClick={() => onNavigate("gate-entry")}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            Material Entry Form
          </h1>
          <p className="text-sm text-gray-500">
            Log incoming/outgoing materials
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-5">
        {/* Entry Type */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-base font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">
            Entry Type
          </h2>
          <div
            className={
              isSecurityRole
                ? "grid grid-cols-1 gap-3"
                : "grid grid-cols-2 gap-3"
            }
          >
            {(["In", "Out"] as MaterialType[])
              .filter((t) => !(isSecurityRole && t === "Out"))
              .map((t) => (
                <button
                  key={t}
                  type="button"
                  data-ocid={`material_form.type.${t.toLowerCase()}.toggle`}
                  onClick={() => setEntryType(t)}
                  className={`py-3 rounded-xl border-2 font-semibold text-sm transition-all ${
                    entryType === t
                      ? t === "In"
                        ? "bg-green-600 text-white border-green-600"
                        : "bg-[#D32F2F] text-white border-[#D32F2F]"
                      : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                  }`}
                >
                  {t === "In" ? "\u2191 Material IN" : "\u2193 Material OUT"}
                </button>
              ))}
          </div>
        </div>

        {/* Material Details */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-base font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">
            Material Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-700">
                Material Name *
              </Label>
              <Input
                data-ocid="material_form.name.input"
                {...register("name", { required: true })}
                placeholder="Material name"
                className="mt-1"
              />
              {errors.name && (
                <p
                  data-ocid="material_form.name_error"
                  className="text-red-500 text-xs mt-1"
                >
                  Required
                </p>
              )}
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700">
                Quantity *
              </Label>
              <div className="flex mt-1 gap-2">
                <Input
                  data-ocid="material_form.quantity.input"
                  {...register("quantity", { required: true })}
                  placeholder="Amount"
                  className="flex-1"
                />
                <Select value={unit} onValueChange={setUnit}>
                  <SelectTrigger
                    data-ocid="material_form.unit.select"
                    className="w-24"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kg">kg</SelectItem>
                    <SelectItem value="pcs">pcs</SelectItem>
                    <SelectItem value="boxes">boxes</SelectItem>
                    <SelectItem value="liters">liters</SelectItem>
                    <SelectItem value="units">units</SelectItem>
                    <SelectItem value="bags">bags</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {errors.quantity && (
                <p
                  data-ocid="material_form.quantity_error"
                  className="text-red-500 text-xs mt-1"
                >
                  Required
                </p>
              )}
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700">
                Company Name *
              </Label>
              <Input
                data-ocid="material_form.company.input"
                {...register("company", { required: true })}
                placeholder="Supplier/Receiver company"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700">
                Vehicle Number
              </Label>
              <Input
                data-ocid="material_form.vehicle.input"
                {...register("vehicle")}
                placeholder="e.g. UK07-CA-1234"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700">
                Driver Name
              </Label>
              <Input
                data-ocid="material_form.driver.input"
                {...register("driverName")}
                placeholder="Driver name"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700">
                In Time
              </Label>
              <Input
                value={format(now, "hh:mm aa")}
                readOnly
                className="mt-1 bg-gray-50 text-gray-500"
              />
            </div>
            <div className="md:col-span-2">
              <Label className="text-sm font-medium text-gray-700">
                Purpose *
              </Label>
              <Textarea
                data-ocid="material_form.purpose.textarea"
                {...register("purpose", { required: true })}
                placeholder="Purpose of entry"
                rows={2}
                className="mt-1"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button
            data-ocid="material_form.cancel.button"
            type="button"
            variant="outline"
            onClick={() => onNavigate("gate-entry")}
          >
            Cancel
          </Button>
          <Button
            data-ocid="material_form.submit.button"
            type="submit"
            className="bg-[#D32F2F] hover:bg-[#B71C1C] text-white px-8"
          >
            <Plus size={16} className="mr-2" />
            Register Material
          </Button>
        </div>
      </form>
    </div>
  );
}
