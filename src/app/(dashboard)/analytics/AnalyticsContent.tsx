"use client";

import { useState, useEffect } from "react";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { Calendar, ChevronLeft, ChevronRight, Download, BarChart2, Users, Clock, MousePointer, Activity, TrendingUp, TrendingDown, Globe, Monitor, Smartphone, Tablet, Search, Filter, MoreHorizontal } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface User {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
}

interface AnalyticsData {
  overview: {
    totalUsers: number;
    newUsers: number;
    returningUsers: number;
    totalSessions: number;
    totalPageViews: number;
    totalEvents: number;
    avgSessionDuration: number;
    bounceRate: number;
  };
  timeSeries: Array<{
    timestamp: string;
    totalUsers: number;
    newUsers: number;
    sessions: number;
    pageViews: number;
    events: number;
    avgSessionDuration: number;
    bounceRate: number;
  }>;
  topPages: Array<{ path: string; count: number }>;
  topEvents: Array<{ event: string; count: number }>;
  topCountries: Array<{ country: string; count: number }>;
  topBrowsers: Array<{ browser: string; count: number }>;
  topDevices: Array<{ device: string; count: number }>;
}

interface DateRange {
  from: Date;
  to: Date;
}

export function AnalyticsContent({ user }: { user: User }) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange>({
    from: startOfDay(subDays(new Date(), 30)),
    to: endOfDay(new Date()),
  });
  const [granularity, setGranularity] = useState<"hour" | "day" | "week" | "month">("day");
  const [activeTab, setActiveTab] = useState<"overview" | "pages" | "events" | "geo" | "tech">("overview");

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange, granularity]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        startDate: dateRange.from.toISOString(),
        endDate: dateRange.to.toISOString(),
        granularity,
      });
      const response = await fetch(`/api/analytics?${params}`);
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toLocaleString();
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getChartData = () => {
    if (!data?.timeSeries) return [];
    return data.timeSeries.map((point) => ({
      date: format(new Date(point.timestamp), granularity === "hour" ? "MMM dd HH:00" : "MMM dd"),
      users: point.totalUsers,
      newUsers: point.newUsers,
      sessions: point.sessions,
      pageViews: point.pageViews,
      events: point.events,
      avgDuration: point.avgSessionDuration,
      bounceRate: point.bounceRate,
    }));
  };

  const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#00C9FF", "#92E3A9"];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">
            Deep dive into your user activity and engagement metrics
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={granularity} onValueChange={setGranularity as any}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hour">Hourly</SelectItem>
              <SelectItem value="day">Daily</SelectItem>
              <SelectItem value="week">Weekly</SelectItem>
              <SelectItem value="month">Monthly</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <div className="flex gap-2 border-b" role="tablist">
        {[
          { id: "overview", label: "Overview", icon: BarChart2 },
          { id: "pages", label: "Pages", icon: MousePointer },
          { id: "events", label: "Events", icon: Activity },
          { id: "geo", label: "Geography", icon: Globe },
          { id: "tech", label: "Technology", icon: Monitor },
        ].map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "overview" && data && (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              title="Total Users"
              value={formatNumber(data.overview.totalUsers)}
              icon={<Users className="h-5 w-5 text-primary" />}
              change={"+12.5%"}
              changeType="increase"
            />
            <MetricCard
              title="Total Sessions"
              value={formatNumber(data.overview.totalSessions)}
              icon={<Clock className="h-5 w-5 text-blue-500" />}
              change="+8.2%"
              changeType="increase"
            />
            <MetricCard
              title="Page Views"
              value={formatNumber(data.overview.totalPageViews)}
              icon={<MousePointer className="h-5 w-5 text-green-500" />}
              change="+15.3%"
              changeType="increase"
            />
            <MetricCard
              title="Events"
              value={formatNumber(data.overview.totalEvents)}
              icon={<Activity className="h-5 w-5 text-purple-500" />}
              change="+22.1%"
              changeType="increase"
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Daily Active Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={getChartData()}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="date" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                      <YAxis className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--background))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                        formatter={(value) => [(Number(value) || 0).toLocaleString(), "Users"]}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="users"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 6 }}
                        name="Total Users"
                      />
                      <Line
                        type="monotone"
                        dataKey="newUsers"
                        stroke="hsl(var(--secondary))"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 6 }}
                        name="New Users"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Sessions & Page Views</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={getChartData()}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="date" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                      <YAxis className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--background))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                        formatter={(value) => [(Number(value) || 0).toLocaleString(), "Count"]}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="sessions"
                        stroke="#82ca9d"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 6 }}
                        name="Sessions"
                      />
                      <Line
                        type="monotone"
                        dataKey="pageViews"
                        stroke="#ffc658"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 6 }}
                        name="Page Views"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Avg Session Duration & Bounce Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={getChartData()}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="date" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                      <YAxis className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--background))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                        formatter={(value, name) => [
                          name === "avgDuration" ? formatDuration(Number(value) || 0) : (Number(value) || 0).toFixed(1) + "%",
                          name as string,
                        ] as const}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="avgDuration"
                        stroke="#ff7300"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 6 }}
                        name="Avg Duration (s)"
                        yAxisId="left"
                      />
                      <Line
                        type="monotone"
                        dataKey="bounceRate"
                        stroke="#00C9FF"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 6 }}
                        name="Bounce Rate %"
                        yAxisId="right"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Events Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={getChartData()}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="date" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                      <YAxis className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--background))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                        formatter={(value) => [((value as number) || 0).toLocaleString(), "Events"] as const}
                      />
                      <Legend />
                      <Bar dataKey="events" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeTab === "pages" && data && (
        <Card>
          <CardHeader>
            <CardTitle>Top Pages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left text-sm text-muted-foreground">
                    <th className="pb-3 px-4">Page</th>
                    <th className="pb-3 px-4 text-right">Views</th>
                    <th className="pb-3 px-4 text-right">% of Total</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topPages.map((page, index) => (
                    <tr key={index} className="border-b hover:bg-accent/50">
                      <td className="py-3 px-4 text-sm font-mono">
                        <code className="text-primary">{page.path}</code>
                      </td>
                      <td className="py-3 px-4 text-sm text-right font-medium">
                        {page.count.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-sm text-right text-muted-foreground">
                        {data.overview.totalPageViews > 0
                          ? ((page.count / data.overview.totalPageViews) * 100).toFixed(1) + "%"
                          : "0%"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === "events" && data && (
        <Card>
          <CardHeader>
            <CardTitle>Top Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left text-sm text-muted-foreground">
                    <th className="pb-3 px-4">Event</th>
                    <th className="pb-3 px-4 text-right">Count</th>
                    <th className="pb-3 px-4 text-right">% of Total</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topEvents.map((event, index) => (
                    <tr key={index} className="border-b hover:bg-accent/50">
                      <td className="py-3 px-4 text-sm font-medium">{event.event}</td>
                      <td className="py-3 px-4 text-sm text-right font-medium">
                        {event.count.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-sm text-right text-muted-foreground">
                        {data.overview.totalEvents > 0
                          ? ((event.count / data.overview.totalEvents) * 100).toFixed(1) + "%"
                          : "0%"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === "geo" && data && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Top Countries</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.topCountries.slice(0, 8).map((c) => ({ name: c.country, value: c.count }))}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                      label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                    >
                      {data.topCountries.slice(0, 8).map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--background))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                      formatter={(value) => [((value as number) || 0).toLocaleString(), "Sessions"] as const}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Country Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.topCountries.slice(0, 15).map((country, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-muted-foreground">{index + 1}.</span>
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{country.country}</span>
                    </div>
                    <span className="text-sm font-medium">{country.count.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "tech" && data && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-4 w-4" />
                Browsers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.topBrowsers.slice(0, 10).map((browser, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-muted-foreground">{index + 1}.</span>
                      <span className="font-medium">{browser.browser}</span>
                    </div>
                    <span className="text-sm font-medium">{browser.count.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-4 w-4" />
                Devices
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.topDevices.slice(0, 10).map((device, index) => {
                  const Icon = device.device === "Mobile" ? Smartphone : device.device === "Tablet" ? Tablet : Monitor;
                  return (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-muted-foreground">{index + 1}.</span>
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{device.device}</span>
                      </div>
                      <span className="text-sm font-medium">{device.count.toLocaleString()}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                OS Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {["Windows", "macOS", "iOS", "Android", "Linux", "Other"].map((os, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-muted-foreground">{index + 1}.</span>
                      <span className="font-medium">{os}</span>
                    </div>
                    <span className="text-sm font-medium text-muted-foreground">—</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t">
        <p className="text-sm text-muted-foreground">
          Data updated {format(new Date(), "MMM d, yyyy HH:mm")}
        </p>
        <Button variant="outline" size="sm" onClick={fetchAnalytics}>
          Refresh
        </Button>
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  icon,
  change,
  changeType,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  change?: string;
  changeType?: "increase" | "decrease";
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className="text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change && (
          <p className={`text-xs mt-1 ${changeType === "increase" ? "text-green-600" : "text-red-600"}`}>
            {change} vs last period
          </p>
        )}
      </CardContent>
    </Card>
  );
}