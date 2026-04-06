import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertCircle,
  ArrowRight,
  Bell,
  CheckCheck,
  CheckCircle,
  Coffee,
  LogOut,
  Package,
  Trash2,
  User,
  X,
} from "lucide-react";
import type { Notification, NotificationType } from "../types";

interface NotificationPanelProps {
  notifications: Notification[];
  onMarkAllRead: () => void;
  onClearAll: () => void;
  onClose: () => void;
}

const typeConfig: Record<
  NotificationType,
  { icon: React.ReactNode; bg: string; text: string }
> = {
  visitor: {
    icon: <User size={14} />,
    bg: "bg-yellow-100",
    text: "text-yellow-700",
  },
  approved: {
    icon: <CheckCircle size={14} />,
    bg: "bg-green-100",
    text: "text-green-700",
  },
  meeting: {
    icon: <Coffee size={14} />,
    bg: "bg-blue-100",
    text: "text-blue-700",
  },
  exit: {
    icon: <LogOut size={14} />,
    bg: "bg-orange-100",
    text: "text-orange-700",
  },
  rejected: {
    icon: <AlertCircle size={14} />,
    bg: "bg-red-100",
    text: "text-red-700",
  },
  material: {
    icon: <Package size={14} />,
    bg: "bg-purple-100",
    text: "text-purple-700",
  },
  transfer: {
    icon: <ArrowRight size={14} />,
    bg: "bg-blue-100",
    text: "text-blue-700",
  },
};

export function NotificationPanel({
  notifications,
  onMarkAllRead,
  onClearAll,
  onClose,
}: NotificationPanelProps) {
  return (
    <div
      data-ocid="notifications.panel"
      className="w-80 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Bell size={16} className="text-[#D32F2F]" />
          <span className="font-semibold text-gray-900 text-sm">
            Notifications
          </span>
          {notifications.filter((n) => !n.read).length > 0 && (
            <span className="bg-[#D32F2F] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {notifications.filter((n) => !n.read).length}
            </span>
          )}
        </div>
        <button
          type="button"
          data-ocid="notifications.close.button"
          onClick={onClose}
          className="p-1 rounded hover:bg-gray-100 text-gray-500"
        >
          <X size={14} />
        </button>
      </div>

      {/* Notifications list */}
      <ScrollArea className="h-72">
        {notifications.length === 0 ? (
          <div
            data-ocid="notifications.empty_state"
            className="flex flex-col items-center justify-center h-32 text-gray-400"
          >
            <Bell size={24} className="mb-2 opacity-40" />
            <p className="text-sm">No notifications</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-50">
            {notifications.map((notif, idx) => {
              const cfg = typeConfig[notif.type];
              return (
                <li
                  key={notif.id}
                  data-ocid={`notifications.item.${idx + 1}`}
                  className={`flex gap-3 px-4 py-3 transition-colors ${
                    !notif.read ? "bg-red-50/30" : ""
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      cfg.bg
                    } ${cfg.text}`}
                  >
                    {cfg.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-gray-900">
                      {notif.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                      {notif.message}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-1">
                      {notif.time}
                    </p>
                  </div>
                  {!notif.read && (
                    <div className="w-2 h-2 rounded-full bg-[#D32F2F] flex-shrink-0 mt-1.5" />
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </ScrollArea>

      {/* Footer actions */}
      <div className="flex gap-2 p-3 border-t border-gray-100 bg-gray-50/50">
        <Button
          data-ocid="notifications.mark_read.button"
          variant="outline"
          size="sm"
          className="flex-1 text-xs h-7"
          onClick={onMarkAllRead}
        >
          <CheckCheck size={12} className="mr-1" />
          Mark all read
        </Button>
        <Button
          data-ocid="notifications.clear.button"
          variant="outline"
          size="sm"
          className="flex-1 text-xs h-7 text-red-600 border-red-200 hover:bg-red-50"
          onClick={onClearAll}
        >
          <Trash2 size={12} className="mr-1" />
          Clear all
        </Button>
      </div>
    </div>
  );
}
