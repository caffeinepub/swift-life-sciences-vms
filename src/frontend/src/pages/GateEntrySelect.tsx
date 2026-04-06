import { ClipboardList, Package, Users } from "lucide-react";
import { motion } from "motion/react";
import type { AppView } from "../types";

interface GateEntrySelectProps {
  onNavigate: (view: AppView) => void;
}

export function GateEntrySelect({ onNavigate }: GateEntrySelectProps) {
  const entries = [
    {
      id: "visitor-form" as AppView,
      icon: <Users size={48} />,
      title: "Visitor Entry",
      description:
        "Register individuals visiting the facility for meetings, interviews, or inspections",
      color: "#1565C0",
      bg: "bg-blue-50",
      border: "border-blue-200",
      hover: "hover:border-blue-400 hover:bg-blue-100",
      iconBg: "bg-blue-100 text-blue-700",
      ocid: "gate.visitor.button",
    },
    {
      id: "material-form" as AppView,
      icon: <Package size={48} />,
      title: "Material Entry",
      description:
        "Log incoming or outgoing materials, chemicals, supplies, and equipment",
      color: "#2E7D32",
      bg: "bg-green-50",
      border: "border-green-200",
      hover: "hover:border-green-400 hover:bg-green-100",
      iconBg: "bg-green-100 text-green-700",
      ocid: "gate.material.button",
    },
    {
      id: "other-form" as AppView,
      icon: <ClipboardList size={48} />,
      title: "Other Entry",
      description:
        "Combined entry for contractors, vendors, or mixed visitor-material entries",
      color: "#E65100",
      bg: "bg-orange-50",
      border: "border-orange-200",
      hover: "hover:border-orange-400 hover:bg-orange-100",
      iconBg: "bg-orange-100 text-orange-700",
      ocid: "gate.other.button",
    },
  ];

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-gray-900">Gate Entry</h1>
        <p className="text-gray-500 mt-2">
          Select the type of entry to proceed
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
        {entries.map((entry, idx) => (
          <motion.button
            key={entry.id}
            data-ocid={entry.ocid}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            onClick={() => onNavigate(entry.id)}
            className={`${entry.bg} ${entry.border} ${entry.hover} border-2 rounded-2xl p-8 flex flex-col items-center gap-4 text-center transition-all duration-200 cursor-pointer group shadow-sm hover:shadow-md`}
          >
            <div
              className={`w-24 h-24 rounded-2xl flex items-center justify-center ${entry.iconBg} transition-transform group-hover:scale-110`}
            >
              {entry.icon}
            </div>
            <div>
              <h2 className="text-xl font-bold" style={{ color: entry.color }}>
                {entry.title}
              </h2>
              <p className="text-gray-500 text-sm mt-2 leading-relaxed">
                {entry.description}
              </p>
            </div>
          </motion.button>
        ))}
      </div>

      <p className="text-xs text-gray-400 mt-8">
        Swift Life Sciences — D-1, Sara Industrial Estate, Selaqui, Dehradun •
        Ph: 0135 269 9975
      </p>
    </div>
  );
}
