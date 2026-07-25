"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MetricCard, MetricLineChart, MetricBarChart, MetricPieChart } from "@/components/charts/MetricCharts";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import {
  Users,
  Clock,
  MousePointer,
  TrendingUp,
  TrendingDown,
  Minus,
  Globe,
  Monitor,
  Smartphone,
  Tablet,
  Activity,
} from "lucide-react";

interface DashboardData {
  dailyMetrics: Array<{
    date: string;
    totalUsers: number;
    newUsers: number;
    returningUsers: number;
    totalSessions: number;
    totalPageViews: number;
    totalEvents: number;
    avgSessionDuration: number;
    bounceRate: number;
  }>;
  hourlyMetrics: Array<{
    date: string;
    hour: number;
    activeUsers: number;
    totalSessions: number;
    totalPageViews: number;
    totalEvents: number;
    avgSessionDuration: number;
  }>;
  topPages: Array<{ path: string; count: number }>;
  topEvents: Array<{ name: string; count: number }>;
  topCountries: Array<{ country: string | null; count: number }>;
  topBrowsers: Array<{ browser: string | null; count: number }>;
  topDevices: Array<{ device: string | null; count: number }>;
  activeSessions: Array<{
    id: string;
    sessionToken: string;
    userId: string | null;
    country: string | null;
    city: string | null;
    device: string | null;
    browser: string | null;
    startedAt: string;
    pageViews: number;
  }>;
}

export function DashboardContent({ user }: { user: { id: string; name: string | null; email: string } }) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<"7d" | "30d" | "90d">("30d");
  const [realtime, setRealtime] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (dateRange !== "30d") params.set("range", dateRange);
      
      const response = await fetch(`/api/analytics?${params}`);
      if (!response.ok) throw new Error("Failed to fetch analytics");
      const result = await response.json();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    if (realtime) {
      const interval = setInterval(fetchData, 30000);
      return () => clearInterval(interval);
    }
  }, [dateRange, realtime]);

  const getChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? "+100%" : "0%";
    const change = ((current - previous) / previous) * 100;
    return `${change >= 0 ? "+" : ""}${change.toFixed(1)}%`;
  };

  const getChangeType = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? "increase" : undefined;
    return current >= previous ? "increase" : "decrease";
  };

  if (loading && !data) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="h-4 bg-muted animate-pulse rounded w-3/4 mb-2" />
              <div className="h-8 bg-muted animate-pulse rounded w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive mb-4">{error}</p>
        <Button onClick={fetchData}>Retry</Button>
      </div>
    );
  }

  const latest = data?.dailyMetrics[data.dailyMetrics.length - 1];
  const previous = data?.dailyMetrics[data.dailyMetrics.length - 2];
  const totalUsers = latest?.totalUsers || 0;
  const prevTotalUsers = previous?.totalUsers || 0;
  const totalSessions = latest?.totalSessions || 0;
  const prevTotalSessions = previous?.totalSessions || 0;
  const totalPageViews = latest?.totalPageViews || 0;
  const prevTotalPageViews = previous?.totalPageViews || 0;
  const totalEvents = latest?.totalEvents || 0;
  const prevTotalEvents = previous?.totalEvents || 0;

  const chartData = data?.dailyMetrics.map((d) => ({
    date: format(new Date(d.date), "MMM dd"),
    users: d.totalUsers,
    sessions: d.totalSessions,
    pageViews: d.totalPageViews,
    events: d.totalEvents,
  })) || [];

  const hourlyData = data?.hourlyMetrics.slice(-24).map((h) => ({
    hour: `${h.hour}:00`,
    activeUsers: h.activeUsers,
    sessions: h.totalSessions,
    pageViews: h.totalPageViews,
  })) || [];

  const countryData = data?.topCountries
    .filter((c) => c.country)
    .slice(0, 5)
    .map((c) => ({ name: c.country!, value: c.count })) || [];

  const browserData = data?.topBrowsers
    .filter((b) => b.browser)
    .slice(0, 5)
    .map((b) => ({ name: b.browser!, value: b.count })) || [];

  const deviceData = data?.topDevices
    .filter((d) => d.device)
    .slice(0, 5)
    .map((d) => ({ name: d.device!, value: d.count })) || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user.name || user.email}. Here's what's happening with your users.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={dateRange} onValueChange={setDateRange as any}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => setRealtime(!realtime)}>
            {realtime ? "Pause" : "Live"} Updates
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Users"
          value={totalUsers.toLocaleString()}
          change={getChange(totalUsers, prevTotalUsers)}
          changeType={getChangeType(totalUsers, prevTotalUsers)}
          icon={<Users className="h-5 w-5 text-primary" />}
        />
        <MetricCard
          title="Total Sessions"
          value={totalSessions.toLocaleString()}
          change={getChange(totalSessions, prevTotalSessions)}
          changeType={getChangeType(totalSessions, prevTotalSessions)}
          icon={<Clock className="h-5 w-5 text-blue-500" />}
        />
        <MetricCard
          title="Page Views"
          value={totalPageViews.toLocaleString()}
          change={getChange(totalPageViews, prevTotalPageViews)}
          changeType={getChangeType(totalPageViews, prevTotalPageViews)}
          icon={<MousePointer className="h-5 w-5 text-green-500" />}
        />
        <MetricCard
          title="Events Tracked"
          value={totalEvents.toLocaleString()}
          change={getChange(totalEvents, prevTotalEvents)}
          changeType={getChangeType(totalEvents, prevTotalEvents)}
          icon={<Activity className="h-5 w-5 text-purple-500" />}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <MetricLineChart
          data={chartData}
          xKey="date"
          yKey="users"
          label="Daily Active Users"
          color="hsl(var(--primary))"
        />
        <MetricLineChart
          data={chartData}
          xKey="date"
          yKey="sessions"
          label="Daily Sessions"
          color="hsl(var(--primary))"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <MetricBarChart
          data={data?.topPages.slice(0, 10).map((p) => ({ name: p.path.length > 30 ? p.path.substring(0, 30) + "..." : p.path, value: p.count })) || []}
          xKey="name"
          yKey="value"
          label="Top Pages"
        />
        <MetricBarChart
          data={data?.topEvents.slice(0, 10).map((e) => ({ name: e.name, value: e.count })) || []}
          xKey="name"
          yKey="value"
          label="Top Events"
        />
        <div className="lg:col-span-3">
          <MetricBarChart
            data={hourlyData}
            xKey="hour"
            yKey="activeUsers"
            label="Active Users (Last 24 Hours)"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">Top Countries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {countryData.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{item.name}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">{item.value.toLocaleString()}</span>
                </div>
              ))}
              {countryData.length === 0 && <p className="text-muted-foreground text-center py-4">No data available</p>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">Top Browsers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {browserData.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Monitor className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{item.name}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">{item.value.toLocaleString()}</span>
                </div>
              ))}
              {browserData.length === 0 && <p className="text-muted-foreground text-center py-4">No data available</p>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">Top Devices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {deviceData.map((item, index) => {
                const Icon = item.name === "Mobile" ? Smartphone : item.name === "Tablet" ? Tablet : Monitor;
                return (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{item.name}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">{item.value.toLocaleString()}</span>
                  </div>
                );
              })}
              {deviceData.length === 0 && <p className="text-muted-foreground text-center py-4">No data available</p>}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Sessions (Last 5 Minutes)</CardTitle>
        </CardHeader>
        <CardContent>
          {data?.activeSessions.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No active sessions</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left text-sm text-muted-foreground">
                    <th className="pb-3 px-4">Session</th>
                    <th className="pb-3 px-4">User</th>
                    <th className="pb-3 px-4">Location</th>
                    <th className="pb-3 px-4">Device</th>
                    <th className="pb-3 px-4">Browser</th>
                    <th className="pb-3 px-4">Started</th>
                    <th className="pb-3 px-4">Pages</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.activeSessions.slice(0, 20).map((session) => (
                    <tr key={session.id} className="border-b hover:bg-accent/50">
                      <td className="py-3 px-4 text-sm font-mono text-muted-foreground">
                        {session.sessionToken.substring(0, 12)}...
                      </td>
                      <td className="py-3 px-4 text-sm">
                        {session.userId ? (
                          <span className="font-medium">{session.userId.substring(0, 8)}...</span>
                        ) : (
                          <span className="text-muted-foreground">Anonymous</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">
                        {session.city && session.country ? `${session.city}, ${session.country}` : session.country || "Unknown"}
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">{session.device || "Unknown"}</td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">{session.browser || "Unknown"}</td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">
                        {format(new Date(session.startedAt), "HH:mm:ss")}
                      </td>
                      <td className="py-3 px-4 text-sm font-medium">{session.pageViews}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}