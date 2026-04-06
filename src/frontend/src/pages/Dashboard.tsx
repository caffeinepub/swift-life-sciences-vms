import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CheckCircle2,
  ClipboardCheck,
  Package,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";
import { Search } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { StatusBadge } from "../components/StatusBadge";
import { entryTypeData, weeklyVisitorData } from "../mockData";
import type { AppView, Material, Visitor } from "../types";

interface DashboardProps {
  visitors: Visitor[];
  materials: Material[];
  onNavigate: (view: AppView) => void;
}

export function Dashboard({ visitors, materials, onNavigate }: DashboardProps) {
  const todayVisitors = visitors.filter((v) => v.date === "2026-04-06");
  const pendingApprovals = visitors.filter(
    (v) => v.status === "Pending",
  ).length;
  const completedMeetings = visitors.filter(
    (v) => v.status === "MeetingCompleted" || v.status === "Exited",
  ).length;
  const materialsIn = materials.filter((m) => m.type === "In").length;
  const materialsOut = materials.filter((m) => m.type === "Out").length;

  const kpiCards = [
    {
      label: "Total Visitors Today",
      value: todayVisitors.length,
      delta: "+12%",
      positive: true,
      icon: <Users size={20} className="text-[#B71C1C]" />,
    },
    {
      label: "Materials In / Out",
      value: `${materialsIn}/${materialsOut}`,
      delta: "+5%",
      positive: true,
      icon: <Package size={20} className="text-[#B71C1C]" />,
    },
    {
      label: "Pending Approvals",
      value: pendingApprovals,
      delta: "-3%",
      positive: false,
      icon: <ClipboardCheck size={20} className="text-[#B71C1C]" />,
    },
    {
      label: "Completed Meetings",
      value: completedMeetings,
      delta: "+18%",
      positive: true,
      icon: <CheckCircle2 size={20} className="text-[#B71C1C]" />,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Gate Pass Overview — Today
          </p>
        </div>
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <Input
            data-ocid="dashboard.search.input"
            placeholder="Search visitors, passes..."
            className="pl-9 w-56 text-sm"
          />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((card, idx) => (
          <div
            key={card.label}
            data-ocid={`dashboard.kpi.item.${idx + 1}`}
            className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 border-l-4 border-l-[#D32F2F] flex items-start justify-between"
          >
            <div>
              <p className="text-sm text-gray-500 font-medium">{card.label}</p>
              <p className="text-4xl font-extrabold text-gray-900 mt-1">
                {card.value}
              </p>
              <div
                className={`flex items-center gap-1 mt-2 text-sm font-medium ${
                  card.positive ? "text-green-600" : "text-red-500"
                }`}
              >
                {card.positive ? (
                  <TrendingUp size={14} />
                ) : (
                  <TrendingDown size={14} />
                )}
                <span>{card.delta} vs yesterday</span>
              </div>
            </div>
            <div className="w-11 h-11 rounded-xl bg-[#FCE4EC] flex items-center justify-center flex-shrink-0">
              {card.icon}
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Bar chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">
              Weekly Visitor Trends
            </h2>
            <button
              type="button"
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"
            >
              <RefreshCw size={14} />
            </button>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={weeklyVisitorData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 12, fill: "#6B7280" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 12, fill: "#6B7280" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: "8px",
                  border: "1px solid #E5E7EB",
                  fontSize: "12px",
                }}
              />
              <Bar
                dataKey="visitors"
                fill="#D32F2F"
                radius={[4, 4, 0, 0]}
                name="Visitors"
              />
              <Bar
                dataKey="materials"
                fill="#FCE4EC"
                radius={[4, 4, 0, 0]}
                name="Materials"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie chart */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Entry Types</h2>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={entryTypeData}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={72}
                paddingAngle={3}
                dataKey="value"
              >
                {entryTypeData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => `${v}%`} />
              <Legend iconType="circle" iconSize={8} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recent Visitors */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="text-base font-bold text-gray-900">
              Recent Visitors
            </h2>
            <div className="relative">
              <Search
                size={13}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <Input
                data-ocid="dashboard.visitors.search_input"
                placeholder="Search..."
                className="pl-7 h-7 text-xs w-36"
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="text-xs">Visitor</TableHead>
                  <TableHead className="text-xs">Purpose</TableHead>
                  <TableHead className="text-xs">Time</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visitors.slice(0, 5).map((v, idx) => (
                  <TableRow
                    key={v.id}
                    data-ocid={`dashboard.visitor.item.${idx + 1}`}
                    className="hover:bg-gray-50/60"
                  >
                    <TableCell className="py-3">
                      <div>
                        <p className="text-xs font-semibold text-gray-900">
                          {v.name}
                        </p>
                        <p className="text-[11px] text-gray-500">{v.mobile}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-gray-600 max-w-[100px] truncate">
                      {v.purpose}
                    </TableCell>
                    <TableCell className="text-xs text-gray-500">
                      {v.inTime}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={v.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="px-5 py-3 border-t border-gray-100">
            <Button
              data-ocid="dashboard.view_all_visitors.button"
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => onNavigate("employee-approvals")}
            >
              View All Visitors
            </Button>
          </div>
        </div>

        {/* Material Passes */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="text-base font-bold text-gray-900">
              Material Passes
            </h2>
            <Button
              data-ocid="dashboard.material.filter.button"
              variant="outline"
              size="sm"
              className="text-xs h-7"
            >
              Filter
            </Button>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="text-xs">Material</TableHead>
                  <TableHead className="text-xs">Company</TableHead>
                  <TableHead className="text-xs">Type</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {materials.map((m, idx) => (
                  <TableRow
                    key={m.id}
                    data-ocid={`dashboard.material.item.${idx + 1}`}
                    className="hover:bg-gray-50/60"
                  >
                    <TableCell className="py-3">
                      <div>
                        <p className="text-xs font-semibold text-gray-900">
                          {m.name}
                        </p>
                        <p className="text-[11px] text-gray-500">
                          {m.quantity} {m.unit}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-gray-600 max-w-[100px] truncate">
                      {m.company}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={m.type} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={m.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="px-5 py-3 border-t border-gray-100">
            <Button
              data-ocid="dashboard.view_all_materials.button"
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => onNavigate("material-form")}
            >
              View All Materials
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
