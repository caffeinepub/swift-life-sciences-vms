import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { CheckCircle, Clock, DoorOpen, Timer, User } from "lucide-react";
import { toast } from "sonner";
import { StatusBadge } from "../components/StatusBadge";
import type { AppView, Visitor } from "../types";

interface SecurityExitProps {
  visitors: Visitor[];
  onUpdateVisitor: (id: string, updates: Partial<Visitor>) => void;
  onNavigate: (view: AppView) => void;
}

function calculateDuration(inTime: string, outTime: string): string {
  try {
    const parseTime = (t: string) => {
      const parts = t.split(" ");
      const period = parts[1];
      const timeParts = parts[0].split(":").map(Number);
      let hours = timeParts[0];
      const minutes = timeParts[1];
      if (period?.toUpperCase() === "PM" && hours !== 12) hours += 12;
      if (period?.toUpperCase() === "AM" && hours === 12) hours = 0;
      return hours * 3600 + minutes * 60;
    };
    const diff = Math.abs(parseTime(outTime) - parseTime(inTime));
    const h = Math.floor(diff / 3600)
      .toString()
      .padStart(2, "0");
    const m = Math.floor((diff % 3600) / 60)
      .toString()
      .padStart(2, "0");
    const s = (diff % 60).toString().padStart(2, "0");
    return `${h}:${m}:${s}`;
  } catch {
    return "N/A";
  }
}

export function SecurityExit({
  visitors,
  onUpdateVisitor,
  onNavigate: _onNavigate,
}: SecurityExitProps) {
  const meetingDoneVisitors = visitors.filter(
    (v) => v.status === "MeetingCompleted",
  );
  const exitedVisitors = visitors.filter((v) => v.status === "Exited");

  const handleAllowExit = (visitor: Visitor) => {
    const now = new Date();
    const outTime = format(now, "hh:mm aa");
    const duration = calculateDuration(visitor.inTime, outTime);
    onUpdateVisitor(visitor.id, {
      status: "Exited",
      outTime,
      duration,
    });
    toast.success(
      `${visitor.name} has been cleared for exit. Duration: ${duration}`,
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Security Exit Panel</h1>
        <p className="text-sm text-gray-500">
          {meetingDoneVisitors.length} visitor(s) waiting for exit clearance
        </p>
      </div>

      {/* Waiting for exit */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 bg-orange-50">
          <h2 className="text-base font-bold text-gray-900">
            \uD83D\uDEA8 Meeting Completed \u2014 Awaiting Exit (
            {meetingDoneVisitors.length})
          </h2>
        </div>
        {meetingDoneVisitors.length === 0 ? (
          <div
            data-ocid="security.exit_pending.empty_state"
            className="flex flex-col items-center justify-center py-12 text-gray-400"
          >
            <DoorOpen size={32} className="mb-2 opacity-30" />
            <p className="text-sm">No visitors waiting for exit clearance</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {meetingDoneVisitors.map((visitor, idx) => (
              <div
                key={visitor.id}
                data-ocid={`security.exit_pending.item.${idx + 1}`}
                className="flex items-center gap-4 px-5 py-4 hover:bg-orange-50/30"
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
                    {visitor.purpose} \u2022 Met: {visitor.personToMeetName}
                  </p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Clock size={11} className="text-gray-400" />
                    <span className="text-[11px] text-gray-400">
                      In: {visitor.inTime} | Meeting ended:{" "}
                      {visitor.meetingEndTime || "N/A"}
                    </span>
                  </div>
                  {visitor.digitalSignature && (
                    <p className="text-[10px] text-green-600 mt-0.5">
                      \u2713 {visitor.digitalSignature}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={visitor.status} />
                  <Button
                    data-ocid={`security.allow_exit.button.${idx + 1}`}
                    size="sm"
                    className="bg-[#D32F2F] hover:bg-[#B71C1C] text-white text-xs"
                    onClick={() => handleAllowExit(visitor)}
                  >
                    <DoorOpen size={12} className="mr-1" />
                    Allow Exit
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Exited visitors history */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-900">
            \u2705 Exit Records ({exitedVisitors.length})
          </h2>
        </div>
        {exitedVisitors.length === 0 ? (
          <div
            data-ocid="security.exited.empty_state"
            className="flex flex-col items-center justify-center py-10 text-gray-400"
          >
            <CheckCircle size={28} className="mb-2 opacity-30" />
            <p className="text-sm">No exits recorded today</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="text-xs">Visitor</TableHead>
                  <TableHead className="text-xs">In Time</TableHead>
                  <TableHead className="text-xs">Out Time</TableHead>
                  <TableHead className="text-xs">
                    <span className="flex items-center gap-1">
                      <Timer size={11} />
                      Duration
                    </span>
                  </TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {exitedVisitors.map((v, idx) => (
                  <TableRow
                    key={v.id}
                    data-ocid={`security.exited.item.${idx + 1}`}
                  >
                    <TableCell className="py-3">
                      <div>
                        <p className="text-xs font-semibold text-gray-900">
                          {v.name}
                        </p>
                        <p className="text-[11px] text-gray-400">
                          {v.personToMeetName}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-gray-600">
                      {v.inTime}
                    </TableCell>
                    <TableCell className="text-xs text-gray-600">
                      {v.outTime || "-"}
                    </TableCell>
                    <TableCell className="text-xs font-mono font-semibold text-gray-900">
                      {v.duration || "-"}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={v.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
