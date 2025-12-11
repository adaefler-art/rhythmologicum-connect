import { Sidebar } from "./components/Sidebar";
import { Header } from "./components/Header";
import { StatCard } from "./components/StatCard";
import { AssessmentsTable } from "./components/AssessmentsTable";
import svgPaths from "./imports/svg-g7cw989gdl";
import { Users, ClipboardList, FileCheck, AlertTriangle } from "lucide-react";

export default function App() {
  return (
    <div className="min-h-screen bg-[#f7f9fa]">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="ml-64">
        {/* Header */}
        <Header />

        {/* Dashboard Content */}
        <main className="p-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 20 16">
                  <path d={svgPaths.p2f83cd80} fill="#2563EB" />
                </svg>
              }
              value="247"
              label="Active Patients"
              badge={{ text: "+12%", variant: "success" }}
              iconBgColor="bg-blue-100"
            />

            <StatCard
              icon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16">
                  <path d={svgPaths.p203b4600} fill="#1D7F8C" />
                </svg>
              }
              value="32"
              label="Open Funnels"
              badge={{ text: "8 pending", variant: "warning" }}
              iconBgColor="bg-[rgba(29,127,140,0.1)]"
            />

            <StatCard
              icon={
                <svg className="w-3 h-4" fill="none" viewBox="0 0 12 16">
                  <path d={svgPaths.pfef9980} fill="#9333EA" />
                </svg>
              }
              value="18"
              label="Recent Assessments"
              badge={{ text: "Today", variant: "info" }}
              iconBgColor="bg-purple-100"
            />

            <StatCard
              icon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16">
                  <path d={svgPaths.p1b500f00} fill="#DC2626" />
                </svg>
              }
              value="3"
              label="Red Flags (24h)"
              badge={{ text: "Urgent", variant: "danger" }}
              iconBgColor="bg-red-100"
            />
          </div>

          {/* Assessments Table */}
          <AssessmentsTable />
        </main>
      </div>
    </div>
  );
}
