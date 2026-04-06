import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle, Clock, Printer, User } from "lucide-react";
import { QRCodeDisplay } from "../components/QRCodeDisplay";
import { StatusBadge } from "../components/StatusBadge";
import type { AppView, Visitor } from "../types";

interface VisitorPassProps {
  visitor: Visitor | null;
  onNavigate: (view: AppView) => void;
}

function BarcodeDisplay({ code }: { code: string }) {
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

export function VisitorPass({ visitor, onNavigate }: VisitorPassProps) {
  if (!visitor) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-gray-500">No visitor selected.</p>
        <Button
          data-ocid="visitor_pass.back.button"
          variant="outline"
          onClick={() => onNavigate("visitor-form")}
        >
          <ArrowLeft size={16} className="mr-2" />
          Back
        </Button>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  const handlePrint2PerPage = () => {
    const win = window.open("", "_blank", "width=900,height=700");
    if (!win) return;

    const passHTML = (label: string) => `
      <div style="width:148mm;border:1px solid #ccc;font-family:Arial,sans-serif;font-size:9pt;overflow:hidden;box-sizing:border-box;">
        <div style="background:linear-gradient(135deg,#B71C1C,#D32F2F);padding:10px 14px;display:flex;align-items:center;gap:10px;">
          <img src="/assets/logo-019d6222-36be-748a-bc3b-3755cb68bffb.jpg" style="width:36px;height:36px;object-fit:contain;border-radius:6px;background:rgba(255,255,255,0.15);" />
          <div style="flex:1;">
            <div style="color:#fff;font-size:10pt;font-weight:bold;line-height:1.2;">SWIFT LIFE SCIENCES PVT. LTD.</div>
            <div style="color:#ffcdd2;font-size:7pt;margin-top:2px;">D-1, Sara Industrial Estate, Selaqui, Dehradun</div>
          </div>
          <div style="text-align:right;background:rgba(255,255,255,0.2);border-radius:5px;padding:5px 8px;">
            <div style="color:#fff;font-size:7pt;font-weight:bold;text-transform:uppercase;">VISITOR PASS</div>
            <div style="color:#ffcdd2;font-size:6pt;margin-top:1px;">${visitor.passId}</div>
          </div>
        </div>
        <div style="padding:10px 14px;">
          ${visitor.photo ? `<div style="text-align:center;margin-bottom:8px;"><img src="${visitor.photo}" style="width:80px;height:80px;object-fit:cover;border-radius:6px;border:2px solid #D32F2F;" /></div>` : ""}
          <table style="width:100%;border-collapse:collapse;font-size:8pt;">
            <tbody>
              <tr><td style="padding:3px 6px;background:#f5f5f5;font-weight:600;color:#666;width:110px;border:1px solid #eee;">Name</td><td style="padding:3px 6px;border:1px solid #eee;">${visitor.name}</td></tr>
              <tr><td style="padding:3px 6px;background:#f5f5f5;font-weight:600;color:#666;border:1px solid #eee;">Mobile</td><td style="padding:3px 6px;border:1px solid #eee;">${visitor.mobile}</td></tr>
              <tr><td style="padding:3px 6px;background:#f5f5f5;font-weight:600;color:#666;border:1px solid #eee;">Meet</td><td style="padding:3px 6px;border:1px solid #eee;">${visitor.personToMeetName}${visitor.department ? ` (${visitor.department})` : ""}</td></tr>
              <tr><td style="padding:3px 6px;background:#f5f5f5;font-weight:600;color:#666;border:1px solid #eee;">Purpose</td><td style="padding:3px 6px;border:1px solid #eee;">${visitor.purpose}</td></tr>
              <tr><td style="padding:3px 6px;background:#f5f5f5;font-weight:600;color:#666;border:1px solid #eee;">ID Proof</td><td style="padding:3px 6px;border:1px solid #eee;">${visitor.idProofType} — ${visitor.idProofNumber}</td></tr>
              <tr><td style="padding:3px 6px;background:#f5f5f5;font-weight:600;color:#666;border:1px solid #eee;">Date/Time</td><td style="padding:3px 6px;border:1px solid #eee;">${visitor.date} ${visitor.inTime}</td></tr>
              <tr><td style="padding:3px 6px;background:#f5f5f5;font-weight:600;color:#666;border:1px solid #eee;">Status</td><td style="padding:3px 6px;border:1px solid #eee;">${visitor.status}</td></tr>
            </tbody>
          </table>
          ${
            visitor.digitalSignature
              ? `
          <div style="margin-top:10px;border:1px solid #D32F2F;border-radius:5px;padding:8px;">
            <div style="color:#D32F2F;font-size:7pt;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:3px;">AUTHORIZED BY</div>
            <div style="font-style:italic;font-size:9pt;color:#333;">${visitor.digitalSignature}</div>
            <div style="color:#666;font-size:7pt;margin-top:2px;">✓ Digitally Signed</div>
          </div>`
              : ""
          }
          <div style="text-align:center;margin-top:8px;">
            <div style="font-size:7pt;color:#999;margin-bottom:3px;">Scan to verify pass</div>
          </div>
        </div>
        <div style="padding:5px 14px;background:#f9f9f9;border-top:1px solid #eee;display:flex;justify-content:space-between;font-size:7pt;color:#999;">
          <span>Valid for date of issue only. Surrender at exit.</span>
          <span>Ph: 0135 269 9975</span>
        </div>
        <div style="text-align:center;font-size:6pt;color:#bbb;padding:2px 0;">${label}</div>
      </div>
    `;

    win.document.write(`
      <html>
        <head>
          <title>Visitor Pass — ${visitor.passId}</title>
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

  const statusColor: Record<string, string> = {
    Pending: "#F9A825",
    Approved: "#2E7D32",
    Rejected: "#C62828",
    Exited: "#6B7280",
    MeetingCompleted: "#1565C0",
  };

  const statusBg = `${statusColor[visitor.status] ?? "#6B7280"}18`;
  const statusFg = statusColor[visitor.status] ?? "#6B7280";

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Action bar */}
      <div className="flex items-center justify-between no-print">
        <div className="flex items-center gap-3">
          <button
            type="button"
            data-ocid="visitor_pass.back.button"
            onClick={() => onNavigate("employee-approvals")}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Visitor Pass</h1>
            <p className="text-sm text-gray-500">{visitor.passId}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            data-ocid="visitor_pass.print.button"
            variant="outline"
            size="sm"
            onClick={handlePrint}
          >
            <Printer size={14} className="mr-2" />
            Print
          </Button>
          <Button
            data-ocid="visitor_pass.print2.button"
            size="sm"
            className="bg-[#D32F2F] hover:bg-[#B71C1C] text-white"
            onClick={handlePrint2PerPage}
          >
            <Printer size={14} className="mr-2" />
            Print 2 per Page
          </Button>
        </div>
      </div>

      {/* Pass Card — half A4 sized for print */}
      <div className="pass-card bg-white rounded-xl border border-gray-200 shadow-md overflow-hidden">
        {/* Pass Header */}
        <div
          className="px-4 py-3 flex items-center gap-3"
          style={{
            background:
              "linear-gradient(135deg, #B71C1C 0%, #D32F2F 60%, #B71C1C 100%)",
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
            <p className="text-red-200 text-[9px] mt-0.5 truncate">
              D-1, Sara Industrial Estate, Selaqui, Dehradun
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="bg-white/20 rounded-lg px-2 py-1">
              <p className="text-white text-[9px] font-semibold uppercase tracking-wider">
                VISITOR PASS
              </p>
              <p className="text-red-200 text-[8px] mt-0.5">{visitor.passId}</p>
            </div>
          </div>
        </div>

        {/* Status bar */}
        <div
          className="px-4 py-1.5 flex items-center justify-between"
          style={{ backgroundColor: statusBg }}
        >
          <div className="flex items-center gap-1.5">
            <CheckCircle size={12} style={{ color: statusFg }} />
            <span
              className="text-[10px] font-semibold"
              style={{ color: statusFg }}
            >
              STATUS:
            </span>
            <StatusBadge status={visitor.status} />
          </div>
          <div className="flex items-center gap-1 text-[10px] text-gray-500">
            <Clock size={10} />
            <span>
              {visitor.date} {visitor.inTime}
            </span>
          </div>
        </div>

        {/* Main content */}
        <div className="p-4">
          <div className="flex gap-4">
            {/* Photo + QR + Barcode */}
            <div className="flex-shrink-0 flex flex-col items-center gap-2">
              <div className="w-20 h-20 rounded-lg overflow-hidden border-2 border-gray-200 bg-gray-100">
                {visitor.photo ? (
                  <img
                    src={visitor.photo}
                    alt="Visitor"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center">
                    <User size={24} className="text-gray-300" />
                    <p className="text-[8px] text-gray-400 mt-0.5">No Photo</p>
                  </div>
                )}
              </div>
              <QRCodeDisplay value={visitor.passId} size={72} />
              <BarcodeDisplay code={visitor.passId} />
            </div>

            {/* Details */}
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold text-gray-900">
                {visitor.name}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">{visitor.mobile}</p>

              <div className="mt-2 border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full">
                  <tbody>
                    <tr className="border-b border-gray-100">
                      <td className="px-2 py-1.5 text-[10px] font-semibold text-gray-500 bg-gray-50 w-28">
                        Person to Meet
                      </td>
                      <td className="px-2 py-1.5 text-[10px] text-gray-900">
                        {visitor.personToMeetName}
                        {visitor.department && (
                          <span className="text-gray-400">
                            {" "}
                            ({visitor.department})
                          </span>
                        )}
                      </td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="px-2 py-1.5 text-[10px] font-semibold text-gray-500 bg-gray-50">
                        Purpose
                      </td>
                      <td className="px-2 py-1.5 text-[10px] text-gray-900">
                        {visitor.purpose}
                      </td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="px-2 py-1.5 text-[10px] font-semibold text-gray-500 bg-gray-50">
                        ID Proof
                      </td>
                      <td className="px-2 py-1.5 text-[10px] text-gray-900">
                        {visitor.idProofType} — {visitor.idProofNumber}
                      </td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="px-2 py-1.5 text-[10px] font-semibold text-gray-500 bg-gray-50">
                        Visitors
                      </td>
                      <td className="px-2 py-1.5 text-[10px] text-gray-900">
                        {visitor.numberOfVisitors} person(s)
                      </td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="px-2 py-1.5 text-[10px] font-semibold text-gray-500 bg-gray-50">
                        In Time
                      </td>
                      <td className="px-2 py-1.5 text-[10px] text-gray-900">
                        {visitor.inTime}
                      </td>
                    </tr>
                    {visitor.outTime && (
                      <tr className="border-b border-gray-100">
                        <td className="px-2 py-1.5 text-[10px] font-semibold text-gray-500 bg-gray-50">
                          Out Time
                        </td>
                        <td className="px-2 py-1.5 text-[10px] text-gray-900">
                          {visitor.outTime}
                        </td>
                      </tr>
                    )}
                    {visitor.duration && (
                      <tr>
                        <td className="px-2 py-1.5 text-[10px] font-semibold text-gray-500 bg-gray-50">
                          Duration
                        </td>
                        <td className="px-2 py-1.5 text-[10px] font-semibold text-gray-900">
                          {visitor.duration}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Digital Signature — professional authorized box */}
              {visitor.digitalSignature && (
                <div
                  className="mt-2 rounded-lg p-2"
                  style={{
                    border: "1px solid #D32F2F",
                    background: "rgba(211,47,47,0.03)",
                  }}
                >
                  <p className="text-[9px] font-bold text-[#D32F2F] uppercase tracking-wider mb-0.5">
                    Authorized By
                  </p>
                  <p className="text-xs italic text-gray-700 font-medium">
                    {visitor.digitalSignature}
                  </p>
                  <p className="text-[9px] text-green-700 mt-0.5 font-medium">
                    ✓ Digitally Signed
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <p className="text-[9px] text-gray-400">
            Valid for date of issue only. Surrender at exit.
          </p>
          <p className="text-[9px] text-gray-400">Ph: 0135 269 9975</p>
        </div>
      </div>
    </div>
  );
}
