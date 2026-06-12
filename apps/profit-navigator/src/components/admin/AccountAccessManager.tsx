import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { usePnAccountAccess, usePnAccountOwners, useEmployees } from "@/hooks/useSupabaseData";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useToast } from "@/hooks/use-toast";
import { ShieldCheck, Users, Search, UserPlus } from "lucide-react";

export function AccountAccessManager() {
  const { employee } = useSupabaseAuth();
  const { data: owners } = usePnAccountOwners();
  const { data: accessGrants, allAccounts, allAccountsLoading, grantAccess, revokeAccess, loading: grantsLoading } = usePnAccountAccess();
  const { data: employees } = useEmployees();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null); // employee_id being toggled

  const filteredAccounts = useMemo(() => {
    const q = search.toLowerCase();
    return allAccounts.filter(a => a.name.toLowerCase().includes(q));
  }, [allAccounts, search]);

  const selectedAccountName = allAccounts.find(a => a.id === selectedAccount)?.name ?? "";

  // For the selected account: who has access?
  const ownerIds = useMemo(
    () => owners.filter(o => o.account_id === selectedAccount).map(o => o.employee_id),
    [owners, selectedAccount]
  );
  const grantedIds = useMemo(
    () => accessGrants.filter(g => g.account_id === selectedAccount).map(g => g.employee_id),
    [accessGrants, selectedAccount]
  );

  // Non-owner employees that can be granted/revoked
  const eligibleEmployees = useMemo(
    () => employees.filter(e => !ownerIds.includes(e.id)),
    [employees, ownerIds]
  );

  async function toggleAccess(empId: string, currentlyGranted: boolean) {
    if (!selectedAccount || !employee) return;
    setSaving(empId);
    try {
      if (currentlyGranted) {
        await revokeAccess(selectedAccount, empId);
        toast({ title: "Access revoked" });
      } else {
        await grantAccess(selectedAccount, empId, employee.id);
        toast({ title: "Access granted" });
      }
    } catch (err: any) {
      toast({ title: "Error", description: err?.message, variant: "destructive" });
    } finally {
      setSaving(null);
    }
  }

  async function grantAll() {
    if (!selectedAccount || !employee) return;
    setSaving("bulk");
    try {
      for (const emp of eligibleEmployees) {
        if (!grantedIds.includes(emp.id)) {
          await grantAccess(selectedAccount, emp.id, employee.id);
        }
      }
      toast({ title: "Access granted to all employees" });
    } catch (err: any) {
      toast({ title: "Error", description: err?.message, variant: "destructive" });
    } finally {
      setSaving(null);
    }
  }

  async function revokeAll() {
    if (!selectedAccount) return;
    setSaving("bulk");
    try {
      for (const empId of grantedIds) {
        await revokeAccess(selectedAccount, empId);
      }
      toast({ title: "All non-owner access revoked" });
    } catch (err: any) {
      toast({ title: "Error", description: err?.message, variant: "destructive" });
    } finally {
      setSaving(null);
    }
  }

  if (allAccountsLoading || grantsLoading) {
    return (
      <div className="glass-card p-8 text-center text-sm text-muted-foreground">
        Loading access data…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="glass-card p-4">
        <div className="flex items-start gap-3">
          <ShieldCheck className="h-5 w-5 text-primary mt-0.5 shrink-0" />
          <div className="text-sm text-muted-foreground">
            <p className="font-medium text-foreground mb-1">How account visibility works</p>
            <ul className="space-y-0.5 list-disc list-inside">
              <li>New accounts are visible to their creator and all admins by default.</li>
              <li>Admins can grant view access to specific employees below.</li>
              <li>Owners cannot have their own access revoked — only granted access can be removed.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Account list */}
      <div className="glass-card overflow-hidden">
        <div className="px-5 py-4 border-b flex items-center gap-3" style={{ borderColor: "var(--glass-border)" }}>
          <h3 className="text-sm font-semibold flex-1">All Accounts</h3>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search accounts…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="h-8 pl-8 text-xs w-52"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full data-table">
            <thead>
              <tr>
                <th>Account</th>
                <th>Country</th>
                <th>Owner</th>
                <th className="text-center">Granted Access</th>
                <th className="text-right">Manage</th>
              </tr>
            </thead>
            <tbody>
              {filteredAccounts.map(acc => {
                const accOwners = owners.filter(o => o.account_id === acc.id);
                const accGrants = accessGrants.filter(g => g.account_id === acc.id);
                const ownerNames = accOwners.map(o => employees.find(e => e.id === o.employee_id)?.name ?? o.employee_id);
                return (
                  <tr key={acc.id}>
                    <td className="font-medium">{acc.name}</td>
                    <td className="text-muted-foreground text-sm">{acc.country ?? "—"}</td>
                    <td>
                      {ownerNames.length > 0
                        ? ownerNames.map(n => (
                          <Badge key={n} variant="secondary" className="text-[10px] mr-1">{n}</Badge>
                        ))
                        : <span className="text-xs text-muted-foreground">Unknown</span>
                      }
                    </td>
                    <td className="text-center">
                      {accGrants.length > 0 ? (
                        <Badge variant="outline" className="text-[10px]">
                          <Users className="h-2.5 w-2.5 mr-1" />
                          {accGrants.length} employee{accGrants.length !== 1 ? "s" : ""}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">Owners only</span>
                      )}
                    </td>
                    <td className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => setSelectedAccount(acc.id)}
                      >
                        <UserPlus className="h-3 w-3 mr-1" /> Manage
                      </Button>
                    </td>
                  </tr>
                );
              })}
              {filteredAccounts.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-muted-foreground text-sm">
                    {search ? `No accounts matching "${search}"` : "No accounts found."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Per-account access dialog */}
      {selectedAccount && (
        <Dialog open onOpenChange={open => { if (!open) setSelectedAccount(null); }}>
          <DialogContent className="max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Manage Access — {selectedAccountName}
              </DialogTitle>
            </DialogHeader>

            <div className="flex items-center justify-between py-2">
              <p className="text-xs text-muted-foreground">
                Check employees who should be able to view this account and its projects.
              </p>
              <div className="flex gap-1.5 shrink-0">
                <Button variant="outline" size="sm" className="h-7 text-xs" onClick={grantAll} disabled={saving === "bulk"}>
                  All
                </Button>
                <Button variant="outline" size="sm" className="h-7 text-xs text-destructive" onClick={revokeAll} disabled={saving === "bulk"}>
                  None
                </Button>
              </div>
            </div>

            {/* Owners section */}
            {ownerIds.length > 0 && (
              <div className="space-y-1 pb-3 border-b" style={{ borderColor: "var(--glass-border)" }}>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Account Owner (permanent access)</p>
                {ownerIds.map(oid => {
                  const emp = employees.find(e => e.id === oid);
                  return (
                    <div key={oid} className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-muted/20">
                      <Checkbox checked disabled />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{emp?.name ?? oid}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{emp?.email}</p>
                      </div>
                      <Badge variant="secondary" className="text-[10px] shrink-0">Owner</Badge>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Eligible employees */}
            <div className="flex-1 overflow-y-auto space-y-1 py-1">
              {eligibleEmployees.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No other employees to manage.</p>
              ) : (
                eligibleEmployees.map(emp => {
                  const isGranted = grantedIds.includes(emp.id);
                  const isSaving = saving === emp.id;
                  return (
                    <button
                      key={emp.id}
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-muted/20 transition-colors text-left"
                      onClick={() => !isSaving && toggleAccess(emp.id, isGranted)}
                      disabled={isSaving}
                    >
                      <Checkbox checked={isGranted} onCheckedChange={() => toggleAccess(emp.id, isGranted)} disabled={isSaving} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{emp.name}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{emp.email}</p>
                      </div>
                      {isSaving && <span className="text-[10px] text-muted-foreground shrink-0">Saving…</span>}
                    </button>
                  );
                })
              )}
            </div>

            <DialogFooter className="pt-3 border-t" style={{ borderColor: "var(--glass-border)" }}>
              <Button variant="outline" size="sm" onClick={() => setSelectedAccount(null)}>
                Done
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
