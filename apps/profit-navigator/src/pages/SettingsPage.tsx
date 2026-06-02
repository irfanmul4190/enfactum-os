import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Plus, Pencil, Trash2, RotateCcw, RefreshCw } from "lucide-react";
import { useDataStore } from "@/hooks/useDataStore";
import { useCurrency, CURRENCY_SYMBOLS } from "@/hooks/useCurrency";
import { payoutPresets, CURRENCIES } from "@/data/seedData";
import { fmtMoney as fmtCurrency } from "@/lib/formatters";
import { APP_VERSION } from "@/lib/version";
import type { Stakeholder, InternalResource, Vendor } from "@/data/types";
import StakeholderFormDialog from "@/components/forms/StakeholderFormDialog";
import ResourceFormDialog from "@/components/forms/ResourceFormDialog";
import VendorSettingsFormDialog from "@/components/forms/VendorSettingsFormDialog";
import { useToast } from "@/hooks/use-toast";

export default function SettingsPage() {
  const store = useDataStore();
  const { fxRates, lastUpdated, isLoading, setManualRate, refreshRates } = useCurrency();
  const { toast } = useToast();

  const [shOpen, setShOpen] = useState(false);
  const [shEdit, setShEdit] = useState<Stakeholder | null>(null);
  const [shDeleteId, setShDeleteId] = useState<string | null>(null);

  const [resOpen, setResOpen] = useState(false);
  const [resEdit, setResEdit] = useState<InternalResource | null>(null);
  const [resDeleteId, setResDeleteId] = useState<string | null>(null);

  const [venOpen, setVenOpen] = useState(false);
  const [venEdit, setVenEdit] = useState<Vendor | null>(null);
  const [venDeleteId, setVenDeleteId] = useState<string | null>(null);

  const [resetConfirm, setResetConfirm] = useState(false);

  // FX manual input state
  const [fxFrom, setFxFrom] = useState("USD");
  const [fxRate, setFxRate] = useState("");

  function handleSetRate() {
    const rate = parseFloat(fxRate);
    if (isNaN(rate) || rate <= 0) {
      toast({ title: "Invalid rate", description: "Please enter a positive number.", variant: "destructive" });
      return;
    }
    setManualRate(fxFrom, "SGD", rate);
    toast({ title: "FX rate updated", description: `${fxFrom}→SGD set to ${rate}` });
    setFxRate("");
  }

  function handleReset() {
    store.resetToSeed();
    setResetConfirm(false);
    toast({ title: "Data reset", description: "All data restored to seed values." });
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <Button variant="outline" size="sm" className="text-destructive border-destructive/30" onClick={() => setResetConfirm(true)}>
          <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Reset to Seed Data
        </Button>
      </div>

      <Tabs defaultValue="resources">
        <TabsList className="flex-wrap">
          <TabsTrigger value="resources">Internal Resources</TabsTrigger>
          <TabsTrigger value="stakeholders">Stakeholders</TabsTrigger>
          <TabsTrigger value="vendors">Vendors</TabsTrigger>
          <TabsTrigger value="presets">Payout Presets</TabsTrigger>
          <TabsTrigger value="fx">FX Rates</TabsTrigger>
        </TabsList>

        {/* ─── Resources ─── */}
        <TabsContent value="resources">
          <div className="glass-card overflow-hidden">
            <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: "var(--glass-border)" }}>
              <h3 className="text-base font-semibold">Rate Card — Internal Resources</h3>
              <button className="btn-glass" onClick={() => { setResEdit(null); setResOpen(true); }}><Plus className="h-4 w-4" />Add Resource</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Role</th>
                    <th className="text-right">Cost/hr</th>
                    <th className="text-right">Recharge/hr</th>
                    <th className="text-center">Active</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {store.resources.map(r => (
                    <tr key={r.resource_id}>
                      <td className="font-medium">{r.resource_name}</td>
                      <td className="text-muted-foreground">{r.role}</td>
                      <td className="text-right tabular-nums mono">{fmtCurrency(r.cost_rate_per_hour)}</td>
                      <td className="text-right tabular-nums mono">{fmtCurrency(r.recharge_rate_per_hour)}</td>
                      <td className="text-center">{r.active_flag ? "✓" : "—"}</td>
                      <td className="text-right">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setResEdit(r); setResOpen(true); }}><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setResDeleteId(r.resource_id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* ─── Stakeholders ─── */}
        <TabsContent value="stakeholders">
          <div className="glass-card overflow-hidden">
            <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: "var(--glass-border)" }}>
              <h3 className="text-base font-semibold">Stakeholders</h3>
              <button className="btn-glass" onClick={() => { setShEdit(null); setShOpen(true); }}><Plus className="h-4 w-4" />Add Stakeholder</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Type</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {store.stakeholders.map(s => (
                    <tr key={s.stakeholder_id}>
                      <td className="font-medium">{s.stakeholder_name}</td>
                      <td><Badge variant="secondary" className="text-xs">{s.stakeholder_type.replace(/_/g, " ")}</Badge></td>
                      <td className="text-right">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setShEdit(s); setShOpen(true); }}><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setShDeleteId(s.stakeholder_id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* ─── Vendors ─── */}
        <TabsContent value="vendors">
          <div className="glass-card overflow-hidden">
            <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: "var(--glass-border)" }}>
              <h3 className="text-base font-semibold">Vendors</h3>
              <button className="btn-glass" onClick={() => { setVenEdit(null); setVenOpen(true); }}><Plus className="h-4 w-4" />Add Vendor</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full data-table">
                <thead>
                  <tr>
                    <th>Vendor Name</th>
                    <th>Default Category</th>
                    <th>Currency</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {store.vendors.map(v => (
                    <tr key={v.vendor_id}>
                      <td className="font-medium">{v.vendor_name}</td>
                      <td className="text-muted-foreground">{v.category_default}</td>
                      <td>{v.currency_default}</td>
                      <td className="text-right">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setVenEdit(v); setVenOpen(true); }}><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setVenDeleteId(v.vendor_id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* ─── Presets (read-only) ─── */}
        <TabsContent value="presets">
          <div className="glass-card overflow-hidden">
            <div className="px-5 py-4 border-b" style={{ borderColor: "var(--glass-border)" }}>
              <h3 className="text-base font-semibold">Payout Rule Presets</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full data-table">
                <thead>
                  <tr>
                    <th>Preset Name</th>
                    <th>Model</th>
                    <th className="text-right">Value</th>
                    <th>Trigger</th>
                    <th>Cap</th>
                    <th>Floor</th>
                  </tr>
                </thead>
                <tbody>
                  {payoutPresets.map(pp => (
                    <tr key={pp.preset_id}>
                      <td className="font-medium">{pp.preset_name}</td>
                      <td><Badge variant="outline" className="text-xs">{pp.payout_model.replace(/_/g, ' ')}</Badge></td>
                      <td className="text-right tabular-nums mono">{pp.payout_model === "FIXED_AMOUNT" ? fmtCurrency(pp.payout_value) : `${pp.payout_value}%`}</td>
                      <td className="text-xs text-muted-foreground">{pp.payment_trigger.replace(/_/g, ' ')}</td>
                      <td className="text-xs text-muted-foreground">{pp.cap_type !== "NO_CAP" ? `${pp.cap_type.replace(/_/g, ' ')} ${pp.cap_value}` : "—"}</td>
                      <td className="text-xs text-muted-foreground">{pp.floor_type !== "NO_FLOOR" ? `${pp.floor_type.replace(/_/g, ' ')} ${pp.floor_value}` : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* ─── FX Rates ─── */}
        <TabsContent value="fx">
          <div className="glass-card p-5 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold">FX Rates (→ SGD)</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {lastUpdated ? `Last updated: ${lastUpdated.toLocaleString()}` : "Using default rates"}
                  {isLoading && " · Fetching live rates..."}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={refreshRates} disabled={isLoading}>
                <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} /> Refresh Rates
              </Button>
            </div>

            {/* Current rates table */}
            <div className="overflow-x-auto">
              <table className="w-full data-table text-sm">
                <thead>
                  <tr>
                    <th>Currency</th>
                    <th>Symbol</th>
                    <th className="text-right">Rate (→ 1 SGD)</th>
                  </tr>
                </thead>
                <tbody>
                  {CURRENCIES.filter(c => c !== "SGD").map(cur => {
                    const rate = fxRates[`${cur}_SGD`];
                    return (
                      <tr key={cur}>
                        <td className="font-medium">{cur}</td>
                        <td className="text-muted-foreground">{CURRENCY_SYMBOLS[cur] || cur}</td>
                        <td className="text-right tabular-nums mono">{rate ? rate.toFixed(6) : "N/A"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Manual rate input */}
            <div className="border-t pt-4" style={{ borderColor: "var(--glass-border)" }}>
              <h4 className="text-sm font-semibold mb-3">Set Manual Rate</h4>
              <div className="flex items-end gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">From Currency</label>
                  <select
                    value={fxFrom}
                    onChange={e => setFxFrom(e.target.value)}
                    className="mt-1 block w-24 rounded-md border border-input bg-background px-2 py-1.5 text-sm"
                  >
                    {CURRENCIES.filter(c => c !== "SGD").map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">→ SGD Rate</label>
                  <Input
                    type="number"
                    step="0.0001"
                    placeholder="e.g. 1.35"
                    value={fxRate}
                    onChange={e => setFxRate(e.target.value)}
                    className="mt-1 w-32"
                  />
                </div>
                <Button size="sm" onClick={handleSetRate}>Set Rate</Button>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Version Footer */}
      <p className="text-[10px] text-muted-foreground text-center">{APP_VERSION}</p>

      {/* ─── Dialogs ─── */}
      <StakeholderFormDialog open={shOpen} onOpenChange={setShOpen} stakeholder={shEdit} onSave={data => shEdit ? store.updateStakeholder(shEdit.stakeholder_id, data) : store.addStakeholder(data)} />
      <ResourceFormDialog open={resOpen} onOpenChange={setResOpen} resource={resEdit} onSave={data => resEdit ? store.updateResource(resEdit.resource_id, data) : store.addResource(data)} />
      <VendorSettingsFormDialog open={venOpen} onOpenChange={setVenOpen} vendor={venEdit} onSave={data => venEdit ? store.updateVendor(venEdit.vendor_id, data) : store.addVendor(data)} />

      {/* Delete confirmations */}
      <AlertDialog open={!!shDeleteId} onOpenChange={() => setShDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete Stakeholder?</AlertDialogTitle><AlertDialogDescription>This cannot be undone.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { store.deleteStakeholder(shDeleteId!); setShDeleteId(null); }}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={!!resDeleteId} onOpenChange={() => setResDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete Resource?</AlertDialogTitle><AlertDialogDescription>This cannot be undone.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { store.deleteResource(resDeleteId!); setResDeleteId(null); }}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={!!venDeleteId} onOpenChange={() => setVenDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete Vendor?</AlertDialogTitle><AlertDialogDescription>This cannot be undone.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { store.deleteVendor(venDeleteId!); setVenDeleteId(null); }}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset Confirmation */}
      <AlertDialog open={resetConfirm} onOpenChange={setResetConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset to Seed Data?</AlertDialogTitle>
            <AlertDialogDescription>This will restore all data to the original 5-project seed set. Any changes you've made will be lost.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleReset} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Reset All Data</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
