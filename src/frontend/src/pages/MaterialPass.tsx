import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer } from "lucide-react";
import { StatusBadge } from "../components/StatusBadge";
import type { AppView, Material } from "../types";

interface MaterialPassProps {
  material: Material | null;
  onNavigate: (view: AppView) => void;
}

export function BarcodeDisplay({ code }: { code: string }) {
  const pattern = code
    .split("")
    .map((c) => c.charCodeAt(0))
    .join("");

  const bars: { width: number; isBlack: boolean; idx: number }[] = [];
  for (let i = 0; i < 60; i++) {
    const charCode = pattern.charCodeAt(i % pattern.length);
    const width = 1 + (charCode % 3);
    const isBlack = charCode % 2 === 0;
    bars.push({ width, isBlack, idx: i });
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex items-end gap-[1px] h-10 bg-white px-2 py-0.5 border border-gray-200 rounded">
        {bars.map((bar) => (
          <div
            key={bar.idx}
            style={{
              width: `${bar.width * 2}px`,
              height: "100%",
              display: "inline-block",
              backgroundColor: bar.isBlack ? "#111" : "transparent",
            }}
          />
        ))}
      </div>
      <p className="text-[9px] font-mono text-gray-600 tracking-widest">
        {code}
      </p>
    </div>
  );
}

export function MaterialPass({ material, onNavigate }: MaterialPassProps) {
  if (!material) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-gray-500">No material pass selected.</p>
        <Button
          data-ocid="material_pass.back.button"
          variant="outline"
          onClick={() => onNavigate("material-form")}
        >
          <ArrowLeft size={16} className="mr-2" />
          Back
        </Button>
      </div>
    );
  }

  const handlePrint = () => window.print();

  const handlePrint2PerPage = () => {
    const win = window.open("", "_blank", "width=900,height=700");
    if (!win) return;

    const passHTML = (label: string) => `
      <div style="width:148mm;border:1px solid #ccc;font-family:Arial,sans-serif;font-size:9pt;overflow:hidden;box-sizing:border-box;">
        <div style="background:linear-gradient(135deg,#1B5E20,#2E7D32);padding:10px 14px;display:flex;align-items:center;gap:10px;">
          <img src="/assets/logo-019d6222-36be-748a-bc3b-3755cb68bffb.jpg" style="width:36px;height:36px;object-fit:contain;border-radius:6px;background:rgba(255,255,255,0.15);" />
          <div style="flex:1;">
            <div style="color:#fff;font-size:10pt;font-weight:bold;line-height:1.2;">SWIFT LIFE SCIENCES PVT. LTD.</div>
            <div style="color:#c8e6c9;font-size:7pt;margin-top:2px;">D-1, Sara Industrial Estate, Selaqui, Dehradun</div>
          </div>
          <div style="text-align:right;background:rgba(255,255,255,0.2);border-radius:5px;padding:5px 8px;">
            <div style="color:#fff;font-size:7pt;font-weight:bold;text-transform:uppercase;">MATERIAL PASS</div>
            <div style="color:#c8e6c9;font-size:6pt;margin-top:1px;">${material.passId}</div>
          </div>
        </div>
        <div style="padding:2px 14px;background:${material.type === "In" ? "#f1f8e9" : "#fff3f3"};font-size:8pt;font-weight:bold;color:${material.type === "In" ? "#2E7D32" : "#c62828"};">
          ${material.type === "In" ? "↑ INWARD MATERIAL" : "↓ OUTWARD MATERIAL"} &nbsp;&mdash;&nbsp; ${material.status}
        </div>
        <div style="padding:10px 14px;">
          <table style="width:100%;border-collapse:collapse;font-size:8pt;">
            <tbody>
              <tr><td style="padding:3px 6px;background:#f5f5f5;font-weight:600;color:#666;width:110px;border:1px solid #eee;">Material</td><td style="padding:3px 6px;border:1px solid #eee;">${material.name}</td></tr>
              <tr><td style="padding:3px 6px;background:#f5f5f5;font-weight:600;color:#666;border:1px solid #eee;">Quantity</td><td style="padding:3px 6px;border:1px solid #eee;">${material.quantity} ${material.unit}</td></tr>
              <tr><td style="padding:3px 6px;background:#f5f5f5;font-weight:600;color:#666;border:1px solid #eee;">Company</td><td style="padding:3px 6px;border:1px solid #eee;">${material.company}</td></tr>
              <tr><td style="padding:3px 6px;background:#f5f5f5;font-weight:600;color:#666;border:1px solid #eee;">Vehicle</td><td style="padding:3px 6px;border:1px solid #eee;">${material.vehicle}</td></tr>
              <tr><td style="padding:3px 6px;background:#f5f5f5;font-weight:600;color:#666;border:1px solid #eee;">Driver</td><td style="padding:3px 6px;border:1px solid #eee;">${material.driverName}</td></tr>
              <tr><td style="padding:3px 6px;background:#f5f5f5;font-weight:600;color:#666;border:1px solid #eee;">Purpose</td><td style="padding:3px 6px;border:1px solid #eee;">${material.purpose}</td></tr>
              <tr><td style="padding:3px 6px;background:#f5f5f5;font-weight:600;color:#666;border:1px solid #eee;">Date/Time</td><td style="padding:3px 6px;border:1px solid #eee;">${material.date} ${material.inTime}</td></tr>
            </tbody>
          </table>
          <div style="text-align:center;margin-top:10px;">
            <div style="font-size:7pt;color:#999;margin-bottom:4px;">BARCODE</div>
            <div style="font-family:monospace;font-size:12px;letter-spacing:2px;font-weight:bold;border:1px solid #ddd;display:inline-block;padding:4px 10px;">${material.barcodeNumber}</div>
          </div>
        </div>
        <div style="padding:5px 14px;background:#f9f9f9;border-top:1px solid #eee;display:flex;justify-content:space-between;font-size:7pt;color:#999;">
          <span>This pass must be surrendered at exit. Subject to verification.</span>
          <span>Ph: 0135 269 9975</span>
        </div>
        <div style="text-align:center;font-size:6pt;color:#bbb;padding:2px 0;">${label}</div>
      </div>
    `;

    win.document.write(`
      <html>
        <head>
          <title>Material Pass — ${material.passId}</title>
          <style>
            @page { size: A4 landscape; margin: 10mm; }
            body { margin: 0; padding: 0; font-family: Arial, sans-serif; }
            .wrapper { display: flex; gap: 8mm; align-items: flex-start; }
          </style>
        </head>
        <body>
          <div class="wrapper">
            ${passHTML("Copy 1")}
            ${passHTML("Copy 2")}
          </div>
        </body>
      </html>
    `);
    win.document.close();
    win.print();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Action bar */}
      <div className="flex items-center justify-between no-print">
        <div className="flex items-center gap-3">
          <button
            type="button"
            data-ocid="material_pass.back.button"
            onClick={() => onNavigate("gate-entry")}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Material Pass</h1>
            <p className="text-sm text-gray-500">{material.passId}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            data-ocid="material_pass.print.button"
            variant="outline"
            size="sm"
            onClick={handlePrint}
          >
            <Printer size={14} className="mr-2" />
            Print
          </Button>
          <Button
            data-ocid="material_pass.print2.button"
            size="sm"
            className="bg-[#D32F2F] hover:bg-[#B71C1C] text-white"
            onClick={handlePrint2PerPage}
          >
            <Printer size={14} className="mr-2" />
            Print 2 per Page
          </Button>
        </div>
      </div>

      {/* Pass Card — half A4 sized */}
      <div className="pass-card bg-white rounded-xl border border-gray-200 shadow-md overflow-hidden">
        {/* Header */}
        <div
          className="px-4 py-3 flex items-center gap-3"
          style={{
            background:
              "linear-gradient(135deg, #1B5E20 0%, #2E7D32 60%, #1B5E20 100%)",
          }}
        >
          <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center overflow-hidden flex-shrink-0">
            <img
              src="/assets/logo-019d6222-36be-748a-bc3b-3755cb68bffb.jpg"
              alt="Swift Life Sciences"
              className="w-9 h-9 object-contain"
            />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-white text-sm font-bold tracking-wide leading-tight">
              SWIFT LIFE SCIENCES PVT. LTD.
            </h2>
            <p className="text-green-200 text-[9px] mt-0.5 truncate">
              D-1, Sara Industrial Estate, Selaqui, Dehradun
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="bg-white/20 rounded-lg px-2 py-1">
              <p className="text-white text-[9px] font-semibold uppercase tracking-wider">
                MATERIAL PASS
              </p>
              <p className="text-green-200 text-[8px] mt-0.5">
                {material.passId}
              </p>
            </div>
          </div>
        </div>

        {/* Type indicator */}
        <div
          className={`px-4 py-1.5 flex items-center gap-2 ${
            material.type === "In" ? "bg-green-50" : "bg-red-50"
          }`}
        >
          <span
            className={`text-xs font-bold ${
              material.type === "In" ? "text-green-700" : "text-red-700"
            }`}
          >
            {material.type === "In"
              ? "\u2191 INWARD MATERIAL"
              : "\u2193 OUTWARD MATERIAL"}
          </span>
          <div className="ml-auto">
            <StatusBadge status={material.status} />
          </div>
        </div>

        {/* Details */}
        <div className="p-4">
          <div className="border border-gray-200 rounded-lg overflow-hidden mb-4">
            <table className="w-full">
              <tbody>
                {(
                  [
                    ["Material Name", material.name],
                    ["Quantity", `${material.quantity} ${material.unit}`],
                    ["Company", material.company],
                    ["Vehicle Number", material.vehicle],
                    ["Driver Name", material.driverName],
                    ["Purpose", material.purpose],
                    ["Date", material.date],
                    ["In Time", material.inTime],
                    ["Status", material.status],
                  ] as [string, string][]
                ).map(([label, value]) => (
                  <tr
                    key={label}
                    className="border-b border-gray-50 last:border-0"
                  >
                    <td className="px-3 py-1.5 text-[10px] font-semibold text-gray-500 bg-gray-50 w-32">
                      {label}
                    </td>
                    <td className="px-3 py-1.5 text-[10px] text-gray-900">
                      {value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Barcode */}
          <div className="flex flex-col items-center py-3 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-[9px] font-semibold text-gray-500 mb-2 uppercase tracking-wider">
              Barcode
            </p>
            <BarcodeDisplay code={material.barcodeNumber} />
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 flex justify-between">
          <p className="text-[9px] text-gray-400">
            This pass must be surrendered at exit. Subject to verification.
          </p>
          <p className="text-[9px] text-gray-400">Ph: 0135 269 9975</p>
        </div>
      </div>
    </div>
  );
}
