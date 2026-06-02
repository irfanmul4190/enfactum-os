import { SlideLayout } from '../SlideLayout';
import { formatSGD } from '@/lib/format';

interface KPISlideProps {
  slideNumber: number;
  totalSlides: number;
  metrics: {
    totalPipeline: number;
    weightedPipeline: number;
    openDeals: number;
    wonCount: number;
    wonValue: number;
    lostCount: number;
    winRate: number;
  };
  commentary: string;
  onCommentaryChange: (v: string) => void;
}

export function KPISlide({ slideNumber, totalSlides, metrics, commentary, onCommentaryChange }: KPISlideProps) {
  const kpis = [
    { label: 'Total Pipeline', value: formatSGD(metrics.totalPipeline), sub: `${metrics.openDeals} open deals` },
    { label: 'Weighted Pipeline', value: formatSGD(metrics.weightedPipeline), sub: 'risk-adjusted' },
    { label: 'Deals Won', value: String(metrics.wonCount), sub: formatSGD(metrics.wonValue) },
    { label: 'Win Rate', value: `${Math.round(metrics.winRate)}%`, sub: `${metrics.lostCount} lost` },
  ];

  return (
    <SlideLayout slideNumber={slideNumber} totalSlides={totalSlides}>
      <div className="flex h-full">
        {/* Main content — 65% */}
        <div className="w-[65%] px-[80px] pt-[80px]">
          <h2 className="text-[40px] font-bold tracking-tight mb-[12px]">Key Performance Indicators</h2>
          <div className="w-[80px] h-[4px] bg-[hsl(210,100%,56%)] rounded-full mb-[48px]" />

          <div className="grid grid-cols-2 gap-[32px]">
            {kpis.map((k) => (
              <div key={k.label} className="rounded-[12px] border border-[hsl(220,12%,20%)] p-[36px] bg-[hsl(220,18%,13%)]">
                <p className="text-[16px] text-[hsl(215,12%,55%)] uppercase tracking-widest mb-[12px]">{k.label}</p>
                <p className="text-[48px] font-bold tracking-tight font-mono leading-none">{k.value}</p>
                <p className="text-[16px] text-[hsl(215,12%,55%)] mt-[8px]">{k.sub}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Commentary — 35% */}
        <div className="w-[35%] border-l border-[hsl(220,12%,20%)] bg-[hsl(220,22%,8%)] px-[48px] pt-[80px] pb-[80px] flex flex-col">
          <p className="text-[14px] text-[hsl(210,100%,56%)] uppercase tracking-widest font-semibold mb-[16px]">Analyst Commentary</p>
          <textarea
            value={commentary}
            onChange={(e) => onCommentaryChange(e.target.value)}
            placeholder="Add your strategic commentary for this slide..."
            className="flex-1 w-full bg-transparent text-[18px] leading-[1.7] text-[hsl(210,20%,92%)] placeholder:text-[hsl(215,12%,35%)] resize-none focus:outline-none"
          />
        </div>
      </div>
    </SlideLayout>
  );
}
