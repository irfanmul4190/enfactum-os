import { SlideLayout } from '../SlideLayout';
import { formatSGD } from '@/lib/format';
import { DbVDeal } from '@/integrations/supabase/db';

interface TopDealsSlideProps {
  slideNumber: number;
  totalSlides: number;
  deals: DbVDeal[];
  commentary: string;
  onCommentaryChange: (v: string) => void;
}

export function TopDealsSlide({ slideNumber, totalSlides, deals, commentary, onCommentaryChange }: TopDealsSlideProps) {
  const topDeals = deals
    .filter(d => d.stage && !['won', 'lost', 'Won', 'Lost', 'Closed'].includes(d.stage))
    .sort((a, b) => (b.value ?? 0) - (a.value ?? 0))
    .slice(0, 8);

  return (
    <SlideLayout slideNumber={slideNumber} totalSlides={totalSlides}>
      <div className="flex h-full">
        {/* Main content */}
        <div className="w-[65%] px-[80px] pt-[80px]">
          <h2 className="text-[40px] font-bold tracking-tight mb-[12px]">Top Opportunities</h2>
          <div className="w-[80px] h-[4px] bg-[hsl(210,100%,56%)] rounded-full mb-[36px]" />

          <table className="w-full">
            <thead>
              <tr className="text-[14px] text-[hsl(215,12%,55%)] uppercase tracking-widest border-b border-[hsl(220,12%,20%)]">
                <th className="text-left pb-[16px] font-semibold">Deal</th>
                <th className="text-left pb-[16px] font-semibold">Account</th>
                <th className="text-left pb-[16px] font-semibold">Stage</th>
                <th className="text-right pb-[16px] font-semibold">Value</th>
                <th className="text-right pb-[16px] font-semibold">Win%</th>
              </tr>
            </thead>
            <tbody>
              {topDeals.map((d, i) => (
                <tr
                  key={d.id}
                  className="border-b border-[hsl(220,12%,20%/0.5)]"
                  style={{ backgroundColor: i % 2 === 0 ? 'transparent' : 'hsl(220,18%,12%)' }}
                >
                  <td className="py-[14px] text-[18px] font-medium max-w-[300px] truncate">{d.title}</td>
                  <td className="py-[14px] text-[16px] text-[hsl(215,12%,55%)]">{d.account_name ?? '—'}</td>
                  <td className="py-[14px]">
                    <span className="inline-block px-[12px] py-[4px] rounded-full text-[13px] font-medium bg-[hsl(210,100%,56%/0.15)] text-[hsl(210,100%,70%)]">
                      {d.stage}
                    </span>
                  </td>
                  <td className="py-[14px] text-right font-mono text-[18px]">{formatSGD(d.value ?? 0)}</td>
                  <td className="py-[14px] text-right font-mono text-[16px] text-[hsl(215,12%,55%)]">
                    {Math.round((d.win_probability ?? 0) * 100)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Commentary */}
        <div className="w-[35%] border-l border-[hsl(220,12%,20%)] bg-[hsl(220,22%,8%)] px-[48px] pt-[80px] pb-[80px] flex flex-col">
          <p className="text-[14px] text-[hsl(210,100%,56%)] uppercase tracking-widest font-semibold mb-[16px]">Analyst Commentary</p>
          <textarea
            value={commentary}
            onChange={(e) => onCommentaryChange(e.target.value)}
            placeholder="Highlight key deals, risks, or strategic priorities..."
            className="flex-1 w-full bg-transparent text-[18px] leading-[1.7] text-[hsl(210,20%,92%)] placeholder:text-[hsl(215,12%,35%)] resize-none focus:outline-none"
          />
        </div>
      </div>
    </SlideLayout>
  );
}
