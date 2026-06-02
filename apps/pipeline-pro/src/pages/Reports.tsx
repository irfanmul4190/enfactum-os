import { useMemo, useState, useCallback, useEffect } from 'react';
import { KPICard } from '@/components/KPICard';
import { StageBadge } from '@/components/StatusBadges';
import { formatSGD } from '@/lib/format';
import { useDeals } from '@/hooks/useDeals';
import { STAGES_ORDERED } from '@/types';
import { DollarSign, TrendingUp, Target, AlertTriangle, Presentation, LayoutList, ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ScaledSlide } from '@/components/narrative/ScaledSlide';
import { TitleSlide } from '@/components/narrative/slides/TitleSlide';
import { KPISlide } from '@/components/narrative/slides/KPISlide';
import { FunnelSlide } from '@/components/narrative/slides/FunnelSlide';
import { TopDealsSlide } from '@/components/narrative/slides/TopDealsSlide';
import { WinLossSlide } from '@/components/narrative/slides/WinLossSlide';
import { MDFSlide } from '@/components/narrative/slides/MDFSlide';
import { format } from 'date-fns';

export default function Reports() {
  const { data: deals = [], isLoading } = useDeals();
  const [narrativeMode, setNarrativeMode] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [commentary, setCommentary] = useState<Record<number, string>>({});

  // Keyboard navigation for narrative mode
  useEffect(() => {
    if (!narrativeMode) return;
    const handler = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'TEXTAREA') return;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        setCurrentSlide(c => Math.min(c + 1, TOTAL_SLIDES - 1));
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        setCurrentSlide(c => Math.max(c - 1, 0));
      } else if (e.key === 'Escape') {
        if (document.fullscreenElement) {
          document.exitFullscreen();
        } else {
          setNarrativeMode(false);
          setCurrentSlide(0);
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [narrativeMode]);

  const openDeals = useMemo(() => deals.filter(d => d.stage && !['Closed', 'Lost', 'Won'].includes(d.stage)), [deals]);
  const totalPipeline = openDeals.reduce((s, d) => s + (d.value ?? 0), 0);
  const weightedPipeline = openDeals.reduce((s, d) => s + (d.value ?? 0) * (d.win_probability ?? 0), 0);

  const wonDeals = deals.filter(d => d.stage === 'Closed' || d.stage === 'Won');
  const lostDeals = deals.filter(d => d.stage === 'Lost');
  const totalOutcomes = wonDeals.length + lostDeals.length;
  const winRate = totalOutcomes > 0 ? (wonDeals.length / totalOutcomes) * 100 : 0;

  const pipelineByStage = useMemo(() => {
    return STAGES_ORDERED.filter(s => !['Closed', 'Lost'].includes(s)).map(stage => {
      const stageDeals = openDeals.filter(d => d.stage === stage);
      return { stage, count: stageDeals.length, value: stageDeals.reduce((s, d) => s + (d.value ?? 0), 0) };
    });
  }, [openDeals]);

  const updateCommentary = useCallback((slideIdx: number) => (value: string) => {
    setCommentary(prev => ({ ...prev, [slideIdx]: value }));
  }, []);

  const TOTAL_SLIDES = 6;
  const dateStr = format(new Date(), 'MMMM yyyy');

  const handleFullscreen = () => {
    const el = document.getElementById('narrative-container');
    if (el) el.requestFullscreen?.();
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (narrativeMode) {
    return (
      <div className="p-6 max-w-6xl mx-auto space-y-4 animate-fade-in">
        {/* Toolbar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setNarrativeMode(false); setCurrentSlide(0); }}
              className="gap-1.5"
            >
              <LayoutList className="h-3.5 w-3.5" />
              Standard View
            </Button>
            <span className="text-xs text-muted-foreground">
              Slide {currentSlide + 1} of {TOTAL_SLIDES}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={currentSlide === 0}
              onClick={() => setCurrentSlide(c => c - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={currentSlide === TOTAL_SLIDES - 1}
              onClick={() => setCurrentSlide(c => c + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleFullscreen}>
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Slide thumbnails */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {Array.from({ length: TOTAL_SLIDES }).map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              className={`flex-shrink-0 w-[120px] h-[68px] rounded border-2 transition-all overflow-hidden ${
                currentSlide === i
                  ? 'border-primary shadow-[0_0_12px_-3px_hsl(210,100%,56%/0.4)]'
                  : 'border-border opacity-60 hover:opacity-100'
              }`}
            >
              <ScaledSlide className="w-full h-full pointer-events-none">
                {renderSlide(i, TOTAL_SLIDES, dateStr, { totalPipeline, weightedPipeline, openDeals: openDeals.length, wonCount: wonDeals.length, wonValue: wonDeals.reduce((s, d) => s + (d.value ?? 0), 0), lostCount: lostDeals.length, winRate }, pipelineByStage, deals, wonDeals, lostDeals, commentary, () => () => {})}
              </ScaledSlide>
            </button>
          ))}
        </div>

        {/* Main slide */}
        <div id="narrative-container" className="rounded-lg border border-border overflow-hidden" style={{ aspectRatio: '16/9' }}>
          <ScaledSlide className="w-full h-full">
            {renderSlide(currentSlide, TOTAL_SLIDES, dateStr, { totalPipeline, weightedPipeline, openDeals: openDeals.length, wonCount: wonDeals.length, wonValue: wonDeals.reduce((s, d) => s + (d.value ?? 0), 0), lostCount: lostDeals.length, winRate }, pipelineByStage, deals, wonDeals, lostDeals, commentary, updateCommentary)}
          </ScaledSlide>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Executive Summary</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Board-ready pipeline overview · Enfactum Funnel Manager</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setNarrativeMode(true)}
          className="gap-1.5"
        >
          <Presentation className="h-3.5 w-3.5" />
          Narrative Mode
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPICard label="Total Pipeline" value={formatSGD(totalPipeline)} icon={DollarSign} accent />
        <KPICard label="Weighted Pipeline" value={formatSGD(weightedPipeline)} icon={TrendingUp} accent />
        <KPICard label="Open Deals" value={openDeals.length} icon={Target} accent />
        <KPICard label="Total Deals" value={deals.length} icon={AlertTriangle} />
      </div>

      <div className="data-panel">
        <h2 className="consulting-headline mb-4">Pipeline by Stage</h2>
        <div className="space-y-2.5">
          {pipelineByStage.map(s => {
            const pct = totalPipeline > 0 ? (s.value / totalPipeline) * 100 : 0;
            return (
              <div key={s.stage} className="flex items-center gap-3">
                <div className="w-36 flex-shrink-0"><StageBadge stage={s.stage} /></div>
                <div className="flex-1 h-5 rounded bg-muted overflow-hidden">
                  <div className="h-full rounded bg-primary/60 transition-all duration-500" style={{ width: `${Math.max(pct, 1.5)}%` }} />
                </div>
                <div className="w-24 text-right sgd-value text-xs">{formatSGD(s.value)}</div>
                <div className="w-12 text-right text-[11px] text-muted-foreground">{s.count}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="data-panel">
          <h2 className="consulting-headline mb-3">Top 5 Deals</h2>
          <table className="w-full table-compact">
            <thead><tr><th className="text-left">Deal</th><th className="text-right">Value</th><th className="text-right">Win%</th></tr></thead>
            <tbody>
              {openDeals
                .sort((a, b) => (b.value ?? 0) - (a.value ?? 0))
                .slice(0, 5)
                .map(d => (
                  <tr key={d.id}>
                    <td>
                      <Link to={`/opportunity/${d.id}`} className="text-primary hover:underline text-sm">{d.title}</Link>
                      <p className="text-[10px] text-muted-foreground">{d.account_name}</p>
                    </td>
                    <td className="text-right sgd-value text-sm">{formatSGD(d.value ?? 0)}</td>
                    <td className="text-right text-muted-foreground font-mono text-sm">{Math.round((d.win_probability ?? 0) * 100)}%</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        <div className="data-panel">
          <h2 className="consulting-headline mb-3">Win / Loss</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center p-4 rounded bg-success/10 border border-success/20">
              <p className="text-2xl font-bold text-success">{wonDeals.length}</p>
              <p className="text-[11px] text-muted-foreground mt-1">Won</p>
              <p className="text-xs sgd-value font-semibold mt-0.5">{formatSGD(wonDeals.reduce((s, d) => s + (d.value ?? 0), 0))}</p>
            </div>
            <div className="text-center p-4 rounded bg-destructive/10 border border-destructive/20">
              <p className="text-2xl font-bold text-destructive">{lostDeals.length}</p>
              <p className="text-[11px] text-muted-foreground mt-1">Lost</p>
              <p className="text-xs sgd-value font-semibold mt-0.5">{formatSGD(lostDeals.reduce((s, d) => s + (d.value ?? 0), 0))}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper to render the correct slide by index
function renderSlide(
  index: number,
  total: number,
  dateStr: string,
  metrics: any,
  stages: any[],
  deals: any[],
  wonDeals: any[],
  lostDeals: any[],
  commentary: Record<number, string>,
  updateCommentary: (idx: number) => (v: string) => void,
) {
  switch (index) {
    case 0:
      return <TitleSlide slideNumber={1} totalSlides={total} date={dateStr} />;
    case 1:
      return <KPISlide slideNumber={2} totalSlides={total} metrics={metrics} commentary={commentary[1] ?? ''} onCommentaryChange={updateCommentary(1)} />;
    case 2:
      return <FunnelSlide slideNumber={3} totalSlides={total} stages={stages} totalPipeline={metrics.totalPipeline} commentary={commentary[2] ?? ''} onCommentaryChange={updateCommentary(2)} />;
    case 3:
      return <TopDealsSlide slideNumber={4} totalSlides={total} deals={deals} commentary={commentary[3] ?? ''} onCommentaryChange={updateCommentary(3)} />;
    case 4:
      return <WinLossSlide slideNumber={5} totalSlides={total} wonDeals={wonDeals} lostDeals={lostDeals} commentary={commentary[4] ?? ''} onCommentaryChange={updateCommentary(4)} />;
    case 5:
      return <MDFSlide slideNumber={6} totalSlides={total} deals={deals} commentary={commentary[5] ?? ''} onCommentaryChange={updateCommentary(5)} />;
      return null;
  }
}
