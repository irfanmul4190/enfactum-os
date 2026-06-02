import { SlideLayout } from '../SlideLayout';
import { formatSGD } from '@/lib/format';

interface StageData {
  stage: string;
  count: number;
  value: number;
}

interface FunnelSlideProps {
  slideNumber: number;
  totalSlides: number;
  stages: StageData[];
  totalPipeline: number;
  commentary: string;
  onCommentaryChange: (v: string) => void;
}

const FUNNEL_COLORS = [
  'hsl(210,100%,56%)',
  'hsl(190,70%,50%)',
  'hsl(265,55%,58%)',
  'hsl(38,85%,52%)',
  'hsl(215,15%,50%)',
  'hsl(152,60%,45%)',
  'hsl(0,65%,50%)',
];

export function FunnelSlide({ slideNumber, totalSlides, stages, totalPipeline, commentary, onCommentaryChange }: FunnelSlideProps) {
  return (
    <SlideLayout slideNumber={slideNumber} totalSlides={totalSlides}>
      <div className="flex h-full">
        {/* Main content */}
        <div className="w-[65%] px-[80px] pt-[80px]">
          <h2 className="text-[40px] font-bold tracking-tight mb-[12px]">Pipeline Funnel</h2>
          <div className="w-[80px] h-[4px] bg-[hsl(210,100%,56%)] rounded-full mb-[48px]" />

          <div className="space-y-[16px]">
            {stages.map((s, i) => {
              const pct = totalPipeline > 0 ? (s.value / totalPipeline) * 100 : 0;
              const maxWidth = 100 - i * 8;
              return (
                <div key={s.stage} className="flex items-center gap-[20px]">
                  <div className="w-[180px] flex-shrink-0 text-right">
                    <span className="text-[18px] font-medium">{s.stage}</span>
                  </div>
                  <div className="flex-1 relative h-[44px]">
                    <div
                      className="h-full rounded-[6px] flex items-center px-[16px] transition-all duration-500"
                      style={{
                        width: `${Math.max(pct, 3)}%`,
                        maxWidth: `${maxWidth}%`,
                        backgroundColor: FUNNEL_COLORS[i % FUNNEL_COLORS.length],
                        opacity: 0.85,
                      }}
                    >
                      <span className="text-[14px] font-bold text-white whitespace-nowrap">
                        {s.count} deals
                      </span>
                    </div>
                  </div>
                  <div className="w-[140px] flex-shrink-0 text-right font-mono text-[16px]">
                    {formatSGD(s.value)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Commentary */}
        <div className="w-[35%] border-l border-[hsl(220,12%,20%)] bg-[hsl(220,22%,8%)] px-[48px] pt-[80px] pb-[80px] flex flex-col">
          <p className="text-[14px] text-[hsl(210,100%,56%)] uppercase tracking-widest font-semibold mb-[16px]">Analyst Commentary</p>
          <textarea
            value={commentary}
            onChange={(e) => onCommentaryChange(e.target.value)}
            placeholder="Explain funnel dynamics, bottlenecks, or conversion insights..."
            className="flex-1 w-full bg-transparent text-[18px] leading-[1.7] text-[hsl(210,20%,92%)] placeholder:text-[hsl(215,12%,35%)] resize-none focus:outline-none"
          />
        </div>
      </div>
    </SlideLayout>
  );
}
