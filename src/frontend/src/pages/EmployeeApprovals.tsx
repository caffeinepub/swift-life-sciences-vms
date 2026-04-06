import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  Eye,
  Stamp,
  User,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { StatusBadge } from "../components/StatusBadge";
import type { AppView, CurrentUser, Visitor } from "../types";

interface EmployeeApprovalsProps {
  visitors: Visitor[];
  currentUser: CurrentUser;
  onUpdateVisitor: (id: string, updates: Partial<Visitor>) => void;
  onNavigate: (view: AppView) => void;
  onViewPass: (visitor: Visitor) => void;
}

export function EmployeeApprovals({
  visitors,
  currentUser,
  onUpdateVisitor,
  onNavigate,
  onViewPass,
}: EmployeeApprovalsProps) {
  const [selectedVisitor, setSelectedVisitor] = useState<Visitor | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Filter visitors for this employee only
  const myVisitors = visitors.filter(
    (v) => v.personToMeetName === currentUser.name,
  );
  const pendingVisitors = myVisitors.filter((v) => v.status === "Pending");
  const approvedVisitors = myVisitors.filter(
    (v) => v.status === "Approved" || v.status === "MeetingCompleted",
  );

  const handleApprove = (visitor: Visitor) => {
    onUpdateVisitor(visitor.id, { status: "Approved" });
    toast.success(`${visitor.name}'s visit has been approved`);
    setDialogOpen(false);
    setSelectedVisitor(null);
  };

  const handleReject = (visitor: Visitor) => {
    if (!rejectReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }
    onUpdateVisitor(visitor.id, {
      status: "Rejected",
      rejectionReason: rejectReason,
    });
    toast.error(`${visitor.name}'s visit has been rejected`);
    setRejectReason("");
    setShowRejectInput(false);
    setDialogOpen(false);
    setSelectedVisitor(null);
  };

  const handleMeetingCompleted = (visitor: Visitor) => {
    const now = new Date();
    const endTime = format(now, "hh:mm aa");
    const signature = `${visitor.personToMeetName} | ${format(now, "dd/MM/yyyy HH:mm:ss")}`;
    onUpdateVisitor(visitor.id, {
      status: "MeetingCompleted",
      meetingEndTime: endTime,
      digitalSignature: signature,
    });
    toast.success("Meeting marked as completed. Digital signature applied.");
  };

  const openDialog = (visitor: Visitor) => {
    setSelectedVisitor(visitor);
    setShowRejectInput(false);
    setRejectReason("");
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Visitor Approvals</h1>
          <p className="text-sm text-gray-500">
            {pendingVisitors.length} pending approval(s)
          </p>
        </div>
      </div>

      {/* Pending Approvals */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 bg-yellow-50">
          <h2 className="text-base font-bold text-gray-900">
            ⏳ Pending Approvals ({pendingVisitors.length})
          </h2>
        </div>
        {pendingVisitors.length === 0 ? (
          <div
            data-ocid="approvals.pending.empty_state"
            className="flex flex-col items-center justify-center py-12 text-gray-400"
          >
            <CheckCircle size={32} className="mb-2 opacity-30" />
            <p className="text-sm">No pending approvals</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {pendingVisitors.map((visitor, idx) => (
              <div
                key={visitor.id}
                data-ocid={`approvals.pending.item.${idx + 1}`}
                className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50/60"
              >
                <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                  {visitor.photo ? (
                    <img
                      src={visitor.photo}
                      alt=""
                      className="w-10 h-10 rounded-xl object-cover"
                    />
                  ) : (
                    <User size={18} className="text-gray-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">
                    {visitor.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {visitor.purpose} • Meet: {visitor.personToMeetName}
                  </p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Clock size={11} className="text-gray-400" />
                    <span className="text-[11px] text-gray-400">
                      {visitor.inTime} • {visitor.date}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={visitor.status} />
                  <Button
                    data-ocid={`approvals.view.button.${idx + 1}`}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => openDialog(visitor)}
                  >
                    <Eye size={12} className="mr-1" />
                    Review
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Approved Visitors */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 bg-green-50">
          <h2 className="text-base font-bold text-gray-900">
            ✅ Approved Visitors ({approvedVisitors.length})
          </h2>
        </div>
        {approvedVisitors.length === 0 ? (
          <div
            data-ocid="approvals.approved.empty_state"
            className="flex flex-col items-center justify-center py-12 text-gray-400"
          >
            <p className="text-sm">No approved visitors</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {approvedVisitors.map((visitor, idx) => (
              <div
                key={visitor.id}
                data-ocid={`approvals.approved.item.${idx + 1}`}
                className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50/60"
              >
                <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                  {visitor.photo ? (
                    <img
                      src={visitor.photo}
                      alt=""
                      className="w-10 h-10 rounded-xl object-cover"
                    />
                  ) : (
                    <User size={18} className="text-gray-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">
                    {visitor.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {visitor.purpose} • {visitor.personToMeetName}
                  </p>
                  {visitor.digitalSignature && (
                    <p className="text-[10px] text-green-600 mt-0.5">
                      ✓ Digitally Signed
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={visitor.status} />
                  {visitor.status === "Approved" && (
                    <Button
                      data-ocid={`approvals.meeting_done.button.${idx + 1}`}
                      size="sm"
                      className="text-xs bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={() => handleMeetingCompleted(visitor)}
                    >
                      <Stamp size={12} className="mr-1" />
                      Meeting Done
                    </Button>
                  )}
                  <Button
                    data-ocid={`approvals.view_pass.button.${idx + 1}`}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => {
                      onViewPass(visitor);
                      onNavigate("visitor-pass");
                    }}
                  >
                    View Pass
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Approval Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent data-ocid="approvals.dialog" className="max-w-md">
          <DialogHeader>
            <DialogTitle>Visitor Details</DialogTitle>
          </DialogHeader>
          {selectedVisitor && (
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="w-20 h-20 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0 border border-gray-200">
                  {selectedVisitor.photo ? (
                    <img
                      src={selectedVisitor.photo}
                      alt=""
                      className="w-20 h-20 rounded-xl object-cover"
                    />
                  ) : (
                    <User size={28} className="text-gray-400" />
                  )}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">
                    {selectedVisitor.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {selectedVisitor.mobile}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {selectedVisitor.address}
                  </p>
                </div>
              </div>

              <div className="border border-gray-100 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <tbody>
                    {(
                      [
                        ["Purpose", selectedVisitor.purpose],
                        ["Person to Meet", selectedVisitor.personToMeetName],
                        [
                          "ID Proof",
                          `${selectedVisitor.idProofType} — ${selectedVisitor.idProofNumber}`,
                        ],
                        [
                          "No. of Visitors",
                          String(selectedVisitor.numberOfVisitors),
                        ],
                        [
                          "In Time",
                          `${selectedVisitor.inTime} | ${selectedVisitor.date}`,
                        ],
                      ] as [string, string][]
                    ).map(([label, value]) => (
                      <tr
                        key={label}
                        className="border-b border-gray-50 last:border-0"
                      >
                        <td className="px-3 py-2 text-xs font-medium text-gray-500 bg-gray-50 w-32">
                          {label}
                        </td>
                        <td className="px-3 py-2 text-xs text-gray-900">
                          {value}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {showRejectInput && (
                <div>
                  <Textarea
                    data-ocid="approvals.reject_reason.textarea"
                    placeholder="Enter rejection reason..."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    rows={2}
                    className="text-sm"
                  />
                </div>
              )}

              <div className="flex gap-3">
                {!showRejectInput ? (
                  <>
                    <Button
                      data-ocid="approvals.approve.confirm_button"
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => handleApprove(selectedVisitor)}
                    >
                      <CheckCircle size={16} className="mr-2" />
                      Approve
                    </Button>
                    <Button
                      data-ocid="approvals.reject.button"
                      variant="outline"
                      className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                      onClick={() => setShowRejectInput(true)}
                    >
                      <XCircle size={16} className="mr-2" />
                      Reject
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      data-ocid="approvals.reject.confirm_button"
                      className="flex-1 bg-[#D32F2F] hover:bg-[#B71C1C] text-white"
                      onClick={() => handleReject(selectedVisitor)}
                    >
                      Confirm Reject
                    </Button>
                    <Button
                      data-ocid="approvals.reject.cancel_button"
                      variant="outline"
                      className="flex-1"
                      onClick={() => setShowRejectInput(false)}
                    >
                      Cancel
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
