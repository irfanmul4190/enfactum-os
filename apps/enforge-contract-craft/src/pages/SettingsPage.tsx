import { useState, useEffect, useCallback } from "react";
import { TopBar } from "@/components/TopBar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useEmployee } from "@/hooks/useEmployee";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { User, Bell, Settings, Shield, Pencil, Check, X } from "lucide-react";

interface UserSettings {
  notify_status_changes: boolean;
  notify_expiring_contracts: boolean;
  notify_new_assignments: boolean;
  notify_weekly_digest: boolean;
  currency: string;
  date_format: string;
  default_contract_duration: string;
  auto_save_drafts: boolean;
}

const DEFAULTS: UserSettings = {
  notify_status_changes: true,
  notify_expiring_contracts: true,
  notify_new_assignments: true,
  notify_weekly_digest: false,
  currency: "SGD",
  date_format: "dd/MM/yyyy",
  default_contract_duration: "12",
  auto_save_drafts: true,
};

const DEPARTMENTS = ["Engineering", "Sales", "Delivery", "Legal", "Finance", "Operations", "Marketing", "HR"];
const ROLES = ["Admin", "Director", "Manager", "Consultant", "Member", "Legal Counsel"];

const SettingsPage = () => {
  const { user, signOut, isDemo } = useAuth();
  const { employee, refreshEmployee } = useEmployee();
  const { toast } = useToast();

  const [settings, setSettings] = useState<UserSettings>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Profile editing state
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [profileRole, setProfileRole] = useState("");
  const [profileDept, setProfileDept] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // Sync profile fields when employee changes
  useEffect(() => {
    if (employee) {
      setProfileName(employee.name);
      setProfileRole(employee.role ?? "");
      setProfileDept(employee.department ?? "");
    }
  }, [employee]);

  // Load settings from DB
  useEffect(() => {
    const load = async () => {
      if (isDemo || !user?.id) {
        setLoading(false);
        return;
      }
      try {
        const { data, error } = await supabase
          .from("user_settings")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();
        if (error) throw error;
        if (data) {
          setSettings({
            notify_status_changes: data.notify_status_changes,
            notify_expiring_contracts: data.notify_expiring_contracts,
            notify_new_assignments: data.notify_new_assignments,
            notify_weekly_digest: data.notify_weekly_digest,
            currency: data.currency,
            date_format: data.date_format,
            default_contract_duration: data.default_contract_duration,
            auto_save_drafts: data.auto_save_drafts,
          });
        }
      } catch (err) {
        console.error("Failed to load settings:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.id, isDemo]);

  const handleSave = useCallback(async () => {
    if (isDemo) {
      toast({ title: "Settings saved", description: "Your preferences have been updated." });
      return;
    }
    if (!user?.id) return;

    setSaving(true);
    try {
      const payload = {
        user_id: user.id,
        ...settings,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("user_settings")
        .upsert(payload, { onConflict: "user_id" });

      if (error) throw error;
      toast({ title: "Settings saved", description: "Your preferences have been updated." });
    } catch (err: any) {
      console.error("Failed to save settings:", err);
      toast({ title: "Error saving settings", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }, [settings, user?.id, isDemo, toast]);

  const update = <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const initials = (employee?.name ?? user?.email ?? "U")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <>
      <TopBar title="Settings" />
      <main className="flex-1 p-6 overflow-auto">
        <Tabs defaultValue="profile" className="max-w-3xl space-y-6">
          <TabsList>
            <TabsTrigger value="profile" className="gap-1.5">
              <User className="h-3.5 w-3.5" /> Profile
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-1.5">
              <Bell className="h-3.5 w-3.5" /> Notifications
            </TabsTrigger>
            <TabsTrigger value="app" className="gap-1.5">
              <Settings className="h-3.5 w-3.5" /> Application
            </TabsTrigger>
          </TabsList>

          {/* ── Profile ── */}
          <TabsContent value="profile" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Your Profile</CardTitle>
                <CardDescription>Information linked to your account.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={user?.user_metadata?.avatar_url} />
                      <AvatarFallback className="text-lg bg-primary/15 text-primary">{initials}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{employee?.name ?? "—"}</p>
                      <p className="text-sm text-muted-foreground">{user?.email}</p>
                    </div>
                  </div>
                  {!editingProfile ? (
                    <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setEditingProfile(true)}>
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </Button>
                  ) : (
                    <div className="flex gap-1.5">
                      <Button
                        size="sm"
                        className="gap-1"
                        disabled={savingProfile || !profileName.trim()}
                        onClick={async () => {
                          if (!employee?.id) return;
                          setSavingProfile(true);
                          try {
                            const { error } = await supabase
                              .from("employees")
                              .update({
                                name: profileName.trim(),
                                role: profileRole.trim() || null,
                                department: profileDept.trim() || null,
                              } as any)
                              .eq("id", employee.id);
                            if (error) throw error;
                            await refreshEmployee();
                            setEditingProfile(false);
                            toast({ title: "Profile updated" });
                          } catch (err: any) {
                            toast({ title: "Failed to update profile", description: err.message, variant: "destructive" });
                          } finally {
                            setSavingProfile(false);
                          }
                        }}
                      >
                        <Check className="h-3.5 w-3.5" /> Save
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1"
                        onClick={() => {
                          setEditingProfile(false);
                          setProfileName(employee?.name ?? "");
                          setProfileRole(employee?.role ?? "");
                          setProfileDept(employee?.department ?? "");
                        }}
                      >
                        <X className="h-3.5 w-3.5" /> Cancel
                      </Button>
                    </div>
                  )}
                </div>

                <Separator />

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-muted-foreground text-xs">Name</Label>
                    {editingProfile ? (
                      <Input value={profileName} onChange={e => setProfileName(e.target.value)} maxLength={100} />
                    ) : (
                      <Input value={employee?.name ?? ""} disabled />
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-muted-foreground text-xs">Email</Label>
                    <Input value={user?.email ?? ""} disabled />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-muted-foreground text-xs">Role</Label>
                    {editingProfile ? (
                      <Select value={profileRole} onValueChange={setProfileRole}>
                        <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                        <SelectContent>
                          {ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="flex items-center gap-2 h-10">
                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                          {employee?.role ?? "—"}
                        </Badge>
                      </div>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-muted-foreground text-xs">Department</Label>
                    {editingProfile ? (
                      <Select value={profileDept} onValueChange={setProfileDept}>
                        <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                        <SelectContent>
                          {DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input value={employee?.department ?? ""} disabled />
                    )}
                  </div>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Sign Out</p>
                    <p className="text-xs text-muted-foreground">End your current session.</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={signOut}>
                    Sign Out
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Notifications ── */}
          <TabsContent value="notifications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Notification Preferences</CardTitle>
                <CardDescription>Choose which notifications you receive.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between gap-4">
                      <div className="space-y-1.5">
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-3 w-56" />
                      </div>
                      <Skeleton className="h-6 w-11 rounded-full" />
                    </div>
                  ))
                ) : ([
                  { key: "notify_status_changes" as const, label: "Contract status changes", desc: "Get notified when a contract moves to a new stage." },
                  { key: "notify_expiring_contracts" as const, label: "Expiring contracts", desc: "Alert when contracts are expiring within 30 days." },
                  { key: "notify_new_assignments" as const, label: "New assignments", desc: "Notified when a contract is assigned to you." },
                  { key: "notify_weekly_digest" as const, label: "Weekly digest", desc: "Receive a weekly summary of contract activity." },
                ]).map(({ key, label, desc }) => (
                  <div key={key} className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium">{label}</p>
                      <p className="text-xs text-muted-foreground">{desc}</p>
                    </div>
                    <Switch
                      checked={settings[key]}
                      onCheckedChange={(v) => update(key, v)}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
            <div className="flex justify-end">
              <Button onClick={handleSave} size="sm" disabled={saving}>
                {saving ? "Saving…" : "Save Preferences"}
              </Button>
            </div>
          </TabsContent>

          {/* ── Application ── */}
          <TabsContent value="app" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Application Settings</CardTitle>
                <CardDescription>Configure defaults for en·Forge.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {loading ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="space-y-1.5">
                        <Skeleton className="h-3 w-24" />
                        <Skeleton className="h-10 w-full" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Base Currency</Label>
                        <Select value={settings.currency} onValueChange={(v) => update("currency", v)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="SGD">SGD (S$)</SelectItem>
                            <SelectItem value="USD">USD ($)</SelectItem>
                            <SelectItem value="EUR">EUR (€)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Date Format</Label>
                        <Select value={settings.date_format} onValueChange={(v) => update("date_format", v)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="dd/MM/yyyy">DD/MM/YYYY</SelectItem>
                            <SelectItem value="MM/dd/yyyy">MM/DD/YYYY</SelectItem>
                            <SelectItem value="yyyy-MM-dd">YYYY-MM-DD</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Default Contract Duration</Label>
                        <Select value={settings.default_contract_duration} onValueChange={(v) => update("default_contract_duration", v)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="6">6 months</SelectItem>
                            <SelectItem value="12">12 months</SelectItem>
                            <SelectItem value="24">24 months</SelectItem>
                            <SelectItem value="36">36 months</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium">Auto-save drafts</p>
                        <p className="text-xs text-muted-foreground">Automatically save contract drafts as you edit.</p>
                      </div>
                      <Switch
                        checked={settings.auto_save_drafts}
                        onCheckedChange={(v) => update("auto_save_drafts", v)}
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Shield className="h-4 w-4" /> About
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-1">
                <p><span className="font-medium text-foreground">en·Forge</span> by Enfactum</p>
                <p>Contract & SOW Management Platform</p>
                <p className="text-xs">Version 1.0.0</p>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button onClick={handleSave} size="sm" disabled={saving}>
                {saving ? "Saving…" : "Save Settings"}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </>
  );
};

export default SettingsPage;
