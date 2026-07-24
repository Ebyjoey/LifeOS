"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { format } from "date-fns";

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "increase" | "decrease";
  icon?: React.ReactNode;
}

export function MetricCard({ title, value, change, changeType, icon }: MetricCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change && (
          <p className={`text-xs mt-1 ${changeType === "increase" ? "text-green-600" : "text-red-600"}`}>
            {change}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

interface LineChartProps {
  data: Array<{ date: string; value: number; [key: string]: any }>;
  xKey: string;
  yKey: string;
  label: string;
  color?: string;
}

export function MetricLineChart({ data, xKey, yKey, label, color = "hsl(var(--primary))" }: LineChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey={xKey} tickFormatter={(value) => format(new Date(value), "MMM dd")} className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip
                formatter={(value: number) => [value.toLocaleString(), label]}
                contentStyle={{ backgroundColor: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey={yKey}
                stroke={color}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

interface BarChartProps {
  data: Array<{ name: string; value: number; [key: string]: any }>;
  xKey: string;
  yKey: string;
  label: string;
}

export function MetricBarChart({ data, xKey, yKey, label }: BarChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey={xKey} className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip
                formatter={(value: number) => [value.toLocaleString(), label]}
                contentStyle={{ backgroundColor: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }}
              />
              <Line
                type="monotone"
                dataKey={yKey}
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

interface PieChartProps {
  data: Array<{ name: string; value: number }>;
  label: string;
}

export function MetricPieChart({ data, label }: PieChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center">
          <div className="w-64 h-64 relative">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip
                  formatter={(value: number) => [value.toLocaleString(), label]}
                  contentStyle={{ backgroundColor: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2 text-sm">
            {data.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: `hsl(${index * 60}, 70%, 50%)` }} />
                <span className="flex-1">{item.name}</span>
                <span className="font-medium">{item.value.toLocaleString()}</span>
                <span className="text-muted-foreground">{(total > 0 ? (item.value / total * 100).toFixed(1) : 0)}%</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}