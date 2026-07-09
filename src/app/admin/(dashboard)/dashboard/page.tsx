"use client";

import {
  FileText,
  Globe2,
  Newspaper,
  Package,
  ShoppingBag,
  Users,
  Briefcase,
} from "lucide-react";
import { AdminPageHeader } from "@/components/admin/layout/AdminPageHeader";
import { StatCard } from "@/components/admin/dashboard/StatCard";
import { VisitorsChart, QuotesChart } from "@/components/admin/dashboard/ChartCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  dashboardChartData,
  getDashboardStats,
  recentActivity,
} from "@/lib/cms/adapters/mock/dashboard";

export default function DashboardPage() {
  const stats = getDashboardStats();

  return (
    <div>
      <AdminPageHeader
        title="Dashboard"
        description="Overview of your website and marketplace activity."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Products" value={stats.products} icon={Package} change="+2 this month" />
        <StatCard title="Pending Quotes" value={stats.pendingQuotes} icon={ShoppingBag} change="3 urgent" />
        <StatCard title="Form Submissions" value={stats.formSubmissions} icon={FileText} change="+8 this week" />
        <StatCard title="Visitors" value={stats.visitors.toLocaleString()} icon={Users} change="+12% vs last month" />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Active Countries" value={stats.activeCountries} icon={Globe2} />
        <StatCard title="Published Posts" value={stats.publishedPosts} icon={Newspaper} />
        <StatCard title="Open Jobs" value={stats.openJobs} icon={Briefcase} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <VisitorsChart data={dashboardChartData} />
        <QuotesChart data={dashboardChartData} />
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="divide-y divide-border/50">
            {recentActivity.map((item) => (
              <li key={item.id} className="flex items-center justify-between py-3 text-sm">
                <div>
                  <p className="font-medium text-oboya-blue-dark">{item.action}</p>
                  <p className="text-xs text-muted-foreground">{item.module}</p>
                </div>
                <span className="text-xs text-muted-foreground">{item.time}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
