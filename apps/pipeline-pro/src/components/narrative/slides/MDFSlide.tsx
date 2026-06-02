import { SlideLayout } from '../SlideLayout';
import { formatSGD } from '@/lib/format';
import { DbVDeal } from '@/integrations/supabase/db';

interface MDFSlideProps {
  slideNumber: number;
  totalSlides: number;
  deals: DbVDeal[];
  commentary: string;
  onCommentaryChange: (v: string) => void;
}

export function MDFSlide({ slideNumber, totalSlides, deals, commentary, onCommentaryChange }: MDFSlideProps) {
  const mdfDeals = deals.filter(d => d.mdf_eligible && d.stage && !['Won', 'Lost', 'Closed'].includes(d.stage));
  const mdfPipelineValue = mdfDeals.reduce((s, d) => s + (d.value ?? 0), 0);
  const totalEstimatedMdf = mdfDeals.reduce((s, d) => s + (d.mdf_amount ?? 0), 0);

  const topMdfDeals = [...mdfDeals].sort((a, b) => (b.mdf_amount ?? 0) - (a.mdf_amount ?? 0)).slice(0, 6);

  // Calculate avg MDF-adjusted GP%
  const dealsWithMargin = mdfDeals.filter(d => (d.margin_revenue ?? 0) > 0);
  const avgMdfAdjGp = dealsWithMargin.length > 0
    ? dealsWithMargin.reduce((s, d) => {
        const gp = d.margin_gp ?? d.gross_profit ?? 0;
        const rev = d.margin_revenue ?? 1;
        return s + ((gp + (d.mdf_amount ?? 0)) / rev) * 100;
      }, 0) / dealsWithMargin.length
    : 0;

  return (
    <SlideLayout slideNumber={slideNumber} totalSlides={totalSlides}>
      <div className="flex h-full">
        {/* Main content */}
        <div className="w-[65%] px-[80px] pt-[80px]">
          <h2 className="text-[40px] font-bold tracking-tight mb-[12px]">MDF Opportunity Tracker</h2>
          <div className="w-[80px] h-[4px] bg-[hsl(38,85%,52%)] rounded-full mb-[48px]" />

          {/* KPI row */}
          <div className="grid grid-cols-4 gap-[24px] mb-[48px]">
            {[
              { label: 'MDF Pipeline', value: formatSGD(mdfPipelineValue), color: 'hsl(38,85%,52%)' },
              { label: 'MDF Deals', value: String(mdfDeals.length), color: 'hsl(210,100%,56%)' },
              { label: 'Est. MDF Amount', value: formatSGD(totalEstimatedMdf), color: 'hsl(152,60%,45%)' },
              { label: 'Avg MDF-Adj GP%', value: `${avgMdfAdjGp.toFixed(1)}%`, color: 'hsl(265,55%,58%)' },
            ].map(k => (
              <div key={k.label} className="rounded-[12px] border border-[hsl(220,12%,20%)] p-[28px] bg-[hsl(220,18%,13%)]">
                <p className="text-[13px] text-[hsl(215,12%,55%)] uppercase tracking-widest mb-[10px]">{k.label}</p>
                <p className="text-[36px] font-bold tracking-tight font-mono leading-none" style={{ color: k.color }}>{k.value}</p>
              </div>
            ))}
          </div>

          {/* Top MDF deals table */}
          <p className="text-[18px] font-semibold mb-[16px] text-[hsl(215,12%,55%)]">Top MDF-Eligible Deals</p>
          <table className="w-full">
            <thead>
              <tr className="text-[13px] text-[hsl(215,12%,55%)] uppercase tracking-widest border-b border-[hsl(220,12%,20%)]">
                <th className="text-left pb-[12px] font-semibold">Deal</th>
                <th className="text-left pb-[12px] font-semibold">Account</th>
                <th className="text-right pb-[12px] font-semibold">Value</th>
                <th className="text-right pb-[12px] font-semibold">Est. MDF</th>
              </tr>
            </thead>
            <tbody>
              {topMdfDeals.map((d, i) => (
                <tr
                  key={d.id}
                  className="border-b border-[hsl(220,12%,20%/0.5)]"
                  style={{ backgroundColor: i % 2 === 0 ? 'transparent' : 'hsl(220,18%,12%)' }}
                >
                  <td className="py-[12px] text-[16px] font-medium max-w-[280px] truncate">{d.title}</td>
                  <td className="py-[12px] text-[14px] text-[hsl(215,12%,55%)]">{d.account_name ?? '—'}</td>
                  <td className="py-[12px] text-right font-mono text-[16px]">{formatSGD(d.value ?? 0)}</td>
                  <td className="py-[12px] text-right font-mono text-[16px] text-[hsl(38,85%,60%)]">
                    {d.mdf_amount ? formatSGD(d.mdf_amount) : '—'}
                  </td>
                </tr>
              ))}
              {topMdfDeals.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-[24px] text-center text-[16px] text-[hsl(215,12%,40%)]">
                    No MDF-eligible deals in pipeline
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Commentary */}
        <div className="w-[35%] border-l border-[hsl(220,12%,20%)] bg-[hsl(220,22%,8%)] px-[48px] pt-[80px] pb-[80px] flex flex-col">
          <p className="text-[14px] text-[hsl(210,100%,56%)] uppercase tracking-widest font-semibold mb-[16px]">Analyst Commentary</p>
          <textarea
            value={commentary}
            onChange={(e) => onCommentaryChange(e.target.value)}
            placeholder="Discuss MDF strategy, vendor co-investment opportunities, or fund utilization plans..."
            className="flex-1 w-full bg-transparent text-[18px] leading-[1.7] text-[hsl(210,20%,92%)] placeholder:text-[hsl(215,12%,35%)] resize-none focus:outline-none"
          />
        </div>
      </div>
    </SlideLayout>
  );
}
