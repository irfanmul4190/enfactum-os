import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  COUNTRIES, CURRENCIES, BUSINESS_TYPES,
  stakeholders as allStakeholders, payoutPresets,
} from "@/data/seedData";
import { useDataStore } from "@/hooks/useDataStore";
import type { Project } from "@/data/types";
import { useToast } from "@/hooks/use-toast";
import { fmtMoney } from "@/lib/formatters";
import { useCurrency, CURRENCY_SYMBOLS } from "@/hooks/useCurrency";
import { useProjectInterview, type SplitDraft } from "@/hooks/useProjectInterview";
import {
  Sparkles, ArrowLeft, Building2, ArrowLeftRight, Check, Send,
  CalendarIcon, SkipForward, Plus, Trash2, RotateCcw, Save, X,
} from "lucide-react";
import { format, differenceInDays, differenceInCalendarMonths } from "date-fns";
import { cn } from "@/lib/utils";

const DRAFTS_KEY = "project_wizard_drafts";

const COUNTRY_FLAGS: Record<string, string> = {
  Singapore: "🇸🇬", India: "🇮🇳", Malaysia: "🇲🇾", Indonesia: "🇮🇩",
  "United States": "🇺🇸", Philippines: "🇵🇭", Vietnam: "🇻🇳",
  Thailand: "🇹🇭", Japan: "🇯🇵", Australia: "🇦🇺", Other: "🌐",
};

const COUNTRY_CURRENCY: Record<string, string> = {
  Singapore: "SGD", Malaysia: "MYR", Indonesia: "IDR", India: "INR",
  "United States": "USD",
};

const TOP_COUNTRIES = ["Singapore", "India", "Malaysia", "Indonesia", "United States"];

export interface WizardDraft {
  id: string;
  step: number;
  basics: { project_name: string; client_id: string; description: string; country_of_delivery: string; currency: string; business_type: string; start_date: string; end_date: string };
  commercial: Record<string, any>;
  splitDrafts: SplitDraft[];
  budget: { planned_internal_hours: number; planned_vendor_budget: number; planned_other_budget: number };
  savedAt: string;
}

export function loadAllDrafts(): WizardDraft[] {
  try {
    const raw = localStorage.getItem(DRAFTS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch { return []; }
}

function saveDraftsToStorage(drafts: WizardDraft[]) {
  localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts));
}

export function deleteDraftById(id: string) {
  const drafts = loadAllDrafts().filter(d => d.id !== id);
  saveDraftsToStorage(drafts);
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  draftId?: string | null;
}

/* ═══════════════════════════════════════════════════════
   System chat bubble (left, dark)
   ═══════════════════════════════════════════════════════ */
function SystemBubble({ question, subtext, confirmation }: { question: string; subtext?: string; confirmation?: string }) {
  return (
    <div className="flex gap-2.5 items-start animate-fade-in">
      <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center shrink-0 mt-0.5">
        <Sparkles className="h-3.5 w-3.5 text-primary" />
      </div>
      <div className="space-y-1 max-w-[85%]">
        <div className="bg-secondary/80 border border-border/50 rounded-2xl rounded-tl-md px-4 py-3">
          <p className="text-sm font-medium text-foreground leading-relaxed">{question}</p>
          {subtext && <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{subtext}</p>}
        </div>
        {confirmation && (
          <div className="text-[11px] text-[hsl(var(--positive))] flex items-center gap-1 px-1">
            <Check className="h-3 w-3" /> {confirmation}
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   User answer bubble (right, accent)
   ═══════════════════════════════════════════════════════ */
function UserBubble({ displayValue, onEdit }: { displayValue: string; onEdit?: () => void }) {
  return (
    <div className="flex justify-end group animate-fade-in">
      <div className="relative max-w-[75%]">
        <div className="bg-primary/15 border border-primary/20 rounded-2xl rounded-tr-md px-4 py-2.5">
          <p className="text-sm text-foreground">{displayValue}</p>
        </div>
        {onEdit && (
          <button
            onClick={onEdit}
            className="absolute -left-16 top-1/2 -translate-y-1/2 text-[11px] text-muted-foreground hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap"
          >
            ← Change
          </button>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Preview field row
   ═══════════════════════════════════════════════════════ */
function PreviewRow({ label, value, filled }: { label: string; value: string; filled: boolean }) {
  return (
    <div className={cn(
      "flex items-center justify-between py-2 px-3 rounded-lg text-sm transition-all duration-500",
      filled ? "bg-[hsl(var(--positive)/0.05)]" : "bg-transparent"
    )}>
      <span className="text-muted-foreground text-xs">{label}</span>
      <div className="flex items-center gap-2">
        {filled && <div className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--positive))] animate-scale-in" />}
        <span className={cn(
          "text-xs font-medium tabular-nums transition-colors",
          filled ? "text-foreground" : "text-muted-foreground/40"
        )}>
          {value}
        </span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════ */
export default function ProjectWizard({ open, onOpenChange, draftId }: Props) {
  const { toast } = useToast();
  const { clients, addProject, addSplits, vendors } = useDataStore();
  const { toSGD } = useCurrency();
  const externalPartners = allStakeholders.filter(s => s.stakeholder_type === "EXTERNAL_PARTNER");

  const interview = useProjectInterview(clients[0]?.client_id);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [inputValue, setInputValue] = useState("");
  const [dateStart, setDateStart] = useState<Date | undefined>(new Date("2026-01-01"));
  const [dateEnd, setDateEnd] = useState<Date | undefined>(new Date("2026-12-31"));
  const [clientSearch, setClientSearch] = useState("");
  const [splitDrafts, setSplitDrafts] = useState<SplitDraft[]>([]);
  const [animatingQuestion, setAnimatingQuestion] = useState(false);
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);

  // Load draft on open
  useEffect(() => {
    if (open) {
      setInputValue("");
      setSplitDrafts([]);
      setAnimatingQuestion(false);
      if (draftId) {
        const drafts = loadAllDrafts();
        const found = drafts.find(d => d.id === draftId);
        if (found) {
          setCurrentDraftId(found.id);
          interview.loadFromDraft(found);
          setSplitDrafts(found.splitDrafts || []);
          toast({ title: "Draft restored", description: "Continuing from where you left off" });
          return;
        }
      }
      setCurrentDraftId(null);
      interview.reset();
    }
  }, [open, draftId]);

  // Auto-scroll on new messages
  useEffect(() => {
    if (chatEndRef.current) {
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }
  }, [interview.answerHistory.length, interview.currentIndex]);

  // Save draft on close
  const saveDraftOnClose = useCallback(() => {
    if (interview.answeredCount === 0) return;
    const id = currentDraftId || crypto.randomUUID();
    const draftData = interview.toDraft();
    const draft: WizardDraft = {
      id,
      ...draftData,
      splitDrafts,
      savedAt: new Date().toISOString(),
    };
    const existing = loadAllDrafts();
    const idx = existing.findIndex(d => d.id === id);
    if (idx >= 0) existing[idx] = draft;
    else existing.push(draft);
    saveDraftsToStorage(existing);
    if (!currentDraftId) setCurrentDraftId(id);
  }, [currentDraftId, interview, splitDrafts]);

  const handleClose = useCallback((open: boolean) => {
    if (!open) saveDraftOnClose();
    onOpenChange(open);
  }, [onOpenChange, saveDraftOnClose]);

  const saveDraftManual = useCallback(() => {
    saveDraftOnClose();
    toast({ title: "Draft saved", description: "You can close and resume later" });
  }, [saveDraftOnClose, toast]);

  const clearDraft = useCallback(() => {
    if (currentDraftId) {
      deleteDraftById(currentDraftId);
      setCurrentDraftId(null);
    }
  }, [currentDraftId]);

  /* ── Answer submission with delay animation ── */
  const submitWithDelay = useCallback((questionId: string, value: any, displayValue: string) => {
    interview.submitAnswer(questionId, value, displayValue);
    setInputValue("");
    setAnimatingQuestion(true);
    setTimeout(() => setAnimatingQuestion(false), 400);
  }, [interview]);

  /* ── Final submit ── */
  const handleCreateProject = useCallback(async () => {
    const projectData = interview.getProjectData();
    try {
      const newProject = await addProject(projectData);
      if (splitDrafts.length > 0) {
        addSplits(splitDrafts.map(s => ({ ...s, project_id: newProject.project_id })));
      }
      clearDraft();
      toast({ title: "Project created", description: `${projectData.project_name} submitted for approval` });
      onOpenChange(false);
    } catch (e: any) {
      toast({
        title: "Could not create project",
        description: e?.message ?? String(e),
        variant: "destructive",
      });
    }
  }, [interview, addProject, addSplits, splitDrafts, clearDraft, toast, onOpenChange]);

  /* ── Get display info for preview ── */
  const previewFields = useMemo(() => {
    const a = interview.answers;
    const clientName = clients.find(c => c.client_id === a.client_id)?.client_name;
    const partnerName = externalPartners.find(p => p.stakeholder_id === a.external_partner_stakeholder_id)?.stakeholder_name;
    const isPassThrough = a.commercial_model === "PARTNER_PASS_THROUGH";
    const cur = a.currency || "SGD";

    const fields: { label: string; value: string; filled: boolean }[] = [
      { label: "Project Name", value: a.project_name || "...", filled: !!a.project_name },
      { label: "Client", value: clientName || "...", filled: !!a.client_id && !!clientName },
      { label: "Country", value: a.country_of_delivery || "...", filled: !!a.country_of_delivery },
      { label: "Currency", value: cur, filled: !!a.country_of_delivery },
      { label: "Model", value: isPassThrough ? "Partner Pass-Through" : a.commercial_model ? "Enfactum-Led" : "...", filled: !!a.commercial_model },
    ];

    if (isPassThrough) {
      fields.push(
        { label: "Partner", value: partnerName || "...", filled: !!partnerName },
        { label: "Partner Revenue", value: a.partner_revenue_basis_ex_tax ? fmtMoney(a.partner_revenue_basis_ex_tax, cur) : "...", filled: !!a.partner_revenue_basis_ex_tax },
        { label: "Flat Fee", value: a.flat_fee_percent ? `${a.flat_fee_percent}%` : "...", filled: !!a.flat_fee_percent },
        { label: "Recharge", value: a.internal_recharge_applies !== undefined ? (a.internal_recharge_applies ? "Yes" : "No") : "...", filled: a.internal_recharge_applies !== undefined },
      );
    } else if (a.commercial_model) {
      fields.push(
        { label: "Revenue", value: a.contracted_revenue_ex_tax ? fmtMoney(a.contracted_revenue_ex_tax, cur) : "...", filled: !!a.contracted_revenue_ex_tax },
        { label: "Margin Target", value: a.margin_target_percent !== undefined ? `${a.margin_target_percent}%` : "...", filled: a.margin_target_percent !== undefined },
        { label: "Invoice Model", value: a.invoice_model || "...", filled: !!a.invoice_model },
      );
    }

    fields.push(
      { label: "Start Date", value: a.start_date || "...", filled: !!interview.answerHistory.find(h => h.questionId === "dates") },
      { label: "End Date", value: a.end_date || "...", filled: !!interview.answerHistory.find(h => h.questionId === "dates") },
      { label: "Business Type", value: a.business_type || "—", filled: !!a.business_type },
      { label: "Stakeholders", value: splitDrafts.length > 0 ? `${splitDrafts.length} configured` : "...", filled: splitDrafts.length > 0 },
    );

    return fields;
  }, [interview.answers, interview.answerHistory, clients, externalPartners, splitDrafts]);

  /* ── Render current input area ── */
  const currentQ = interview.currentQuestion;

  function renderInput() {
    if (!currentQ || animatingQuestion) return null;
    const qId = currentQ.id;

    // Text input
    if (currentQ.inputType === "text") {
      return (
        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            placeholder="Type your answer..."
            maxLength={150}
            className="flex-1"
            autoFocus
            onKeyDown={e => {
              if (e.key === "Enter" && inputValue.trim().length >= 3) {
                submitWithDelay(qId, inputValue.trim(), inputValue.trim());
              }
            }}
          />
          <Button
            size="icon"
            disabled={inputValue.trim().length < 3}
            onClick={() => submitWithDelay(qId, inputValue.trim(), inputValue.trim())}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      );
    }

    // Client select
    if (currentQ.inputType === "client-select") {
      const filtered = clients.filter(c =>
        c.client_name.toLowerCase().includes(clientSearch.toLowerCase())
      );
      return (
        <div className="space-y-2">
          <Input
            value={clientSearch}
            onChange={e => setClientSearch(e.target.value)}
            placeholder="Search clients..."
            className="text-sm"
            autoFocus
          />
          <div className="flex flex-wrap gap-2">
            {filtered.slice(0, 8).map(c => (
              <button
                key={c.client_id}
                onClick={() => {
                  interview.answers._clientName = c.client_name;
                  submitWithDelay(qId, c.client_id, c.client_name);
                  setClientSearch("");
                }}
                className="px-3 py-1.5 rounded-full text-xs font-medium border border-border/50 bg-secondary/50 hover:bg-primary/15 hover:border-primary/30 transition-all"
              >
                {c.client_name}
              </button>
            ))}
          </div>
        </div>
      );
    }

    // Country chips
    if (currentQ.inputType === "country-chips") {
      return (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            {TOP_COUNTRIES.map(c => (
              <button
                key={c}
                onClick={() => {
                  const cc = COUNTRY_CURRENCY[c] || "SGD";
                  submitWithDelay(qId, c, `${COUNTRY_FLAGS[c] || ""} ${c}`);
                }}
                className="px-4 py-2 rounded-xl text-sm font-medium border border-border/50 bg-secondary/50 hover:bg-primary/15 hover:border-primary/30 transition-all flex items-center gap-2"
              >
                <span className="text-base">{COUNTRY_FLAGS[c]}</span>
                {c}
              </button>
            ))}
            <button
              onClick={() => setShowCountryDropdown(!showCountryDropdown)}
              className="px-4 py-2 rounded-xl text-sm font-medium border border-border/50 bg-secondary/30 hover:bg-secondary/50 transition-all"
            >
              Other...
            </button>
          </div>
          {showCountryDropdown && (
            <div className="flex flex-wrap gap-1.5 animate-fade-in">
              {COUNTRIES.filter(c => !TOP_COUNTRIES.includes(c)).map(c => (
                <button
                  key={c}
                  onClick={() => {
                    submitWithDelay(qId, c, `${COUNTRY_FLAGS[c] || "🌐"} ${c}`);
                    setShowCountryDropdown(false);
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs border border-border/30 hover:bg-primary/10 transition-all"
                >
                  {COUNTRY_FLAGS[c] || "🌐"} {c}
                </button>
              ))}
            </div>
          )}
        </div>
      );
    }

    // Commercial model chips
    if (currentQ.inputType === "model-chips") {
      return (
        <div className="grid grid-cols-1 gap-3">
          <button
            onClick={() => submitWithDelay(qId, "ENFACTUM_LED", "🏢 Enfactum-Led")}
            className="text-left p-4 rounded-xl border-2 border-border/50 bg-secondary/30 hover:border-primary/50 hover:bg-primary/5 transition-all group"
          >
            <div className="flex items-center gap-3">
              <Building2 className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
              <div>
                <p className="font-semibold text-sm">Enfactum is leading</p>
                <p className="text-xs text-muted-foreground mt-0.5">We own the client relationship and billing</p>
              </div>
            </div>
          </button>
          <button
            onClick={() => submitWithDelay(qId, "PARTNER_PASS_THROUGH", "🤝 Partner Pass-Through")}
            className="text-left p-4 rounded-xl border-2 border-border/50 bg-secondary/30 hover:border-primary/50 hover:bg-primary/5 transition-all group"
          >
            <div className="flex items-center gap-3">
              <ArrowLeftRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
              <div>
                <p className="font-semibold text-sm">Partner Pass-Through</p>
                <p className="text-xs text-muted-foreground mt-0.5">An external partner owns the deal, Enfactum is delivering</p>
              </div>
            </div>
          </button>
        </div>
      );
    }

    // Number with currency
    if (currentQ.inputType === "number-currency") {
      const cur = interview.currency;
      const sym = CURRENCY_SYMBOLS[cur] || cur;
      const rev = interview.answers.contracted_revenue_ex_tax || 0;
      const enteredVal = Number(inputValue) || 0;
      // Show % of revenue if this IS the revenue field itself — skip; otherwise compute
      const isRevenueField = currentQ.id === "contracted_revenue_ex_tax" || currentQ.id === "partner_revenue_basis_ex_tax";
      return (
        <div className="space-y-2">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{sym}</span>
              <Input
                type="number"
                min={0}
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                placeholder="0"
                className="pl-12"
                autoFocus
                onKeyDown={e => {
                  if (e.key === "Enter" && Number(inputValue) > 0) {
                    submitWithDelay(qId, Number(inputValue), `${sym} ${Number(inputValue).toLocaleString()}`);
                  }
                }}
              />
            </div>
            <Button
              size="icon"
              disabled={!inputValue || Number(inputValue) <= 0}
              onClick={() => submitWithDelay(qId, Number(inputValue), `${sym} ${Number(inputValue).toLocaleString()}`)}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          {!isRevenueField && rev > 0 && enteredVal > 0 && (
            <p className="text-xs text-muted-foreground px-1">
              That's <span className="font-medium text-foreground">{(enteredVal / rev * 100).toFixed(1)}%</span> of contracted revenue ({fmtMoney(rev, cur)})
            </p>
          )}
        </div>
      );
    }

    // Number percent
    if (currentQ.inputType === "number-percent") {
      const rev = interview.answers.contracted_revenue_ex_tax || 0;
      const cur = interview.currency;
      const pct = Number(inputValue) || 40;
      return (
        <div className="space-y-2">
          <div className="flex gap-2 items-center">
            <div className="relative flex-1">
              <Input
                type="number"
                min={0}
                max={100}
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                placeholder="40"
                className="pr-8"
                autoFocus
                onKeyDown={e => {
                  if (e.key === "Enter") {
                    const v = Number(inputValue) || 40;
                    submitWithDelay(qId, v, `${v}%`);
                  }
                }}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
            </div>
            <button
              onClick={() => {
                setInputValue("40");
                submitWithDelay(qId, 40, "40%");
              }}
              className="px-3 py-2 rounded-lg text-xs border border-border/50 bg-secondary/50 hover:bg-primary/10 transition-all whitespace-nowrap"
            >
              Use default (40%)
            </button>
            <Button
              size="icon"
              onClick={() => {
                const v = Number(inputValue) || 40;
                submitWithDelay(qId, v, `${v}%`);
              }}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          {rev > 0 && inputValue && (
            <p className="text-xs text-muted-foreground px-1">
              At {pct}%, that's <span className="font-medium text-foreground">{fmtMoney(rev * pct / 100, cur)}</span> in gross profit on {fmtMoney(rev, cur)}
            </p>
          )}
        </div>
      );
    }

    // Invoice chips
    if (currentQ.inputType === "invoice-chips") {
      return (
        <div className="flex flex-wrap gap-2">
          {["Fixed Fee", "Milestone-based", "Monthly Retainer", "Time & Materials"].map(m => (
            <button
              key={m}
              onClick={() => submitWithDelay(qId, m === "Milestone-based" ? "Milestone" : m === "Monthly Retainer" ? "Retainer" : m, m)}
              className="px-4 py-2.5 rounded-xl text-sm font-medium border border-border/50 bg-secondary/50 hover:bg-primary/15 hover:border-primary/30 transition-all"
            >
              {m}
            </button>
          ))}
        </div>
      );
    }

    // Partner select
    if (currentQ.inputType === "partner-select") {
      return (
        <div className="flex flex-wrap gap-2">
          {externalPartners.map(p => (
            <button
              key={p.stakeholder_id}
              onClick={() => {
                interview.answers._partnerName = p.stakeholder_name;
                submitWithDelay(qId, p.stakeholder_id, p.stakeholder_name);
              }}
              className="px-4 py-2 rounded-xl text-sm font-medium border border-border/50 bg-secondary/50 hover:bg-primary/15 hover:border-primary/30 transition-all"
            >
              {p.stakeholder_name}
            </button>
          ))}
        </div>
      );
    }

    // Flat fee chips
    if (currentQ.inputType === "flat-fee-chips") {
      return (
        <div className="flex gap-3">
          {[10, 12, 15].map(f => (
            <button
              key={f}
              onClick={() => submitWithDelay(qId, f, `${f}%`)}
              className="px-6 py-3 rounded-xl text-lg font-bold border-2 border-border/50 bg-secondary/50 hover:bg-primary/15 hover:border-primary/30 transition-all tabular-nums"
            >
              {f}%
            </button>
          ))}
        </div>
      );
    }

    // Recharge chips
    if (currentQ.inputType === "recharge-chips") {
      return (
        <div className="grid grid-cols-1 gap-2">
          <button
            onClick={() => submitWithDelay(qId, true, "Yes, recharge applies")}
            className="text-left p-3 rounded-xl border border-border/50 bg-secondary/30 hover:border-primary/30 hover:bg-primary/5 transition-all text-sm"
          >
            ✅ Yes, recharge applies
          </button>
          <button
            onClick={() => submitWithDelay(qId, false, "No, pure pass-through")}
            className="text-left p-3 rounded-xl border border-border/50 bg-secondary/30 hover:border-primary/30 hover:bg-primary/5 transition-all text-sm"
          >
            ❌ No, pure pass-through
          </button>
        </div>
      );
    }

    // Date range
    if (currentQ.inputType === "date-range") {
      return (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Start Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !dateStart && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateStart ? format(dateStart, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={dateStart} onSelect={setDateStart} initialFocus className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">End Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !dateEnd && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateEnd ? format(dateEnd, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={dateEnd} onSelect={setDateEnd} initialFocus className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <Button
            disabled={!dateStart || !dateEnd || dateEnd <= dateStart}
            onClick={() => {
              if (!dateStart || !dateEnd) return;
              const s = format(dateStart, "yyyy-MM-dd");
              const e = format(dateEnd, "yyyy-MM-dd");
              const days = differenceInDays(dateEnd, dateStart);
              const months = differenceInCalendarMonths(dateEnd, dateStart);
              const display = `${format(dateStart, "dd MMM yyyy")} → ${format(dateEnd, "dd MMM yyyy")}`;
              submitWithDelay("dates", { start_date: s, end_date: e }, display);
            }}
            className="w-full"
          >
            <Check className="h-4 w-4 mr-2" /> Confirm dates
          </Button>
          {dateStart && dateEnd && dateEnd > dateStart && (
            <p className="text-xs text-muted-foreground text-center">
              That's {differenceInCalendarMonths(dateEnd, dateStart)} months / {differenceInDays(dateEnd, dateStart)} days
            </p>
          )}
        </div>
      );
    }

    // Business type chips
    if (currentQ.inputType === "business-chips") {
      return (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            {BUSINESS_TYPES.map(bt => (
              <button
                key={bt}
                onClick={() => submitWithDelay(qId, bt, bt)}
                className="px-4 py-2 rounded-xl text-sm font-medium border border-border/50 bg-secondary/50 hover:bg-primary/15 hover:border-primary/30 transition-all"
              >
                {bt}
              </button>
            ))}
          </div>
          <button
            onClick={() => submitWithDelay(qId, "", "Skipped")}
            className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
          >
            <SkipForward className="h-3 w-3" /> Skip
          </button>
        </div>
      );
    }

    // Textarea
    if (currentQ.inputType === "textarea") {
      return (
        <div className="space-y-2">
          <Textarea
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            placeholder="Add any notes..."
            maxLength={500}
            rows={3}
            autoFocus
          />
          <div className="flex items-center gap-2">
            <Button
              onClick={() => submitWithDelay(qId, inputValue.trim(), inputValue.trim() || "Skipped")}
              className="flex-1"
            >
              {inputValue.trim() ? "Submit" : "Skip"}
            </Button>
          </div>
        </div>
      );
    }

    // Stakeholders
    if (currentQ.inputType === "stakeholders") {
      return (
        <div className="space-y-3">
          {/* Quick-add presets */}
          <div className="flex flex-wrap gap-2">
            {payoutPresets.map(p => (
              <button
                key={p.preset_id}
                onClick={() => {
                  setSplitDrafts(prev => [...prev, {
                    stakeholder_id: allStakeholders[0]?.stakeholder_id ?? "",
                    role_on_project: "Rainmaker",
                    payout_model: p.payout_model,
                    payout_value: p.payout_value,
                    cap_type: p.cap_type, cap_value: p.cap_value,
                    floor_type: p.floor_type, floor_value: p.floor_value,
                    payment_trigger: p.payment_trigger,
                  }]);
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-medium border border-border/50 bg-secondary/50 hover:bg-primary/15 hover:border-primary/30 transition-all flex items-center gap-1"
              >
                <Plus className="h-3 w-3" /> {p.preset_name}
              </button>
            ))}
          </div>

          {/* Added splits */}
          {splitDrafts.length > 0 && (
            <div className="space-y-1.5">
              {splitDrafts.map((s, i) => {
                const sh = allStakeholders.find(x => x.stakeholder_id === s.stakeholder_id);
                return (
                  <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-secondary/30 border border-border/30 text-xs">
                    <span>{sh?.stakeholder_name || "Stakeholder"} — {s.payout_model.replace(/_/g, " ")} @ {s.payout_value}%</span>
                    <button onClick={() => setSplitDrafts(prev => prev.filter((_, j) => j !== i))} className="text-destructive hover:text-destructive/80">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex gap-2">
            <Button
              onClick={() => {
                interview.answers._splitDrafts = splitDrafts;
                submitWithDelay(qId, splitDrafts, splitDrafts.length > 0 ? `${splitDrafts.length} stakeholder(s) configured` : "No payouts");
              }}
              className="flex-1"
            >
              {splitDrafts.length > 0 ? `Continue with ${splitDrafts.length} stakeholder(s)` : "No payouts to configure"}
            </Button>
          </div>
        </div>
      );
    }

    return null;
  }

  /* ── Get confirmation text for country answer ── */
  function getConfirmation(questionId: string, value: any): string | undefined {
    if (questionId === "country_of_delivery") {
      const cc = COUNTRY_CURRENCY[value] || "SGD";
      return `Currency auto-set to ${cc} based on ${value}`;
    }
    if (questionId === "dates" && value) {
      const days = differenceInDays(new Date(value.end_date), new Date(value.start_date));
      const months = differenceInCalendarMonths(new Date(value.end_date), new Date(value.start_date));
      return `That's ${months} months / ${days} days`;
    }
    return undefined;
  }

  /* ── Render final confirmation ── */
  function renderFinalScreen() {
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="flex gap-2.5 items-start">
          <div className="w-7 h-7 rounded-full bg-[hsl(var(--positive)/0.15)] flex items-center justify-center shrink-0 mt-0.5">
            <Check className="h-4 w-4 text-[hsl(var(--positive))]" />
          </div>
          <div className="bg-secondary/80 border border-[hsl(var(--positive)/0.2)] rounded-2xl rounded-tl-md px-4 py-3">
            <p className="text-sm font-semibold text-foreground">Ready to create this project?</p>
            <p className="text-xs text-muted-foreground mt-1">Review the summary on the right, then hit create.</p>
          </div>
        </div>
        <div className="flex flex-col gap-2 pl-9">
          <Button onClick={handleCreateProject} className="w-full gap-2">
            <Sparkles className="h-4 w-4" /> Create Project
          </Button>
          <Button variant="outline" onClick={() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" })} className="w-full gap-2">
            <ArrowLeft className="h-4 w-4" /> Review my answers
          </Button>
          <Button variant="ghost" onClick={saveDraftManual} className="w-full gap-2">
            <Save className="h-4 w-4" /> Save as Draft
          </Button>
        </div>
      </div>
    );
  }

  const progressPct = Math.round((interview.answeredCount / interview.totalQuestions) * 100);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] p-0 overflow-hidden">
        {/* ═══ MOBILE PROGRESS BAR (replaces right panel on small screens) ═══ */}
        <div className="md:hidden border-b px-4 py-3 space-y-1.5 shrink-0">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Your Project So Far</span>
            <span className="tabular-nums">{interview.answeredCount}/{interview.totalQuestions} · {progressPct}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        <div className="flex flex-col md:flex-row h-[80vh]">
          {/* ═══ LEFT PANEL — The Conversation ═══ */}
          <div className="flex-1 flex flex-col min-w-0 md:flex-[0_0_60%]">
            {/* Header */}
            <div className="border-b px-5 py-4 shrink-0">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <div>
                  <h2 className="text-base font-semibold text-foreground">Create New Project</h2>
                  <p className="text-xs text-muted-foreground">Answer a few questions and we'll set everything up</p>
                </div>
              </div>
            </div>

            {/* Chat log */}
            <ScrollArea className="flex-1 px-5 py-4">
              <div className="space-y-4 pb-4">
                {/* Rendered answered Q&A pairs */}
                {interview.answerHistory.map((answer, i) => {
                  const q = interview.questions.find(q => q.id === answer.questionId);
                  if (!q) return null;
                  return (
                    <div key={`${answer.questionId}-${i}`} className="space-y-2.5">
                      <SystemBubble
                        question={q.question}
                        confirmation={getConfirmation(answer.questionId, answer.value)}
                      />
                      <UserBubble
                        displayValue={answer.displayValue}
                        onEdit={() => interview.goBackTo(answer.questionId)}
                      />
                    </div>
                  );
                })}

                {/* Current question */}
                {currentQ && !animatingQuestion && (
                  <div className="space-y-3 animate-fade-in">
                    <SystemBubble question={currentQ.question} subtext={currentQ.subtext} />
                    <div className="pl-9">
                      {renderInput()}
                    </div>
                  </div>
                )}

                {/* Final screen */}
                {interview.isComplete && renderFinalScreen()}

                <div ref={chatEndRef} />
              </div>
            </ScrollArea>
          </div>

          {/* ═══ RIGHT PANEL — Project Taking Shape (hidden on mobile) ═══ */}
          <div className="hidden md:block border-l bg-secondary/20 md:flex-[0_0_40%]">
            <div className="p-5 h-full flex flex-col">
              <h3 className="text-sm font-semibold text-foreground mb-1">Your Project So Far</h3>
              <p className="text-xs text-muted-foreground mb-4">Fields fill in as you answer</p>

              <ScrollArea className="flex-1">
                <div className="space-y-0.5">
                  {previewFields.map((f, i) => (
                    <PreviewRow key={i} label={f.label} value={f.value} filled={f.filled} />
                  ))}
                </div>
              </ScrollArea>

              {/* Progress */}
              <div className="border-t pt-3 mt-3 space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{interview.answeredCount} of {interview.totalQuestions} questions answered</span>
                  <span className="tabular-nums">{progressPct}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-500"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
