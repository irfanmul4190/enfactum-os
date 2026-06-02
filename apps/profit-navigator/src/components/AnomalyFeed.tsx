import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, AlertCircle, Info, CheckCircle2, X, ExternalLink, TrendingDown, Clock, ShieldAlert, DollarSign, Gauge } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { Anomaly, AnomalySeverity } from "@/lib/anomalyDetector";

interface AnomalyFeedProps {
  anomalies: Anomaly[];
}

const SEVERITY_CONFIG: Record<AnomalySeverity, {
  icon: React.ElementType;
  label: string;
  iconClass: string;
  borderClass: string;
  bgClass: string;
}> = {
  high: {
    icon: AlertTriangle,
    label: "High",
    iconClass: "text-[hsl(var(--negative))]",
    borderClass: "border-l-[hsl(var(--negative))]",
    bgClass: "bg-[hsl(var(--negative)/0.06)]",
  },
  medium: {
    icon: AlertCircle,
    label: "Medium",
    iconClass: "text-[hsl(var(--warning))]",
    borderClass: "border-l-[hsl(var(--warning))]",
    bgClass: "bg-[hsl(var(--warning)/0.06)]",
  },
  low: {
    icon: Info,
    label: "Low",
    iconClass: "text-[hsl(var(--muted-foreground))]",
    borderClass: "border-l-[hsl(var(--muted-foreground))]",
    bgClass: "bg-muted/30",
  },
};

const TYPE_LABELS: Record<string, string> = {
  MARGIN_DROP: "Margin Drop",
  INVOICE_OVERDUE: "Invoice Overdue",
  GUARDRAIL_BREACH: "Guardrail Breach",
  COST_SPIKE: "Cost Spike",
  BUDGET_OVERRUN: "Budget Overrun",
};

const TYPE_TAB: Record<string, string> = {
  MARGIN_DROP: "overview",
  INVOICE_OVERDUE: "invoices",
  GUARDRAIL_BREACH: "stakeholders",
  COST_SPIKE: "costs",
  BUDGET_OVERRUN: "overview",
};

const TYPE_TAB_LABEL: Record<string, string> = {
  MARGIN_DROP: "View Overview tab",
  INVOICE_OVERDUE: "View Invoices tab",
  GUARDRAIL_BREACH: "View Stakeholders tab",
  COST_SPIKE: "View Costs tab",
  BUDGET_OVERRUN: "View Overview tab",
};

const TYPE_ICON: Record<string, React.ElementType> = {
  MARGIN_DROP: TrendingDown,
  INVOICE_OVERDUE: Clock,
  GUARDRAIL_BREACH: ShieldAlert,
  COST_SPIKE: DollarSign,
  BUDGET_OVERRUN: Gauge,
};

export function AnomalyFeed({ anomalies }: AnomalyFeedProps) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const dismiss = useCallback((key: string) => {
    setDismissed(prev => new Set(prev).add(key));
  }, []);

  const activeAnomalies = anomalies.filter(
    (a, i) => !dismissed.has(`${a.type}-${a.projectId}-${i}`)
  );

  const highCount = activeAnomalies.filter(a => a.severity === "high").length;
  const medCount = activeAnomalies.filter(a => a.severity === "medium").length;

  if (activeAnomalies.length === 0) {
    return (
      <div className="glass-card p-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full flex items-center justify-center bg-[hsl(var(--positive)/0.12)]">
            <CheckCircle2 className="h-5 w-5 text-[hsl(var(--positive))]" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">All projects healthy</h3>
            <p className="text-xs text-muted-foreground">No anomalies detected across your portfolio</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card overflow-hidden">
      <div className="px-5 py-3.5 border-b flex items-center justify-between" style={{ borderColor: "var(--glass-border)" }}>
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-[hsl(var(--warning))]" />
          <h3 className="text-sm font-semibold">Anomaly Alerts</h3>
          <span className="text-xs text-muted-foreground">
            {activeAnomalies.length} issue{activeAnomalies.length !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {highCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[hsl(var(--negative)/0.12)] text-[hsl(var(--negative))]">
              {highCount} High
            </span>
          )}
          {medCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[hsl(var(--warning)/0.12)] text-[hsl(var(--warning))]">
              {medCount} Medium
            </span>
          )}
        </div>
      </div>
      <div className="max-h-[320px] overflow-y-auto divide-y divide-border/50">
        {activeAnomalies.map((anomaly, i) => {
          const key = `${anomaly.type}-${anomaly.projectId}-${i}`;
          const cfg = SEVERITY_CONFIG[anomaly.severity];
          const Icon = cfg.icon;
          return (
            <div
              key={key}
              className={cn(
                "px-5 py-3 flex items-start gap-3 border-l-2 transition-colors",
                cfg.borderClass,
                cfg.bgClass
              )}
            >
              <Icon className={cn("h-4 w-4 mt-0.5 shrink-0", cfg.iconClass)} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-bold text-foreground">{anomaly.projectName}</span>
                  <span className="px-1.5 py-0 rounded text-[10px] font-medium bg-muted text-muted-foreground">
                    {TYPE_LABELS[anomaly.type] ?? anomaly.type}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{anomaly.message}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link to={`/projects/${anomaly.projectId}?tab=${TYPE_TAB[anomaly.type] || "overview"}&from=dashboard`}>
                      <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="text-xs flex items-center gap-1.5">
                    {(() => { const TypeIcon = TYPE_ICON[anomaly.type] || ExternalLink; return <TypeIcon className="h-3 w-3" />; })()}
                    {TYPE_TAB_LABEL[anomaly.type] || "View Project"}
                  </TooltipContent>
                </Tooltip>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-1.5 text-muted-foreground hover:text-foreground"
                  onClick={() => dismiss(key)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
