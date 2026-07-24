"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { format, formatDistanceToNow } from "date-fns";
import {
  Users,
  Globe,
  Monitor,
  Smartphone,
  Tablet,
  MapPin,
  Clock,
  MousePointer,
  Activity,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Session {
  id: string;
  sessionToken: string;
  userId: string | null;
  ip: string | null;
  userAgent: string | null;
  referrer: string | null;
  device: string | null;
  browser: string | null;
  os: string | null;
  country: string | null;
  city: string | null;
  startedAt: string;
  endedAt: string | null;
  duration: number | null;
  pageViews: number;
  eventsCount: number;
  isActive: boolean;
  user: {
    id: string;
    email: string;
    name: string | null;
    image: string | null;
  } | null;
  pageViewsRel: Array<{
    id: string;
    path: string;
    title: string | null;
    enteredAt: string;
    exitedAt: string | null;
    duration: number | null;
  }>;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface SessionsResponse {
  sessions: Session[];
  pagination: Pagination;
}

export function SessionsContent({ user }: { user: { id: string; name: string | null; email: string } }) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [filters, setFilters] = useState({
    status: "all",
    search: "",
    dateFrom: "",
    dateTo: "",
  });
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        status: filters.status,
      });
      if (filters.search) params.set("search", filters.search);
      if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
      if (filters.dateTo) params.set("dateTo", filters.dateTo);

      const response = await fetch(`/api/sessions?${params}`);
      if (!response.ok) throw new Error("Failed to fetch sessions");
      const data: SessionsResponse = await response.json();
      setSessions(data.sessions);
      setPagination(data.pagination);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load sessions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [pagination.page, filters.status, filters.search, filters.dateFrom, filters.dateTo]);

  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, page }));
  };

  const getDeviceIcon = (device: string | null) => {
    switch (device) {
      case "Mobile":
        return <Smartphone className="h-4 w-4 text-muted-foreground" />;
      case "Tablet":
        return <Tablet className="h-4 w-4 text-muted-foreground" />;
      default:
        return <Monitor className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getBrowserIcon = () => <Monitor className="h-4 w-4 text-muted-foreground" />;

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "—";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  };

  const openSessionDetail = (session: Session) => {
    setSelectedSession(session);
  };

  const closeSessionDetail = () => {
    setSelectedSession(null);
  };

  if (loading && sessions.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Sessions</h1>
          <div className="flex gap-2">
            <Input placeholder="Search sessions..." className="w-64" disabled />
            <Select value="all" onValueChange={(v) => {}} disabled>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="ended">Ended</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="h-4 bg-muted animate-pulse rounded w-3/4 mb-2" />
                <div className="h-8 bg-muted animate-pulse rounded w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive mb-4">{error}</p>
        <Button onClick={fetchSessions}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Sessions</h1>
          <p className="text-muted-foreground">View and analyze user sessions</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search sessions..."
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              className="pl-9 w-64"
            />
          </div>
          <Select value={filters.status} onValueChange={(v) => handleFilterChange("status", v)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sessions</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="ended">Ended</SelectItem>
            </SelectContent>
          </Select>
          <Input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
            className="w-40"
            placeholder="From"
          />
          <Input
            type="date"
            value={filters.dateTo}
            onChange={(e) => handleFilterChange("dateTo", e.target.value)}
            className="w-40"
            placeholder="To"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {sessions.map((session) => (
          <Card
            key={session.id}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => openSessionDetail(session)}
          >
            <CardContent className="pt-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    {session.user?.image ? (
                      <img src={session.user.image} alt="" className="h-10 w-10 rounded-full" />
                    ) : (
                      <span className="text-sm font-medium text-primary">
                        {session.user?.name?.charAt(0) || session.user?.email?.charAt(0) || "?"}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="font-medium truncate max-w-[200px]">
                      {session.user?.name || session.user?.email || "Anonymous"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {session.isActive ? (
                        <span className="flex items-center gap-1 text-green-600">
                          <span className="h-1.5 w-1.5 rounded-full bg-green-600 animate-pulse" />
                          Active
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Ended</span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{formatDistanceToNow(new Date(session.startedAt), { addSuffix: true })}</p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-1 text-muted-foreground">
                  {getDeviceIcon(session.device)}
                  <span>{session.device || "—"}</span>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  {getBrowserIcon()}
                  <span>{session.browser || "—"}</span>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  <span>{session.city || session.country || "—"}</span>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>{formatDuration(session.duration)}</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t flex justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <MousePointer className="h-3 w-3" />
                  <span>{session.pageViews}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Activity className="h-3 w-3" />
                  <span>{session.eventsCount}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {sessions.length === 0 && (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-1">No sessions found</h3>
          <p className="text-muted-foreground">Try adjusting your filters or wait for new sessions</p>
        </div>
      )}

      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page === pagination.totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {selectedSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-background rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Session Details</h2>
              <Button variant="ghost" size="icon" onClick={closeSessionDetail}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[calc(90vh-80px)]">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h3 className="font-medium mb-2">User Info</h3>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Name</dt>
                      <dd className="font-medium">{selectedSession.user?.name || "Anonymous"}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Email</dt>
                      <dd className="font-medium">{selectedSession.user?.email || "N/A"}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">User ID</dt>
                      <dd className="font-medium font-mono text-xs">{selectedSession.user?.id || selectedSession.userId}</dd>
                    </div>
                  </dl>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Session Info</h3>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Session ID</dt>
                      <dd className="font-medium font-mono text-xs">{selectedSession.id}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Started</dt>
                      <dd className="font-medium">{format(new Date(selectedSession.startedAt), "PPpp")}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Ended</dt>
                      <dd className="font-medium">
                        {selectedSession.endedAt ? format(new Date(selectedSession.endedAt), "PPpp") : "Active"}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Duration</dt>
                      <dd className="font-medium">{formatDuration(selectedSession.duration)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Page Views</dt>
                      <dd className="font-medium">{selectedSession.pageViews}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Events</dt>
                      <dd className="font-medium">{selectedSession.eventsCount}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">IP</dt>
                      <dd className="font-medium font-mono text-xs">{selectedSession.ip || "—"}</dd>
                    </div>
                  </dl>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Device & Browser</h3>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Device</dt>
                      <dd className="font-medium flex items-center gap-2">{getDeviceIcon(selectedSession.device)} {selectedSession.device || "—"}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Browser</dt>
                      <dd className="font-medium flex items-center gap-2">{getBrowserIcon()} {selectedSession.browser || "—"}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">OS</dt>
                      <dd className="font-medium">{selectedSession.os || "—"}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">User Agent</dt>
                      <dd className="font-medium font-mono text-xs truncate max-w-[200px]">{selectedSession.userAgent || "—"}</dd>
                    </div>
                  </dl>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Location</h3>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Country</dt>
                      <dd className="font-medium flex items-center gap-2"><Globe className="h-3 w-3" /> {selectedSession.country || "—"}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">City</dt>
                      <dd className="font-medium flex items-center gap-2"><MapPin className="h-3 w-3" /> {selectedSession.city || "—"}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Referrer</dt>
                      <dd className="font-medium font-mono text-xs truncate max-w-[200px]">{selectedSession.referrer || "Direct"}</dd>
                    </div>
                  </dl>
                </div>
              </div>

              {selectedSession.pageViewsRel.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-medium mb-3">Page Views</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-left text-muted-foreground">
                          <th className="pb-2 px-2">Page</th>
                          <th className="pb-2 px-2">Title</th>
                          <th className="pb-2 px-2">Entered</th>
                          <th className="pb-2 px-2">Exited</th>
                          <th className="pb-2 px-2">Duration</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedSession.pageViewsRel.map((pv, index) => (
                          <tr key={index} className="border-b hover:bg-accent/50">
                            <td className="py-2 px-2 font-mono text-primary">{pv.path}</td>
                            <td className="py-2 px-2">{pv.title || "—"}</td>
                            <td className="py-2 px-2">{format(new Date(pv.enteredAt), "HH:mm:ss")}</td>
                            <td className="py-2 px-2">{pv.exitedAt ? format(new Date(pv.exitedAt), "HH:mm:ss") : "Active"}</td>
                            <td className="py-2 px-2">{pv.duration ? formatDuration(pv.duration) : "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}