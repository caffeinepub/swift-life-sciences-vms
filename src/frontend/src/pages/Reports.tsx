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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import {
  Download,
  FileText,
  Filter,
  RotateCcw,
  Search,
  Truck,
} from "lucide-react";
import { useState } from "react";
import { StatusBadge } from "../components/StatusBadge";
import { employees } from "../mockData";
import type { DispatchGatepass, Material, Visitor } from "../types";

interface ReportsProps {
  visitors: Visitor[];
  materials: Material[];
  dispatchGatepasses?: DispatchGatepass[];
}

export function Reports({
  visitors,
  materials,
  dispatchGatepasses = [],
}: ReportsProps) {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [entryType, setEntryType] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [employeeFilter, setEmployeeFilter] = useState("all");

  type ReportRow = {
    id: string;
    type: string;
    name: string;
    purpose: string;
    date: string;
    inTime: string;
    outTime?: string;
    status: string;
    personOrCompany: string;
  };

  const allRows: ReportRow[] = [
    ...visitors.map((v) => ({
      id: v.id,
      type: "Visitor",
      name: v.name,
      purpose: v.purpose,
      date: v.date,
      inTime: v.inTime,
      outTime: v.outTime,
      status: v.status,
      personOrCompany: v.personToMeetName,
    })),
    ...materials.map((m) => ({
      id: m.id,
      type: "Material",
      name: m.name,
      purpose: m.purpose,
      date: m.date,
      inTime: m.inTime,
      outTime: undefined,
      status: m.status,
      personOrCompany: m.company,
    })),
  ];

  const filtered = allRows.filter((row) => {
    if (dateFrom && row.date < dateFrom) return false;
    if (dateTo && row.date > dateTo) return false;
    if (entryType !== "all" && row.type.toLowerCase() !== entryType)
      return false;
    if (statusFilter !== "all" && row.status !== statusFilter) return false;
    if (employeeFilter !== "all") {
      const emp = employees.find((e) => String(e.id) === employeeFilter);
      if (emp && !row.personOrCompany.includes(emp.name)) return false;
    }
    return true;
  });

  const filteredDispatch = dispatchGatepasses.filter((gp) => {
    if (dateFrom && gp.date < dateFrom) return false;
    if (dateTo && gp.date > dateTo) return false;
    return true;
  });

  const handleReset = () => {
    setDateFrom("");
    setDateTo("");
    setEntryType("all");
    setStatusFilter("all");
    setEmployeeFilter("all");
  };

  const exportCSV = () => {
    const headers = [
      "ID",
      "Type",
      "Name",
      "Purpose",
      "Date",
      "In Time",
      "Out Time",
      "Status",
      "Employee/Company",
    ];
    const rows = filtered.map((r) => [
      r.id,
      r.type,
      r.name,
      r.purpose,
      r.date,
      r.inTime,
      r.outTime || "-",
      r.status,
      r.personOrCompany,
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((c) => `"${c}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `swift-gate-report-${format(new Date(), "yyyyMMdd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportDispatchCSV = () => {
    const headers = [
      "Pass ID",
      "Created By",
      "Vehicle No",
      "Driver",
      "Destination",
      "Purpose",
      "Items Count",
      "Status",
      "Date",
      "Created Time",
      "Released Time",
    ];
    const rows = filteredDispatch.map((gp) => [
      gp.passId,
      gp.createdBy,
      gp.vehicleNo,
      gp.driverName,
      gp.destination,
      gp.purpose,
      String(gp.items.length),
      gp.status,
      gp.date,
      gp.createdTime,
      gp.releasedTime || "-",
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((c) => `"${c}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `swift-dispatch-report-${format(new Date(), "yyyyMMdd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Reports</h1>
        <p className="text-sm text-gray-500">
          Gate pass records and dispatch reports
        </p>
      </div>

      <Tabs defaultValue="visitors-materials">
        <TabsList className="bg-gray-100">
          <TabsTrigger
            data-ocid="reports.visitors_tab.tab"
            value="visitors-materials"
          >
            Visitors & Materials
          </TabsTrigger>
          <TabsTrigger data-ocid="reports.dispatch_tab.tab" value="dispatch">
            Dispatch Gatepasses
          </TabsTrigger>
        </TabsList>

        {/* Visitors & Materials Tab */}
        <TabsContent value="visitors-materials">
          <div className="space-y-4">
            {/* Filter bar */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <Filter size={16} className="text-[#D32F2F]" />
                <h2 className="text-sm font-semibold text-gray-900">Filters</h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                <div>
                  <Label className="text-xs font-medium text-gray-600">
                    Date From
                  </Label>
                  <Input
                    data-ocid="reports.date_from.input"
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="mt-1 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-600">
                    Date To
                  </Label>
                  <Input
                    data-ocid="reports.date_to.input"
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="mt-1 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-600">
                    Entry Type
                  </Label>
                  <Select value={entryType} onValueChange={setEntryType}>
                    <SelectTrigger
                      data-ocid="reports.type.select"
                      className="mt-1 text-sm"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="visitor">Visitor</SelectItem>
                      <SelectItem value="material">Material</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-600">
                    Status
                  </Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger
                      data-ocid="reports.status.select"
                      className="mt-1 text-sm"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Approved">Approved</SelectItem>
                      <SelectItem value="Rejected">Rejected</SelectItem>
                      <SelectItem value="MeetingCompleted">
                        Meeting Done
                      </SelectItem>
                      <SelectItem value="Exited">Exited</SelectItem>
                      <SelectItem value="Cleared">Cleared</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-600">
                    Employee
                  </Label>
                  <Select
                    value={employeeFilter}
                    onValueChange={setEmployeeFilter}
                  >
                    <SelectTrigger
                      data-ocid="reports.employee.select"
                      className="mt-1 text-sm"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Employees</SelectItem>
                      {employees.map((emp) => (
                        <SelectItem key={emp.id} value={String(emp.id)}>
                          {emp.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button
                  data-ocid="reports.apply.button"
                  size="sm"
                  className="bg-[#D32F2F] hover:bg-[#B71C1C] text-white"
                >
                  <Search size={14} className="mr-2" />
                  Apply Filters
                </Button>
                <Button
                  data-ocid="reports.reset.button"
                  size="sm"
                  variant="outline"
                  onClick={handleReset}
                >
                  <RotateCcw size={14} className="mr-2" />
                  Reset
                </Button>
              </div>
            </div>

            {/* Results table */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <h2 className="text-sm font-bold text-gray-900">
                  Results ({filtered.length})
                </h2>
                <div className="flex gap-2">
                  <Button
                    data-ocid="reports.export_pdf.button"
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => window.print()}
                  >
                    <FileText size={12} className="mr-1" />
                    Export PDF
                  </Button>
                  <Button
                    data-ocid="reports.export_csv.button"
                    size="sm"
                    className="text-xs bg-green-600 hover:bg-green-700 text-white"
                    onClick={exportCSV}
                  >
                    <Download size={12} className="mr-1" />
                    Export CSV
                  </Button>
                </div>
              </div>

              {filtered.length === 0 ? (
                <div
                  data-ocid="reports.empty_state"
                  className="flex flex-col items-center justify-center py-12 text-gray-400"
                >
                  <Search size={28} className="mb-2 opacity-30" />
                  <p className="text-sm">
                    No records match the current filters
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="text-xs">Pass ID</TableHead>
                        <TableHead className="text-xs">Type</TableHead>
                        <TableHead className="text-xs">Name</TableHead>
                        <TableHead className="text-xs">Purpose</TableHead>
                        <TableHead className="text-xs">Date</TableHead>
                        <TableHead className="text-xs">In Time</TableHead>
                        <TableHead className="text-xs">Out Time</TableHead>
                        <TableHead className="text-xs">
                          Employee/Company
                        </TableHead>
                        <TableHead className="text-xs">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map((row, idx) => (
                        <TableRow
                          key={row.id}
                          data-ocid={`reports.row.item.${idx + 1}`}
                          className="hover:bg-gray-50/60"
                        >
                          <TableCell className="text-xs font-mono text-gray-500 py-3">
                            {row.id}
                          </TableCell>
                          <TableCell>
                            <span
                              className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                                row.type === "Visitor"
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-green-100 text-green-700"
                              }`}
                            >
                              {row.type}
                            </span>
                          </TableCell>
                          <TableCell className="text-xs font-semibold text-gray-900 py-3">
                            {row.name}
                          </TableCell>
                          <TableCell className="text-xs text-gray-500 max-w-[120px] truncate">
                            {row.purpose}
                          </TableCell>
                          <TableCell className="text-xs text-gray-500">
                            {row.date}
                          </TableCell>
                          <TableCell className="text-xs text-gray-500">
                            {row.inTime}
                          </TableCell>
                          <TableCell className="text-xs text-gray-500">
                            {row.outTime || "-"}
                          </TableCell>
                          <TableCell className="text-xs text-gray-600 max-w-[120px] truncate">
                            {row.personOrCompany}
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={row.status} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Dispatch Gatepasses Tab */}
        <TabsContent value="dispatch">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Truck size={16} className="text-[#D32F2F]" />
                <h2 className="text-sm font-bold text-gray-900">
                  Dispatch Records ({filteredDispatch.length})
                </h2>
              </div>
              <Button
                data-ocid="reports.dispatch_export.button"
                size="sm"
                className="text-xs bg-green-600 hover:bg-green-700 text-white"
                onClick={exportDispatchCSV}
              >
                <Download size={12} className="mr-1" />
                Export CSV
              </Button>
            </div>

            {filteredDispatch.length === 0 ? (
              <div
                data-ocid="reports.dispatch_empty_state"
                className="flex flex-col items-center justify-center py-12 text-gray-400"
              >
                <Truck size={28} className="mb-2 opacity-30" />
                <p className="text-sm">No dispatch records found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="text-xs">Pass ID</TableHead>
                      <TableHead className="text-xs">Created By</TableHead>
                      <TableHead className="text-xs">Vehicle</TableHead>
                      <TableHead className="text-xs">Destination</TableHead>
                      <TableHead className="text-xs">Items</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                      <TableHead className="text-xs">Date</TableHead>
                      <TableHead className="text-xs">Released Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDispatch.map((gp, idx) => (
                      <TableRow
                        key={gp.id}
                        data-ocid={`reports.dispatch.item.${idx + 1}`}
                        className="hover:bg-gray-50/60"
                      >
                        <TableCell className="text-xs font-mono text-gray-500 py-3">
                          {gp.passId}
                        </TableCell>
                        <TableCell className="text-xs font-semibold text-gray-900 py-3">
                          {gp.createdBy}
                        </TableCell>
                        <TableCell className="text-xs text-gray-600 py-3">
                          {gp.vehicleNo}
                        </TableCell>
                        <TableCell className="text-xs text-gray-600 py-3">
                          {gp.destination}
                        </TableCell>
                        <TableCell className="py-3">
                          <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">
                            {gp.items.length} items
                          </span>
                        </TableCell>
                        <TableCell className="py-3">
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                              gp.status === "Released"
                                ? "bg-green-50 text-green-700 border-green-200"
                                : gp.status === "Rejected"
                                  ? "bg-red-50 text-red-700 border-red-200"
                                  : gp.status === "Submitted"
                                    ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                                    : "bg-gray-100 text-gray-600 border-gray-200"
                            }`}
                          >
                            {gp.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs text-gray-500 py-3">
                          {gp.date}
                        </TableCell>
                        <TableCell className="text-xs text-gray-500 py-3">
                          {gp.releasedTime || "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
