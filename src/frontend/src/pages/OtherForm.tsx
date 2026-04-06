import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { ArrowLeft, Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { AppView, OtherEntry } from "../types";

interface OtherFormProps {
  onSubmit: (entry: OtherEntry) => void;
  onNavigate: (view: AppView) => void;
}

interface FormValues {
  visitorName: string;
  mobile: string;
  materialName: string;
  quantity: string;
  vehicle: string;
  purpose: string;
  notes: string;
}

export function OtherForm({ onSubmit, onNavigate }: OtherFormProps) {
  const now = new Date();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>();

  const onFormSubmit = (data: FormValues) => {
    const entry: OtherEntry = {
      id: `OTH-${format(now, "yyyyMMdd")}-${String(Math.floor(Math.random() * 9000) + 1000)}`,
      visitorName: data.visitorName,
      mobile: data.mobile,
      materialName: data.materialName,
      quantity: data.quantity,
      vehicle: data.vehicle,
      purpose: data.purpose,
      notes: data.notes,
      date: format(now, "yyyy-MM-dd"),
      inTime: format(now, "hh:mm aa"),
      status: "Registered",
    };
    onSubmit(entry);
    toast.success("Other entry registered successfully");
    onNavigate("gate-entry");
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <button
          type="button"
          data-ocid="other_form.back.button"
          onClick={() => onNavigate("gate-entry")}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Other Entry Form</h1>
          <p className="text-sm text-gray-500">
            Combined visitor + material entry
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-5">
        {/* Visitor Info */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-base font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">
            Visitor Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-700">
                Visitor Name *
              </Label>
              <Input
                data-ocid="other_form.name.input"
                {...register("visitorName", { required: true })}
                placeholder="Full name"
                className="mt-1"
              />
              {errors.visitorName && (
                <p
                  data-ocid="other_form.name_error"
                  className="text-red-500 text-xs mt-1"
                >
                  Required
                </p>
              )}
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700">
                Mobile Number
              </Label>
              <Input
                data-ocid="other_form.mobile.input"
                {...register("mobile")}
                placeholder="+91 9876543210"
                className="mt-1"
              />
            </div>
          </div>
        </div>

        {/* Material Info */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-base font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">
            Material Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-700">
                Material Name
              </Label>
              <Input
                data-ocid="other_form.material.input"
                {...register("materialName")}
                placeholder="Material description"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700">
                Quantity
              </Label>
              <Input
                data-ocid="other_form.quantity.input"
                {...register("quantity")}
                placeholder="Quantity + unit"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700">
                Vehicle Number
              </Label>
              <Input
                data-ocid="other_form.vehicle.input"
                {...register("vehicle")}
                placeholder="Vehicle number"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700">
                Date / Time
              </Label>
              <Input
                value={`${format(now, "yyyy-MM-dd")} ${format(now, "hh:mm aa")}`}
                readOnly
                className="mt-1 bg-gray-50 text-gray-500"
              />
            </div>
          </div>
        </div>

        {/* Purpose & Notes */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-base font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">
            Additional Details
          </h2>
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-gray-700">
                Purpose *
              </Label>
              <Textarea
                data-ocid="other_form.purpose.textarea"
                {...register("purpose", { required: true })}
                placeholder="Purpose of entry"
                rows={2}
                className="mt-1"
              />
              {errors.purpose && (
                <p
                  data-ocid="other_form.purpose_error"
                  className="text-red-500 text-xs mt-1"
                >
                  Required
                </p>
              )}
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700">Notes</Label>
              <Textarea
                data-ocid="other_form.notes.textarea"
                {...register("notes")}
                placeholder="Additional notes or remarks"
                rows={2}
                className="mt-1"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button
            data-ocid="other_form.cancel.button"
            type="button"
            variant="outline"
            onClick={() => onNavigate("gate-entry")}
          >
            Cancel
          </Button>
          <Button
            data-ocid="other_form.submit.button"
            type="submit"
            className="bg-[#D32F2F] hover:bg-[#B71C1C] text-white px-8"
          >
            <Plus size={16} className="mr-2" />
            Register Entry
          </Button>
        </div>
      </form>
    </div>
  );
}
