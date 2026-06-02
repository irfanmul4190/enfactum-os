import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { useEmployee } from "@/hooks/useEmployee";
import { TopBar } from "@/components/TopBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Plus, Trash2, Save, Send, Upload, FileText, X } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import type { Deal, Account, EmployeeOption, Deliverable, ContractType } from "@/lib/types";

const CONTRACT_TYPES: ContractType[] = ["MSA", "SOW", "NDA", "Amendment", "PO", "Other"];

const DEMO_DEALS: Deal[] = [
  { id: "d1", title: "Acme Digital Transformation", account_id: "a1", account_name: "Acme Corp" },
  { id: "d2", title: "TechStart Mobile Project", account_id: "a2", account_name: "TechStart Inc" },
  { id: "d3", title: "FinServ Data Platform", account_id: "a3", account_name: "FinServ Ltd" },
];

const DEMO_ACCOUNTS: Account[] = [
  { id: "a1", name: "Acme Corp" },
  { id: "a2", name: "TechStart Inc" },
  { id: "a3", name: "FinServ Ltd" },
  { id: "a4", name: "Globex Corporation" },
];

const DEMO_EMPLOYEES: EmployeeOption[] = [
  { id: "e1", name: "Rahul Sharma", email: "rahul@enfactum.com" },
  { id: "e2", name: "Priya Patel", email: "priya@enfactum.com" },
  { id: "e3", name: "Demo User", email: "demo@enfactum.com" },
];

const ContractNew = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { employee } = useEmployee();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  // Form state — initialized from query params (templates)
  const [title, setTitle] = useState(searchParams.get("title") ?? "");
  const [type, setType] = useState<string>(searchParams.get("type") ?? "");
  const [dealId, setDealId] = useState<string>("");
  const [accountId, setAccountId] = useState<string>("");
  const [value, setValue] = useState("");
  const [paymentTerms, setPaymentTerms] = useState(searchParams.get("paymentTerms") ?? "");
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [autoRenew, setAutoRenew] = useState(searchParams.get("autoRenew") === "true");
  const [renewalDate, setRenewalDate] = useState<Date | undefined>();
  const [scopeSummary, setScopeSummary] = useState(searchParams.get("scopeSummary") ?? "");
  const [deliverables, setDeliverables] = useState<Deliverable[]>(() => {
    const raw = searchParams.get("deliverables");
    if (raw) {
      try { return JSON.parse(raw); } catch { /* ignore */ }
    }
    return [{ title: "", description: "" }];
  });
  const [enfactumSignerId, setEnfactumSignerId] = useState<string>("");
  const [clientSignerName, setClientSignerName] = useState("");
  const [clientSignerEmail, setClientSignerEmail] = useState("");
  const [internalNotes, setInternalNotes] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Searchable data
  const [dealSearch, setDealSearch] = useState("");
  const [accountSearch, setAccountSearch] = useState("");
  const [signerSearch, setSignerSearch] = useState("");

  // Fetch deals
  const { data: deals = [] } = useQuery<Deal[]>({
    queryKey: ["deals"],
    queryFn: async () => {
      if (!isSupabaseConfigured) return DEMO_DEALS;
      const { data, error } = await supabase
        .from("deals")
        .select("id, title, account_id")
        .order("title");
      if (error) throw error;
      return (data ?? []).map((d: any) => ({
        id: d.id,
        title: d.title,
        account_id: d.account_id,
        account_name: null,
      }));
    },
  });

  // Fetch accounts
  const { data: accounts = [] } = useQuery<Account[]>({
    queryKey: ["accounts"],
    queryFn: async () => {
      if (!isSupabaseConfigured) return DEMO_ACCOUNTS;
      const { data, error } = await supabase
        .from("accounts")
        .select("id, name")
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  // Fetch employees
  const { data: employees = [] } = useQuery<EmployeeOption[]>({
    queryKey: ["employees"],
    queryFn: async () => {
      if (!isSupabaseConfigured) return DEMO_EMPLOYEES;
      const { data, error } = await supabase
        .from("employees")
        .select("id, name, email")
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  // Auto-fill account when deal is selected
  useEffect(() => {
    if (dealId) {
      const deal = deals.find((d) => d.id === dealId);
      if (deal?.account_id) setAccountId(deal.account_id);
    }
  }, [dealId, deals]);

  // Deliverable management
  const addDeliverable = () =>
    setDeliverables((prev) => [...prev, { title: "", description: "" }]);
  const removeDeliverable = (index: number) =>
    setDeliverables((prev) => prev.filter((_, i) => i !== index));
  const updateDeliverable = (index: number, field: keyof Deliverable, val: string) =>
    setDeliverables((prev) =>
      prev.map((d, i) => (i === index ? { ...d, [field]: val } : d))
    );

  // Filtered lists for searchable selects
  const filteredDeals = deals.filter(
    (d) =>
      d.title.toLowerCase().includes(dealSearch.toLowerCase()) ||
      (d.account_name && d.account_name.toLowerCase().includes(dealSearch.toLowerCase()))
  );
  const filteredAccounts = accounts.filter((a) =>
    a.name.toLowerCase().includes(accountSearch.toLowerCase())
  );
  const filteredEmployees = employees.filter(
    (e) =>
      e.name.toLowerCase().includes(signerSearch.toLowerCase()) ||
      e.email.toLowerCase().includes(signerSearch.toLowerCase())
  );

  const handleSave = useCallback(
    async (status: "draft" | "internal_review") => {
      if (!title.trim()) {
        toast({ title: "Title is required", variant: "destructive" });
        return;
      }
      if (!type) {
        toast({ title: "Contract type is required", variant: "destructive" });
        return;
      }

      setSaving(true);

      // Upload file if present. The bucket is private; we store the storage
      // path in `file_url` and sign it on demand at render time.
      let filePath: string | null = null;
      if (uploadedFile && isSupabaseConfigured) {
        setUploading(true);
        const ext = uploadedFile.name.split(".").pop();
        const path = `${crypto.randomUUID()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("contract-documents")
          .upload(path, uploadedFile);
        setUploading(false);
        if (uploadError) {
          toast({ title: "File upload failed", description: uploadError.message, variant: "destructive" });
          setSaving(false);
          return;
        }
        filePath = path;
      }

      const cleanDeliverables = deliverables.filter((d) => d.title.trim());
      const contractData = {
        title: title.trim(),
        type,
        status,
        deal_id: dealId || null,
        account_id: accountId || null,
        owner_id: employee?.id || null,
        value: value ? parseFloat(value) : null,
        currency: "SGD",
        payment_terms: paymentTerms.trim() || null,
        start_date: startDate ? format(startDate, "yyyy-MM-dd") : null,
        end_date: endDate ? format(endDate, "yyyy-MM-dd") : null,
        auto_renew: autoRenew,
        renewal_date: autoRenew && renewalDate ? format(renewalDate, "yyyy-MM-dd") : null,
        scope_summary: scopeSummary.trim() || null,
        deliverables: cleanDeliverables.length > 0 ? cleanDeliverables : null,
        enfactum_signer_id: enfactumSignerId || null,
        client_signer_name: clientSignerName.trim() || null,
        client_signer_email: clientSignerEmail.trim() || null,
        internal_notes: internalNotes.trim() || null,
        file_url: filePath,
      };

      if (!isSupabaseConfigured) {
        // Demo mode — simulate success
        toast({
          title: status === "draft" ? "Draft saved" : "Sent for review",
          description: `"${title}" has been saved.`,
        });
        setSaving(false);
        navigate("/contracts/demo-id");
        return;
      }

      try {
        const { data, error } = await supabase
          .from("contracts")
          .insert(contractData as any)
          .select("id")
          .single();

        if (error) throw error;

        // Log event
        await supabase.from("events").insert({
          module: "enforge",
          entity_type: "contract",
          entity_id: data.id,
          event_type: "contract.created",
          payload: { title: contractData.title, type: contractData.type, status, value: contractData.value },
          actor_id: employee?.id || null,
        });

        toast({
          title: status === "draft" ? "Draft saved" : "Sent for review",
          description: `"${title}" has been created.`,
        });
        navigate(`/contracts/${data.id}`);
      } catch (err: any) {
        console.error("Failed to create contract:", err);
        toast({
          title: "Error creating contract",
          description: err.message,
          variant: "destructive",
        });
      } finally {
        setSaving(false);
      }
    },
    [
      title, type, dealId, accountId, employee, value, paymentTerms,
      startDate, endDate, autoRenew, renewalDate, scopeSummary,
      deliverables, enfactumSignerId, clientSignerName, clientSignerEmail,
      internalNotes, uploadedFile, navigate, toast,
    ]
  );

  return (
    <>
      <TopBar title="New Contract" />
      <main className="flex-1 p-6 space-y-6 max-w-4xl">
        {/* Section 1 — Basics */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Basics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="e.g., MSA — Acme Corp"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Type *</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select contract type" />
                </SelectTrigger>
                <SelectContent>
                  {CONTRACT_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Link to Deal</Label>
              <Select value={dealId} onValueChange={setDealId}>
                <SelectTrigger>
                  <SelectValue placeholder="Search deals…" />
                </SelectTrigger>
                <SelectContent>
                  <div className="p-2">
                    <Input
                      placeholder="Search deals…"
                      value={dealSearch}
                      onChange={(e) => setDealSearch(e.target.value)}
                      className="h-8"
                    />
                  </div>
                  {filteredDeals.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.title}{d.account_name ? ` — ${d.account_name}` : ""}
                    </SelectItem>
                  ))}
                  {filteredDeals.length === 0 && (
                    <p className="text-sm text-muted-foreground p-2">No deals found</p>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Account</Label>
              <Select value={accountId} onValueChange={setAccountId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select account…" />
                </SelectTrigger>
                <SelectContent>
                  <div className="p-2">
                    <Input
                      placeholder="Search accounts…"
                      value={accountSearch}
                      onChange={(e) => setAccountSearch(e.target.value)}
                      className="h-8"
                    />
                  </div>
                  {filteredAccounts.map((a) => (
                    <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                  ))}
                  {filteredAccounts.length === 0 && (
                    <p className="text-sm text-muted-foreground p-2">No accounts found</p>
                  )}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Section 2 — Commercial Terms */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Commercial Terms</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="value">Contract Value (SGD)</Label>
                <Input
                  id="value"
                  type="number"
                  placeholder="e.g., 5000000"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="paymentTerms">Payment Terms</Label>
                <Input
                  id="paymentTerms"
                  placeholder="e.g., Net 30"
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <DatePickerField
                label="Start Date"
                date={startDate}
                onSelect={setStartDate}
              />
              <DatePickerField
                label="End Date"
                date={endDate}
                onSelect={setEndDate}
              />
            </div>

            <div className="flex items-center gap-3">
              <Switch
                checked={autoRenew}
                onCheckedChange={setAutoRenew}
                id="autoRenew"
              />
              <Label htmlFor="autoRenew">Auto-Renew</Label>
            </div>

            {autoRenew && (
              <DatePickerField
                label="Renewal Date"
                date={renewalDate}
                onSelect={setRenewalDate}
              />
            )}
          </CardContent>
        </Card>

        {/* Section 3 — Scope & Deliverables */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Scope & Deliverables</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="scope">Scope Summary</Label>
              <Textarea
                id="scope"
                placeholder="Describe the scope of this contract…"
                value={scopeSummary}
                onChange={(e) => setScopeSummary(e.target.value)}
                rows={4}
              />
            </div>

            <div className="space-y-3">
              <Label>Key Deliverables</Label>
              {deliverables.map((d, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <div className="flex-1 space-y-2">
                    <Input
                      placeholder="Deliverable title"
                      value={d.title}
                      onChange={(e) => updateDeliverable(i, "title", e.target.value)}
                    />
                    <Input
                      placeholder="Description (optional)"
                      value={d.description || ""}
                      onChange={(e) => updateDeliverable(i, "description", e.target.value)}
                    />
                  </div>
                  {deliverables.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeDeliverable(i)}
                      className="mt-1 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addDeliverable} className="gap-1">
                <Plus className="h-3 w-3" /> Add Deliverable
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Section 4 — Signatories */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Signatories</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Enfactum Signer</Label>
              <Select value={enfactumSignerId} onValueChange={setEnfactumSignerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select signer…" />
                </SelectTrigger>
                <SelectContent>
                  <div className="p-2">
                    <Input
                      placeholder="Search employees…"
                      value={signerSearch}
                      onChange={(e) => setSignerSearch(e.target.value)}
                      className="h-8"
                    />
                  </div>
                  {filteredEmployees.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.name} ({e.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="clientName">Client Signer Name</Label>
                <Input
                  id="clientName"
                  placeholder="Full name"
                  value={clientSignerName}
                  onChange={(e) => setClientSignerName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clientEmail">Client Signer Email</Label>
                <Input
                  id="clientEmail"
                  type="email"
                  placeholder="email@company.com"
                  value={clientSignerEmail}
                  onChange={(e) => setClientSignerEmail(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 5 — Document Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Contract Document</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".pdf,.doc,.docx,.xlsx,.xls,.pptx,.txt"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  if (file.size > 20 * 1024 * 1024) {
                    toast({ title: "File too large", description: "Maximum file size is 20MB.", variant: "destructive" });
                    return;
                  }
                  setUploadedFile(file);
                }
              }}
            />
            {uploadedFile ? (
              <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30">
                <FileText className="h-5 w-5 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{uploadedFile.name}</p>
                  <p className="text-xs text-muted-foreground">{(uploadedFile.size / 1024).toFixed(0)} KB</p>
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => setUploadedFile(null)}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-border rounded-lg p-8 flex flex-col items-center gap-2 hover:border-primary/40 hover:bg-muted/20 transition-colors cursor-pointer"
              >
                <Upload className="h-8 w-8 text-muted-foreground/50" />
                <p className="text-sm font-medium">Upload contract document</p>
                <p className="text-xs text-muted-foreground">PDF, DOC, DOCX, XLSX, PPTX (max 20MB)</p>
              </button>
            )}
          </CardContent>
        </Card>

        {/* Section 6 — Internal Notes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Internal Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Notes for internal use only (not visible to client)…"
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              rows={3}
            />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-3 pb-8">
          <Button
            variant="outline"
            onClick={() => handleSave("draft")}
            disabled={saving || uploading}
            className="gap-1"
          >
            <Save className="h-4 w-4" />
            Save as Draft
          </Button>
          <Button
            onClick={() => handleSave("internal_review")}
            disabled={saving || uploading}
            className="gap-1"
          >
            <Send className="h-4 w-4" />
            Save & Send for Review
          </Button>
        </div>
      </main>
    </>
  );
};

function DatePickerField({
  label,
  date,
  onSelect,
}: {
  label: string;
  date: Date | undefined;
  onSelect: (d: Date | undefined) => void;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? format(date, "dd MMM yyyy") : "Pick a date"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={onSelect}
            initialFocus
            className="p-3 pointer-events-auto"
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

export default ContractNew;
