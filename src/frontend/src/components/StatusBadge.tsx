import type { MaterialStatus, VisitorStatus } from "../types";

interface StatusBadgeProps {
  status: VisitorStatus | MaterialStatus | string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config: Record<string, { label: string; className: string }> = {
    Pending: {
      label: "Pending",
      className: "bg-yellow-100 text-yellow-800 border border-yellow-200",
    },
    Approved: {
      label: "Approved",
      className: "bg-green-100 text-green-800 border border-green-200",
    },
    Rejected: {
      label: "Rejected",
      className: "bg-red-100 text-red-800 border border-red-200",
    },
    Exited: {
      label: "Exited",
      className: "bg-gray-100 text-gray-700 border border-gray-200",
    },
    MeetingCompleted: {
      label: "Meeting Done",
      className: "bg-blue-100 text-blue-800 border border-blue-200",
    },
    Cleared: {
      label: "Cleared",
      className: "bg-green-100 text-green-800 border border-green-200",
    },
    "Check-In": {
      label: "Check-In",
      className: "bg-green-100 text-green-800 border border-green-200",
    },
    "Check-Out": {
      label: "Check-Out",
      className: "bg-red-100 text-red-800 border border-red-200",
    },
    In: {
      label: "IN",
      className: "bg-green-100 text-green-800 border border-green-200",
    },
    Out: {
      label: "OUT",
      className: "bg-red-100 text-red-800 border border-red-200",
    },
  };

  const cfg = config[status] || {
    label: status,
    className: "bg-gray-100 text-gray-700 border border-gray-200",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
        cfg.className
      }`}
    >
      {cfg.label}
    </span>
  );
}
