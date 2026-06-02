import { useMemo } from "react";
import { TrendingUp, Target, Calendar, Zap } from "lucide-react";
import { fy2025Monthly, formatNumber } from "@/data/invoiceData";

const MONTH_ORDER = ["Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec","Jan","Feb","Mar"];
const TARGET = 5_000_000;
const TODAY = new Date("2026-02-19");

// FY seasonality weights from FY2025 actuals (using complete months only)
const SEASONALITY_WEIGHTS: Record<string, number> = {
  Apr: 344447, May: 470386, Jun: 233076,
  Jul: 303730, Aug: 296948, Sep: 335976,
  Oct: 550303, Nov: 466133, Dec: 473824,
  Jan: 556423, Feb: 418322, Mar: 0,
};

export function ForecastPanel() {
  const { ytdTotal, ytdMonths, remaining, forecast, gapToTarget, onTrack, confidence, scenarioBull, scenarioBear } = useMemo(() => {
    const actuals = fy2025Monthly.filter(m => m.totalSGD > 0);
    const ytdTotal = actuals.reduce((s, m) => s + m.totalSGD, 0);
    const ytdMonths = actuals.length;
    const runRate = ytdTotal / ytdMonths;

    // Which months are remaining?
    const completedMonths = new Set(actuals.map(m => m.month));
    const remainingMonths = MONTH_ORDER.filter(m => !completedMonths.has(m));

    // Seasonality-weighted forecast for remaining months
    const completedWeight = actuals.reduce((s, m) => s + (SEASONALITY_WEIGHTS[m.month] ?? 0), 0);
    const remainingWeight = remainingMonths.reduce((s, m) => s + (SEASONALITY_WEIGHTS[m] ?? 0), 0);

    // If we have seasonality data use it, else use flat run rate
    let seasonalForecast = 0;
    if (completedWeight > 0 && remainingWeight > 0) {
      // Scale: remaining months' weight relative to completed, applied to actual run rate
      const scaleFactor = remainingWeight / completedWeight;
      seasonalForecast = ytdTotal * scaleFactor;
    } else {
      seasonalForecast = runRate * remainingMonths.length;
    }

    const forecast = Math.round(ytdTotal + seasonalForecast);
    const remaining = Math.round(Math.max(0, TARGET - ytdTotal));
    const gapToTarget = forecast - TARGET;
    const onTrack = forecast >= TARGET;

    // Bull (+10% remaining) / Bear (-15% remaining)
    const bull = Math.round(ytdTotal + seasonalForecast * 1.10);
    const bear = Math.round(ytdTotal + seasonalForecast * 0.85);

    // Confidence based on months completed
    const confidence = Math.min(95, 40 + ytdMonths * 5);

    return { ytdTotal, ytdMonths, remaining, forecast, gapToTarget, onTrack, confidence, scenarioBull: bull, scenarioBear: bear };
  }, []);

  const daysInFY = 365;
  const fyStart = new Date("2025-04-01");
  const fyEnd   = new Date("2026-03-31");
  const elapsed = Math.floor((TODAY.getTime() - fyStart.getTime()) / 86_400_000);
  const daysLeft = Math.ceil((fyEnd.getTime() - TODAY.getTime()) / 86_400_000);
  const fyProgress = Math.min(100, (elapsed / daysInFY) * 100);

  return (
    <div className="kpi-card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>
            FY2025 Revenue Forecast
          </h3>
          <p className="text-xs mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>
            Run rate + seasonality-weighted projection · {ytdMonths} months recorded · {daysLeft} days remaining
          </p>
        </div>
        <div
          className="px-2.5 py-1 rounded-full text-xs font-bold"
          style={{
            background: onTrack ? "hsl(var(--positive-muted))" : "hsl(var(--negative-muted))",
            color: onTrack ? "hsl(var(--positive))" : "hsl(var(--negative))",
          }}
        >
          {onTrack ? "▲ ON TRACK" : "▼ BELOW TARGET"}
        </div>
      </div>

      {/* Main forecast number */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        {/* Central forecast */}
        <div className="col-span-3 xl:col-span-1 rounded-xl p-4 text-center border"
          style={{ background: onTrack ? "hsl(var(--positive-muted))" : "hsl(var(--negative-muted))", borderColor: onTrack ? "hsl(var(--positive) / 0.3)" : "hsl(var(--negative) / 0.3)" }}>
          <div className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: onTrack ? "hsl(var(--positive))" : "hsl(var(--negative))" }}>
            Base Forecast
          </div>
          <div className="mono text-2xl font-bold mb-0.5" style={{ color: "hsl(var(--foreground))" }}>
            SGD {formatNumber(forecast)}
          </div>
          <div className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
            {gapToTarget >= 0
              ? `SGD ${formatNumber(gapToTarget)} above target`
              : `SGD ${formatNumber(Math.abs(gapToTarget))} below target`}
          </div>
          <div className="mt-2 text-xs px-2 py-0.5 rounded-full inline-block" style={{ background: "hsl(var(--surface-3))", color: "hsl(var(--muted-foreground))" }}>
            {confidence}% confidence
          </div>
        </div>

        {/* Bull */}
        <div className="rounded-xl p-3 border" style={{ background: "hsl(var(--surface-3))", borderColor: "hsl(var(--border))" }}>
          <div className="flex items-center gap-1.5 mb-2">
            <Zap className="w-3 h-3" style={{ color: "hsl(var(--positive))" }} />
            <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "hsl(var(--positive))" }}>Bull +10%</span>
          </div>
          <div className="mono text-base font-bold" style={{ color: "hsl(var(--foreground))" }}>SGD {formatNumber(scenarioBull)}</div>
          <div className="text-xs mt-1" style={{ color: "hsl(var(--muted-foreground))" }}>
            {scenarioBull >= TARGET ? `+${formatNumber(scenarioBull - TARGET)} over` : `${formatNumber(TARGET - scenarioBull)} short`}
          </div>
        </div>

        {/* Bear */}
        <div className="rounded-xl p-3 border" style={{ background: "hsl(var(--surface-3))", borderColor: "hsl(var(--border))" }}>
          <div className="flex items-center gap-1.5 mb-2">
            <TrendingUp className="w-3 h-3 rotate-180" style={{ color: "hsl(var(--negative))" }} />
            <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "hsl(var(--negative))" }}>Bear −15%</span>
          </div>
          <div className="mono text-base font-bold" style={{ color: "hsl(var(--foreground))" }}>SGD {formatNumber(scenarioBear)}</div>
          <div className="text-xs mt-1" style={{ color: "hsl(var(--muted-foreground))" }}>
            {scenarioBear >= TARGET ? `+${formatNumber(scenarioBear - TARGET)} over` : `${formatNumber(TARGET - scenarioBear)} short`}
          </div>
        </div>
      </div>

      {/* Progress + FY timeline */}
      <div className="space-y-3">
        {/* Revenue vs target */}
        <div>
          <div className="flex justify-between text-xs mb-1.5" style={{ color: "hsl(var(--muted-foreground))" }}>
            <span>YTD Revenue</span>
            <span className="mono font-semibold" style={{ color: "hsl(var(--primary))" }}>
              {((ytdTotal / TARGET) * 100).toFixed(1)}% of target
            </span>
          </div>
          <div className="h-2.5 rounded-full overflow-hidden relative" style={{ background: "hsl(var(--surface-4))" }}>
            {/* Actual */}
            <div className="h-full rounded-full absolute left-0 top-0 transition-all"
              style={{ width: `${Math.min(100, (ytdTotal / TARGET) * 100)}%`, background: "var(--gradient-primary)" }} />
            {/* Forecast extension */}
            <div className="h-full absolute top-0 opacity-30 rounded-full"
              style={{
                left: `${Math.min(100, (ytdTotal / TARGET) * 100)}%`,
                width: `${Math.min(100 - (ytdTotal / TARGET) * 100, ((forecast - ytdTotal) / TARGET) * 100)}%`,
                background: onTrack ? "hsl(var(--positive))" : "hsl(var(--negative))",
              }} />
          </div>
          <div className="flex justify-between text-xs mt-1" style={{ color: "hsl(var(--muted-foreground))" }}>
            <span>SGD {formatNumber(ytdTotal)} actual</span>
            <span>SGD 5M target</span>
          </div>
        </div>

        {/* FY timeline */}
        <div>
          <div className="flex justify-between text-xs mb-1.5" style={{ color: "hsl(var(--muted-foreground))" }}>
            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />FY Timeline</span>
            <span className="mono">{daysLeft} days left</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "hsl(var(--surface-4))" }}>
            <div className="h-full rounded-full" style={{ width: `${fyProgress}%`, background: "hsl(var(--warning))" }} />
          </div>
          <div className="flex justify-between text-xs mt-1" style={{ color: "hsl(var(--muted-foreground))" }}>
            <span>Apr 2025</span>
            <span style={{ color: "hsl(var(--warning))" }}>{fyProgress.toFixed(0)}% elapsed</span>
            <span>Mar 2026</span>
          </div>
        </div>

        {/* Need-to-bill rate */}
        <div className="flex items-center justify-between rounded-lg px-3 py-2.5 border"
          style={{ background: "hsl(var(--surface-3))", borderColor: "hsl(var(--border))" }}>
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4" style={{ color: "hsl(var(--primary))" }} />
            <div>
              <div className="text-xs font-medium" style={{ color: "hsl(var(--foreground))" }}>Monthly Run Rate Needed</div>
              <div className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>to hit SGD 5M from here</div>
            </div>
          </div>
          <div className="text-right">
            <div className="mono font-bold text-sm" style={{ color: remaining > 0 ? "hsl(var(--warning))" : "hsl(var(--positive))" }}>
              {remaining > 0 ? `SGD ${formatNumber(remaining / Math.max(1, 12 - ytdMonths))}/mo` : "Achieved!"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
