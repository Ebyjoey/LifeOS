"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { format, formatDistanceToNow } from "date-fns";
import {
  Activity,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  Tag,
  MousePointer,
  Keyboard,
  ScrollText,
  Minimize,
  Maximize,
  Wifi,
  WifiOff,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ActivityType, EventCategory } from "@/generated/prisma/enums";

interface Event {
  id: string;
  userId: string;
  sessionId: string | null;
  name: string;
  category: EventCategory;
  action: string;
  label: string | null;
  value: number | null;
  metadata: Record<string, any> | null;
  timestamp: string;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
  } | null;
  session: {
    id: string;
    sessionToken: string;
  } | null;
}

interface EventsData {
  events: Event[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface User {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
}

export function EventsContent({ user }: { user: User }) {
  const [data, setData] = useState<EventsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit] = useState(25);
  const [category, setCategory] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  const categories = [
    "all",
    "UI_INTERACTION",
    "NAVIGATION",
    "FORM",
    "MEDIA",
    "ERROR",
    "PERFORMANCE",
    "CUSTOM",
  ] as const;

  useEffect(() => {
    fetchEvents();
  }, [page, category, search, dateFrom, dateTo]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (category !== "all") params.set("category", category);
      if (search) params.set("search", search);
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);

      const response = await fetch(`/api/events?${params}`);
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (error) {
      console.error("Failed to fetch events:", error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (cat: EventCategory) => {
    switch (cat) {
      case "UI_INTERACTION": return <MousePointer className="h-3 w-3" />;
      case "NAVIGATION": return <Activity className="h-3 w-3" />;
      case "FORM": return <Tag className="h-3 w-3" />;
      case "MEDIA": return <Maximize className="h-3 w-3" />;
      case "ERROR": return <WifiOff className="h-3 w-3" />;
      case "PERFORMANCE": return <Wifi className="h-3 w-3" />;
      default: return <Activity className="h-3 w-3" />;
    }
  };

  const getCategoryColor = (cat: EventCategory) => {
    switch (cat) {
      case "UI_INTERACTION": return "text-blue-500 bg-blue-500/10";
      case "NAVIGATION": return "text-green-500 bg-green-500/10";
      case "FORM": return "text-purple-500 bg-purple-500/10";
      case "MEDIA": return "text-pink-500 bg-pink-500/10";
      case "ERROR": return "text-red-500 bg-red-500/10";
      case "PERFORMANCE": return "text-orange-500 bg-orange-500/10";
      default: return "text-gray-500 bg-gray-500/10";
    }
  };

  const getActivityIcon = (type: ActivityType) => {
    switch (type) {
      case "CLICK": return <MousePointer className="h-3 w-3" />;
      case "SCROLL": return <ScrollText className="h-3 w-3" />;
      case "FORM_SUBMIT": return <Tag className="h-3 w-3" />;
      case "FORM_INTERACTION": return <Keyboard className="h-3 w-3" />;
      case "KEY_PRESS": return <Keyboard className="h-3 w-3" />;
      case "MOUSE_MOVE": return <MousePointer className="h-3 w-3" />;
      case "RESIZE": return <Maximize className="h-3 w-3" />;
      case "VISIBILITY_CHANGE": return <WifiOff className="h-3 w-3" />;
      case "PAGE_VIEW": return <Eye className="h-3 w-3" />;
      default: return <Activity className="h-3 w-3" />;
    }
  };

  if (loading && !data) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="h-4 bg-muted animate-pulse rounded w-1/4 mb-2" />
              <div className="h-3 bg-muted animate-pulse rounded w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Events</h1>
          <p className="text-muted-foreground">
            Track and analyze user interactions and custom events
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Input
                placeholder="Search events..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="max-w-xs"
              />
            </div>
            <Select value={category} onValueChange={setCategory as any}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.filter(c => c !== "all").map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat.replace("_", " ")}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-[160px]"
              placeholder="From"
            />
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-[160px]"
              placeholder="To"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b text-left text-sm text-muted-foreground">
                  <th className="pb-3 px-4">Time</th>
                  <th className="pb-3 px-4">Event</th>
                  <th className="pb-3 px-4">Category</th>
                  <th className="pb-3 px-4">Action</th>
                  <th className="pb-3 px-4">User</th>
                  <th className="pb-3 px-4">Session</th>
                  <th className="pb-3 px-4">Details</th>
                </tr>
              </thead>
              <tbody>
                {data?.events.map((event) => (
                  <tr
                    key={event.id}
                    className="border-b hover:bg-accent/50 cursor-pointer"
                    onClick={() => setSelectedEvent(event)}
                  >
                    <td className="py-3 px-4 text-sm text-muted-foreground">
                      {format(new Date(event.timestamp), "MMM d, HH:mm:ss")}
                    </td>
                    <td className="py-3 px-4 text-sm font-medium">
                      <div className="flex items-center gap-2">
                        {getActivityIcon(event.category as any)}
                        <span>{event.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
                          getCategoryColor(event.category)
                        )}
                      >
                        {getCategoryIcon(event.category)}
                        {event.category.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">
                      {event.action}
                    </td>
                    <td className="py-3 px-4 text-sm">
                      {event.user ? (
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center">
                            <span className="text-xs font-medium text-primary">
                              {event.user.name?.charAt(0) || event.user.email.charAt(0)}
                            </span>
                          </div>
                          <span>{event.user.name || event.user.email}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Anonymous</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm text-muted-foreground font-mono">
                      {event.session?.sessionToken.substring(0, 8)}...
                    </td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">
                      {event.label || (event.value !== null ? `Value: ${event.value}` : "—")}
                    </td>
                  </tr>
                ))}
                {data?.events.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-muted-foreground">
                      No events found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {data && data.pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-muted-foreground">
                Page {data.pagination.page} of {data.pagination.totalPages} ({data.pagination.total} events)
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={data.pagination.page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(data.pagination.totalPages, p + 1))}
                  disabled={data.pagination.page === data.pagination.totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-background rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Event Details</h2>
              <button
                onClick={() => setSelectedEvent(null)}
                className="p-2 hover:bg-accent rounded-md"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[70vh]">
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Event Name</label>
                    <p className="font-medium">{selectedEvent.name}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Category</label>
                    <p className="font-medium capitalize">{selectedEvent.category.toLowerCase().replace("_", " ")}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Action</label>
                    <p className="font-medium">{selectedEvent.action}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Label</label>
                    <p className="font-medium">{selectedEvent.label || "—"}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Value</label>
                    <p className="font-medium">{selectedEvent.value !== null ? selectedEvent.value : "—"}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Timestamp</label>
                    <p className="font-medium">{format(new Date(selectedEvent.timestamp), "PPpp")}</p>
                  </div>
                </div>

                {selectedEvent.user && (
                  <div className="border-t pt-4">
                    <h3 className="font-medium mb-2">User</h3>
                    <div className="grid gap-2 md:grid-cols-3">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Name</label>
                        <p>{selectedEvent.user.name || "—"}</p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Email</label>
                        <p>{selectedEvent.user.email}</p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">ID</label>
                        <p className="font-mono text-sm">{selectedEvent.user.id}</p>
                      </div>
                    </div>
                  </div>
                )}

                {selectedEvent.session && (
                  <div className="border-t pt-4">
                    <h3 className="font-medium mb-2">Session</h3>
                    <div className="grid gap-2 md:grid-cols-2">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Session ID</label>
                        <p className="font-mono text-sm">{selectedEvent.session.id}</p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Token</label>
                        <p className="font-mono text-sm">{selectedEvent.session.sessionToken}</p>
                      </div>
                    </div>
                  </div>
                )}

                {selectedEvent.metadata && Object.keys(selectedEvent.metadata).length > 0 && (
                  <div className="border-t pt-4">
                    <h3 className="font-medium mb-2">Metadata</h3>
                    <pre className="bg-muted/50 p-3 rounded text-sm overflow-auto max-h-48">
                      {JSON.stringify(selectedEvent.metadata, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}