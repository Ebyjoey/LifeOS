"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Key, Shield, Globe, Bell, Trash2, Save, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";

interface User {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
}

export function SettingsContent({ user }: { user: User }) {
  const { data: session, update } = useSession();
  const [activeTab, setActiveTab] = useState("profile");
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    name: user.name || "",
    email: user.email || "",
  });
  const [password, setPassword] = useState({
    current: "",
    new: "",
    confirm: "",
  });
  const [notifications, setNotifications] = useState({
    emailReports: true,
    emailAlerts: false,
    weeklyDigest: true,
    realtimeAlerts: false,
  });
  const [apiKeys, setApiKeys] = useState<Array<{ id: string; name: string; key: string; createdAt: string }>>([]);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      if (response.ok) {
        await update();
        showMessage("success", "Profile updated successfully");
      } else {
        const data = await response.json();
        showMessage("error", data.error || "Failed to update profile");
      }
    } catch {
      showMessage("error", "An error occurred");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.new !== password.confirm) {
      showMessage("error", "Passwords do not match");
      return;
    }
    if (password.new.length < 8) {
      showMessage("error", "Password must be at least 8 characters");
      return;
    }
    setSaving(true);
    try {
      const response = await fetch("/api/user/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current: password.current, new: password.new }),
      });
      if (response.ok) {
        setPassword({ current: "", new: "", confirm: "" });
        showMessage("success", "Password changed successfully");
      } else {
        const data = await response.json();
        showMessage("error", data.error || "Failed to change password");
      }
    } catch {
      showMessage("error", "An error occurred");
    } finally {
      setSaving(false);
    }
  };

  const handleNotificationSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const response = await fetch("/api/user/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(notifications),
      });
      if (response.ok) {
        showMessage("success", "Notifications updated");
      } else {
        showMessage("error", "Failed to update notifications");
      }
    } catch {
      showMessage("error", "An error occurred");
    } finally {
      setSaving(false);
    }
  };

  const generateApiKey = async () => {
    const name = prompt("Enter a name for this API key:");
    if (!name) return;
    try {
      const response = await fetch("/api/user/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (response.ok) {
        const data = await response.json();
        showMessage("success", `API key created: ${data.key}. Save it now!`);
        fetchApiKeys();
      }
    } catch {
      showMessage("error", "Failed to create API key");
    }
  };

  const fetchApiKeys = async () => {
    try {
      const response = await fetch("/api/user/api-keys");
      if (response.ok) {
        const data = await response.json();
        setApiKeys(data.keys);
      }
    } catch {
      console.error("Failed to fetch API keys");
    }
  };

  const deleteApiKey = async (id: string) => {
    if (!confirm("Are you sure you want to delete this API key?")) return;
    try {
      const response = await fetch(`/api/user/api-keys/${id}`, { method: "DELETE" });
      if (response.ok) {
        fetchApiKeys();
        showMessage("success", "API key deleted");
      }
    } catch {
      showMessage("error", "Failed to delete API key");
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm("This will permanently delete your account and all data. This cannot be undone. Type 'DELETE' to confirm.")) return;
    const confirmation = prompt("Type 'DELETE' to confirm:");
    if (confirmation !== "DELETE") return;
    try {
      const response = await fetch("/api/user/account", { method: "DELETE" });
      if (response.ok) {
        showMessage("success", "Account deleted");
        setTimeout(() => window.location.href = "/auth/signin", 2000);
      }
    } catch {
      showMessage("error", "Failed to delete account");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your account and preferences</p>
      </div>

      {message && (
        <div className={cn(
          "flex items-center gap-3 p-4 rounded-md border",
          message.type === "success"
            ? "border-green-500/50 bg-green-500/10 text-green-700 dark:text-green-300"
            : "border-red-500/50 bg-red-500/10 text-red-700 dark:text-red-300"
        )}>
          <span className="flex-1">{message.text}</span>
          <Button variant="ghost" size="sm" onClick={() => setMessage(null)}>
            ✕
          </Button>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="profile"><User className="h-4 w-4 mr-2" />Profile</TabsTrigger>
          <TabsTrigger value="security"><Shield className="h-4 w-4 mr-2" />Security</TabsTrigger>
          <TabsTrigger value="notifications"><Bell className="h-4 w-4 mr-2" />Notifications</TabsTrigger>
          <TabsTrigger value="api"><Key className="h-4 w-4 mr-2" />API Keys</TabsTrigger>
          <TabsTrigger value="danger"><Trash2 className="h-4 w-4 mr-2" />Danger Zone</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your personal information</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileSave} className="space-y-4 max-w-md">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    placeholder="Your name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    placeholder="your@email.com"
                  />
                </div>
                <Button type="submit" disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                  Save Changes
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>Update your password for security</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={password.current}
                    onChange={(e) => setPassword({ ...password, current: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={password.new}
                    onChange={(e) => setPassword({ ...password, new: e.target.value })}
                    minLength={8}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={password.confirm}
                    onChange={(e) => setPassword({ ...password, confirm: e.target.value })}
                  />
                </div>
                <Button type="submit" disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                  Change Password
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Two-Factor Authentication</CardTitle>
              <CardDescription>Add an extra layer of security to your account</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Authenticator App</p>
                  <p className="text-sm text-muted-foreground">Use Google Authenticator, Authy, or similar</p>
                </div>
                <Button variant="outline">Enable 2FA</Button>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Active Sessions</CardTitle>
              <CardDescription>Manage your active login sessions</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Session management coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Email Notifications</CardTitle>
              <CardDescription>Choose which emails you want to receive</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleNotificationSave} className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Weekly Analytics Digest</p>
                      <p className="text-sm text-muted-foreground">Receive a summary of your weekly analytics every Monday</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifications.weeklyDigest}
                      onChange={(e) => setNotifications({ ...notifications, weeklyDigest: e.target.checked })}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Realtime Alerts</p>
                      <p className="text-sm text-muted-foreground">Get notified immediately when anomalies are detected</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifications.realtimeAlerts}
                      onChange={(e) => setNotifications({ ...notifications, realtimeAlerts: e.target.checked })}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Monthly Reports</p>
                      <p className="text-sm text-muted-foreground">Receive detailed monthly analytics reports</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifications.emailReports}
                      onChange={(e) => setNotifications({ ...notifications, emailReports: e.target.checked })}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Security Alerts</p>
                      <p className="text-sm text-muted-foreground">Get notified about security-related events</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifications.emailAlerts}
                      onChange={(e) => setNotifications({ ...notifications, emailAlerts: e.target.checked })}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                  </div>
                </div>
                <Button type="submit" disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                  Save Preferences
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api">
          <Card>
            <CardHeader>
              <CardTitle>API Keys</CardTitle>
              <CardDescription>Manage your API keys for programmatic access</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-muted-foreground">
                  API keys allow you to access the tracking API programmatically. Keep them secure!
                </p>
                <Button onClick={generateApiKey} disabled={saving}>
                  <Key className="h-4 w-4 mr-2" />
                  Generate New Key
                </Button>
              </div>

              {apiKeys.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Key className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No API keys yet. Generate one to get started.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {apiKeys.map((key) => (
                    <div key={key.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">{key.name}</p>
                        <p className="text-sm text-muted-foreground font-mono">
                          {key.key.substring(0, 12)}...{key.key.substring(key.key.length - 4)}
                        </p>
                        <p className="text-xs text-muted-foreground">Created: {new Date(key.createdAt).toLocaleDateString()}</p>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => deleteApiKey(key.id)} className="text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="danger">
          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="text-destructive">Delete Account</CardTitle>
              <CardDescription>
                Permanently delete your account and all associated data. This action cannot be undone.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  This will permanently delete:
                </p>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                  <li>Your user account and profile</li>
                  <li>All tracked analytics data</li>
                  <li>All API keys</li>
                  <li>All sessions and events</li>
                </ul>
                <Button variant="destructive" onClick={handleDeleteAccount} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                  Delete Account Permanently
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}