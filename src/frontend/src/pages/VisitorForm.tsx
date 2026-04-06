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
import { ArrowLeft, Camera, Plus, Trash2, Upload, User } from "lucide-react";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useCamera } from "../camera/useCamera";
import type { AppUser } from "../mockData";
import type { AppView, Visitor } from "../types";

interface VisitorFormProps {
  onSubmit: (visitor: Visitor) => void;
  onNavigate: (view: AppView) => void;
  users: AppUser[];
}

interface FormValues {
  name: string;
  mobile: string;
  address: string;
  idProofNumber: string;
  numberOfVisitors: number;
  purpose: string;
}

export function VisitorForm({ onSubmit, onNavigate, users }: VisitorFormProps) {
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [additionalVisitors, setAdditionalVisitors] = useState<string[]>([]);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [selectedPersonId, setSelectedPersonId] = useState<string>("");
  const [selectedIdProof, setSelectedIdProof] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const camera = useCamera({ facingMode: "user", quality: 0.8 });

  // Build employee list from users with employee role
  const employeeUsers = users.filter((u) => u.role === "employee" && u.active);

  const now = new Date();
  const currentDate = format(now, "yyyy-MM-dd");
  const currentTime = format(now, "hh:mm aa");

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: { numberOfVisitors: 1 },
  });

  const numberOfVisitors = watch("numberOfVisitors");

  const handleCameraStart = async () => {
    setCameraOpen(true);
    await camera.startCamera();
  };

  const handleCapturePhoto = async () => {
    const file = await camera.capturePhoto();
    if (file) {
      // Convert to base64 so photo persists in localStorage
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setCapturedPhoto(base64);
        toast.success("Photo captured successfully");
      };
      reader.readAsDataURL(file);
      await camera.stopCamera();
      setCameraOpen(false);
    }
  };

  const handleCameraClose = async () => {
    await camera.stopCamera();
    setCameraOpen(false);
  };

  const updateAdditionalVisitor = (idx: number, val: string) => {
    setAdditionalVisitors((prev) => {
      const next = [...prev];
      next[idx] = val;
      return next;
    });
  };

  const removeAdditionalVisitor = (idx: number) => {
    setAdditionalVisitors((prev) => prev.filter((_, i) => i !== idx));
  };

  const onFormSubmit = (data: FormValues) => {
    const employee = employeeUsers.find((e) => e.id === selectedPersonId);
    if (!employee) {
      toast.error("Please select a person to meet");
      return;
    }
    if (!selectedIdProof) {
      toast.error("Please select ID proof type");
      return;
    }
    const passId = `VIS-${format(now, "yyyyMMdd")}-${String(
      Math.floor(Math.random() * 9000) + 1000,
    )}`;
    const visitor: Visitor = {
      id: passId,
      passId,
      name: data.name,
      mobile: `+91 ${data.mobile}`,
      address: data.address,
      idProofType: selectedIdProof,
      idProofNumber: data.idProofNumber,
      photo: capturedPhoto || "",
      numberOfVisitors: data.numberOfVisitors,
      additionalVisitors,
      personToMeetId: 0,
      personToMeetName: employee.name,
      department: employee.department || "",
      purpose: data.purpose,
      inTime: currentTime,
      date: currentDate,
      status: "Pending",
    };
    onSubmit(visitor);
    toast.success("Visitor pass created! Awaiting approval.");
    onNavigate("visitor-pass");
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          data-ocid="visitor_form.back.button"
          onClick={() => onNavigate("gate-entry")}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            Visitor Entry Form
          </h1>
          <p className="text-sm text-gray-500">Register a new visitor</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-5">
        {/* Personal Info */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-base font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">
            Personal Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-700">
                Visitor Name *
              </Label>
              <Input
                data-ocid="visitor_form.name.input"
                {...register("name", { required: "Name is required" })}
                placeholder="Full name"
                className="mt-1"
              />
              {errors.name && (
                <p
                  data-ocid="visitor_form.name_error"
                  className="text-red-500 text-xs mt-1"
                >
                  {errors.name.message}
                </p>
              )}
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700">
                Mobile Number *
              </Label>
              <div className="flex mt-1">
                <span className="flex items-center px-3 bg-gray-50 border border-r-0 border-gray-200 rounded-l-lg text-sm text-gray-600">
                  +91
                </span>
                <Input
                  data-ocid="visitor_form.mobile.input"
                  {...register("mobile", { required: "Mobile is required" })}
                  placeholder="9876543210"
                  className="rounded-l-none"
                />
              </div>
              {errors.mobile && (
                <p
                  data-ocid="visitor_form.mobile_error"
                  className="text-red-500 text-xs mt-1"
                >
                  {errors.mobile.message}
                </p>
              )}
            </div>
            <div className="md:col-span-2">
              <Label className="text-sm font-medium text-gray-700">
                Address
              </Label>
              <Textarea
                data-ocid="visitor_form.address.textarea"
                {...register("address")}
                placeholder="Full address"
                rows={2}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700">
                ID Proof Type *
              </Label>
              <Select onValueChange={setSelectedIdProof}>
                <SelectTrigger
                  data-ocid="visitor_form.idproof.select"
                  className="mt-1"
                >
                  <SelectValue placeholder="Select ID proof" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Aadhaar">Aadhaar Card</SelectItem>
                  <SelectItem value="PAN">PAN Card</SelectItem>
                  <SelectItem value="Passport">Passport</SelectItem>
                  <SelectItem value="Driving License">
                    Driving License
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700">
                ID Proof Number *
              </Label>
              <Input
                data-ocid="visitor_form.idnumber.input"
                {...register("idProofNumber", {
                  required: "ID number is required",
                })}
                placeholder="ID proof number"
                className="mt-1"
              />
              {errors.idProofNumber && (
                <p
                  data-ocid="visitor_form.idnumber_error"
                  className="text-red-500 text-xs mt-1"
                >
                  {errors.idProofNumber.message}
                </p>
              )}
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700">
                Upload ID Proof
              </Label>
              <div className="mt-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf"
                  className="hidden"
                />
                <Button
                  data-ocid="visitor_form.idproof.upload_button"
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload size={14} className="mr-2" />
                  Upload File
                </Button>
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700">
                Number of Visitors
              </Label>
              <Input
                data-ocid="visitor_form.count.input"
                type="number"
                min={1}
                max={20}
                {...register("numberOfVisitors", {
                  min: 1,
                  valueAsNumber: true,
                })}
                className="mt-1"
              />
            </div>
          </div>

          {/* Additional visitors */}
          {numberOfVisitors > 1 && (
            <div className="mt-4">
              <Label className="text-sm font-medium text-gray-700">
                Additional Visitor Names
              </Label>
              <div className="mt-2 space-y-2">
                {Array.from({ length: numberOfVisitors - 1 }).map((_, i) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: sequential index
                  <div key={i} className="flex gap-2">
                    <Input
                      data-ocid={`visitor_form.additional_visitor.input.${i + 1}`}
                      value={additionalVisitors[i] || ""}
                      onChange={(e) =>
                        updateAdditionalVisitor(i, e.target.value)
                      }
                      placeholder={`Visitor ${i + 2} name`}
                      className="flex-1"
                    />
                    <button
                      type="button"
                      data-ocid={`visitor_form.remove_visitor.button.${i + 1}`}
                      onClick={() => removeAdditionalVisitor(i)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Visit Details */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-base font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">
            Visit Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-700">
                Person to Meet *
              </Label>
              <Select onValueChange={setSelectedPersonId}>
                <SelectTrigger
                  data-ocid="visitor_form.person_to_meet.select"
                  className="mt-1"
                >
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {employeeUsers.length === 0 ? (
                    <SelectItem value="_none" disabled>
                      No employees found
                    </SelectItem>
                  ) : (
                    employeeUsers.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.name}
                        {emp.department ? ` — ${emp.department}` : ""}
                        {emp.employeeId ? ` (${emp.employeeId})` : ""}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700">
                In Time
              </Label>
              <Input
                value={currentTime}
                readOnly
                className="mt-1 bg-gray-50 text-gray-500"
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700">Date</Label>
              <Input
                value={currentDate}
                readOnly
                className="mt-1 bg-gray-50 text-gray-500"
              />
            </div>
            <div className="md:col-span-2">
              <Label className="text-sm font-medium text-gray-700">
                Purpose of Visit *
              </Label>
              <Textarea
                data-ocid="visitor_form.purpose.textarea"
                {...register("purpose", { required: "Purpose is required" })}
                placeholder="Describe purpose of visit"
                rows={2}
                className="mt-1"
              />
              {errors.purpose && (
                <p
                  data-ocid="visitor_form.purpose_error"
                  className="text-red-500 text-xs mt-1"
                >
                  {errors.purpose.message}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Camera Capture */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-base font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">
            Visitor Photo
          </h2>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              {cameraOpen ? (
                <div className="space-y-3">
                  <div
                    className="relative bg-black rounded-xl overflow-hidden"
                    style={{ maxWidth: 320 }}
                  >
                    <video
                      ref={camera.videoRef}
                      autoPlay
                      muted
                      playsInline
                      className="w-full rounded-xl camera-mirror"
                      style={{ maxHeight: 240 }}
                    />
                    <canvas ref={camera.canvasRef} className="hidden" />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      data-ocid="visitor_form.capture.button"
                      type="button"
                      onClick={handleCapturePhoto}
                      className="bg-[#D32F2F] hover:bg-[#B71C1C] text-white"
                      size="sm"
                    >
                      <Camera size={14} className="mr-1" />
                      Take Photo
                    </Button>
                    <Button
                      data-ocid="visitor_form.camera_close.button"
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleCameraClose}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : capturedPhoto ? (
                <div className="space-y-2">
                  <img
                    src={capturedPhoto}
                    alt="Captured"
                    className="w-32 h-32 rounded-xl object-cover border-2 border-green-300"
                  />
                  <Button
                    data-ocid="visitor_form.retake.button"
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setCapturedPhoto(null);
                      handleCameraStart();
                    }}
                  >
                    Retake Photo
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-start gap-3">
                  <div className="w-32 h-32 rounded-xl bg-gray-100 flex items-center justify-center border-2 border-dashed border-gray-300">
                    <User size={32} className="text-gray-400" />
                  </div>
                  <Button
                    data-ocid="visitor_form.open_camera.button"
                    type="button"
                    variant="outline"
                    onClick={handleCameraStart}
                    className="border-[#D32F2F] text-[#D32F2F] hover:bg-red-50"
                  >
                    <Camera size={14} className="mr-2" />
                    Open Camera
                  </Button>
                  {camera.error && (
                    <p className="text-xs text-red-500">
                      {camera.error.message}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <Button
            data-ocid="visitor_form.cancel.button"
            type="button"
            variant="outline"
            onClick={() => onNavigate("gate-entry")}
          >
            Cancel
          </Button>
          <Button
            data-ocid="visitor_form.submit.button"
            type="submit"
            className="bg-[#D32F2F] hover:bg-[#B71C1C] text-white px-8"
          >
            <Plus size={16} className="mr-2" />
            Register Visitor
          </Button>
        </div>
      </form>
    </div>
  );
}
