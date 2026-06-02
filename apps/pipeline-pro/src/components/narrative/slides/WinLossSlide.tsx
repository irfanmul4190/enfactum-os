import { SlideLayout } from '../SlideLayout';
import { formatSGD } from '@/lib/format';
import { DbVDeal } from '@/integrations/supabase/db';

interface WinLossSlideProps {
  slideNumber: number;
  totalSlides: number;
  wonDeals: DbVDeal[];
  lostDeals: DbVDeal[];
  commentary: string;
  onCommentaryChange: (v: string) => void;
}

export function WinLossSlide({ slideNumber, totalSlides, wonDeals, lostDeals, commentary, onCommentaryChange }: WinLossSlideProps) {
  const wonValue = wonDeals.reduce((s, d) => s + (d.value ?? 0), 0);
  const lostValue = lostDeals.reduce((s, d) => s + (d.value ?? 0), 0);
  const total = wonDeals.length + lostDeals.length;
  const winRate = total > 0 ? (wonDeals.length / total) * 100 : 0;

  return (
    <SlideLayout slideNumber={slideNumber} totalSlides={totalSlides}>
      <div className="flex h-full">
        {/* Main content */}
        <div className="w-[65%] px-[80px] pt-[80px]">
          <h2 className="text-[40px] font-bold tracking-tight mb-[12px]">Win / Loss Analysis</h2>
          <div className="w-[80px] h-[4px] bg-[hsl(210,100%,56%)] rounded-full mb-[48px]" />

          <div className="grid grid-cols-3 gap-[32px] mb-[48px]">
            <div className="rounded-[12px] border border-[hsl(152,60%,45%/0.3)] p-[36px] bg-[hsl(152,60%,45%/0.08)]">
              <p className="text-[16px] text-[hsl(152,60%,70%)] uppercase tracking-widest mb-[12px]">Won</p>
              <p className="text-[56px] font-bold tracking-tight text-[hsl(152,60%,55%)] leading-none">{wonDeals.length}</p>
              <p className="text-[18px] font-mono text-[hsl(215,12%,55%)] mt-[8px]">{formatSGD(wonValue)}</p>
            </div>
            <div className="rounded-[12px] border border-[hsl(0,65%,50%/0.3)] p-[36px] bg-[hsl(0,65%,50%/0.08)]">
              <p className="text-[16px] text-[hsl(0,65%,70%)] uppercase tracking-widest mb-[12px]">Lost</p>
              <p className="text-[56px] font-bold tracking-tight text-[hsl(0,65%,60%)] leading-none">{lostDeals.length}</p>
              <p className="text-[18px] font-mono text-[hsl(215,12%,55%)] mt-[8px]">{formatSGD(lostValue)}</p>
            </div>
            <div className="rounded-[12px] border border-[hsl(220,12%,20%)] p-[36px] bg-[hsl(220,18%,13%)]">
              <p className="text-[16px] text-[hsl(215,12%,55%)] uppercase tracking-widest mb-[12px]">Win Rate</p>
              <p className="text-[56px] font-bold tracking-tight text-[hsl(210,100%,56%)] leading-none">{Math.round(winRate)}%</p>
              <p className="text-[18px] font-mono text-[hsl(215,12%,55%)] mt-[8px]">{total} total outcomes</p>
            </div>
          </div>

          {/* Win rate bar */}
          <div className="rounded-[8px] overflow-hidden h-[32px] flex">
            <div
              className="h-full bg-[hsl(152,60%,45%)] transition-all duration-500"
              style={{ width: `${winRate}%` }}
            />
            <div
              className="h-full bg-[hsl(0,65%,50%)] transition-all duration-500"
              style={{ width: `${100 - winRate}%` }}
            />
          </div>
          <div className="flex justify-between mt-[8px] text-[14px] text-[hsl(215,12%,55%)]">
            <span>Won ({Math.round(winRate)}%)</span>
            <span>Lost ({Math.round(100 - winRate)}%)</span>
          </div>
        </div>

        {/* Commentary */}
        <div className="w-[35%] border-l border-[hsl(220,12%,20%)] bg-[hsl(220,22%,8%)] px-[48px] pt-[80px] pb-[80px] flex flex-col">
          <p className="text-[14px] text-[hsl(210,100%,56%)] uppercase tracking-widest font-semibold mb-[16px]">Analyst Commentary</p>
          <textarea
            value={commentary}
            onChange={(e) => onCommentaryChange(e.target.value)}
            placeholder="Analyze win/loss patterns, competitive dynamics, or improvement areas..."
            className="flex-1 w-full bg-transparent text-[18px] leading-[1.7] text-[hsl(210,20%,92%)] placeholder:text-[hsl(215,12%,35%)] resize-none focus:outline-none"
          />
        </div>
      </div>
    </SlideLayout>
  );
}
