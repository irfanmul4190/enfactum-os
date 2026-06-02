import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

interface KPIs {
  pipelineValue: number;
  weightedPipeline: number;
  wonThisMonthCount: number;
  wonThisMonthValue: number;
  lostThisMonthCount: number;
  lostThisMonthValue: number;
  avgDealSize: number;
  avgMargin: number;
}

interface FunnelItem {
  stage: string;
  count: number;
  value: number;
  conversion: number | null;
}

interface TopDeal {
  title: string;
  account_name: string;
  stage: string;
  value: number;
  owner_name: string;
  win_probability: number;
}

interface MdfStats {
  count: number;
  pipelineValue: number;
  estimatedMdf: number;
}

interface WinRateMonth {
  label: string;
  winRate: number;
  won: number;
  total: number;
}

interface LossReason {
  reason: string;
  count: number;
}

interface BoardPackData {
  kpis: KPIs;
  funnel: FunnelItem[];
  topDeals: TopDeal[];
  mdfStats: MdfStats;
  winRateByMonth: WinRateMonth[];
  lossReasons: LossReason[];
  dateRangeLabel: string;
  generatedBy: string;
}

const BRAND_NAVY = [17, 24, 39] as const;     // hsl(222, 40%, 11%) approx
const BRAND_DARK = [22, 30, 45] as const;
const BRAND_ACCENT = [59, 130, 246] as const;  // blue accent
const WHITE = [255, 255, 255] as const;
const LIGHT_GRAY = [156, 163, 175] as const;
const MID_GRAY = [100, 116, 139] as const;
const GREEN = [34, 197, 94] as const;
const AMBER = [245, 158, 11] as const;
const RED = [239, 68, 68] as const;

function fmtSGD(v: number): string {
  return new Intl.NumberFormat('en-SG', { style: 'currency', currency: 'SGD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v);
}

export function generateBoardPackPdf(data: BoardPackData) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const W = 297;
  const H = 210;
  const MARGIN = 15;

  // ─── PAGE 1: COVER ───
  doc.setFillColor(...BRAND_NAVY);
  doc.rect(0, 0, W, H, 'F');

  // Brand stripe
  doc.setFillColor(...BRAND_ACCENT);
  doc.rect(0, 0, 6, H, 'F');

  doc.setTextColor(...WHITE);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('enfactum', MARGIN + 10, 45);

  doc.setFontSize(32);
  doc.text('Pipeline Board Pack', MARGIN + 10, 70);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(14);
  doc.setTextColor(...LIGHT_GRAY);
  doc.text(`en·Flow Executive Summary`, MARGIN + 10, 85);

  doc.setFontSize(11);
  doc.text(`Period: ${data.dateRangeLabel}`, MARGIN + 10, 100);
  doc.text(`Generated: ${format(new Date(), 'dd MMM yyyy, HH:mm')}`, MARGIN + 10, 108);
  doc.text(`Prepared by: ${data.generatedBy}`, MARGIN + 10, 116);

  // Confidential footer
  doc.setFontSize(8);
  doc.setTextColor(80, 80, 80);
  doc.text('CONFIDENTIAL — For internal use only', MARGIN + 10, H - 15);

  // ─── PAGE 2: KEY METRICS ───
  doc.addPage();
  drawPageBg(doc, W, H);
  drawHeader(doc, 'Key Performance Indicators', MARGIN);

  const kpiCards = [
    { label: 'Pipeline Value', value: fmtSGD(data.kpis.pipelineValue) },
    { label: 'Weighted Pipeline', value: fmtSGD(data.kpis.weightedPipeline) },
    { label: 'Won This Period', value: `${data.kpis.wonThisMonthCount} deals · ${fmtSGD(data.kpis.wonThisMonthValue)}` },
    { label: 'Lost This Period', value: `${data.kpis.lostThisMonthCount} deals · ${fmtSGD(data.kpis.lostThisMonthValue)}` },
    { label: 'Avg Deal Size', value: fmtSGD(data.kpis.avgDealSize) },
    { label: 'Avg Margin', value: `${data.kpis.avgMargin.toFixed(1)}%` },
  ];

  const cardW = (W - MARGIN * 2 - 20) / 3;
  const cardH = 35;
  kpiCards.forEach((card, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = MARGIN + col * (cardW + 10);
    const y = 45 + row * (cardH + 10);

    doc.setFillColor(...BRAND_DARK);
    doc.roundedRect(x, y, cardW, cardH, 3, 3, 'F');

    // Accent top stripe
    doc.setFillColor(...BRAND_ACCENT);
    doc.rect(x, y, cardW, 2, 'F');

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...LIGHT_GRAY);
    doc.text(card.label.toUpperCase(), x + 8, y + 12);

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...WHITE);
    doc.text(card.value, x + 8, y + 26);
  });

  // MDF Summary box
  const mdfY = 45 + 2 * (cardH + 10) + 10;
  doc.setFillColor(...BRAND_DARK);
  doc.roundedRect(MARGIN, mdfY, W - MARGIN * 2, 30, 3, 3, 'F');

  doc.setFillColor(...AMBER);
  doc.rect(MARGIN, mdfY, 3, 30, 'F');

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...AMBER);
  doc.text('MDF OPPORTUNITY TRACKER', MARGIN + 10, mdfY + 12);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...WHITE);
  doc.setFontSize(10);
  doc.text(`${data.mdfStats.count} MDF-eligible deals`, MARGIN + 10, mdfY + 22);
  doc.text(`Pipeline: ${fmtSGD(data.mdfStats.pipelineValue)}`, MARGIN + 90, mdfY + 22);
  doc.text(`Estimated MDF: ${fmtSGD(data.mdfStats.estimatedMdf)}`, MARGIN + 180, mdfY + 22);

  // ─── PAGE 3: PIPELINE FUNNEL ───
  doc.addPage();
  drawPageBg(doc, W, H);
  drawHeader(doc, 'Pipeline Funnel Analysis', MARGIN);

  const funnelStartY = 50;
  const funnelH = 16;
  const funnelMaxW = W - MARGIN * 2 - 80;
  const maxCount = Math.max(...data.funnel.map(f => f.count), 1);

  const funnelColors: [number, number, number][] = [
    [59, 130, 246],   // blue
    [6, 182, 212],    // cyan
    [20, 184, 166],   // teal
    [34, 197, 94],    // green
    [22, 163, 74],    // dark green
  ];

  data.funnel.forEach((item, i) => {
    const y = funnelStartY + i * (funnelH + 8);
    const barW = Math.max((item.count / maxCount) * funnelMaxW, 40);
    const color = funnelColors[i] ?? funnelColors[0];

    // Stage label
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...WHITE);
    doc.text(item.stage, MARGIN, y + 10, { align: 'left' });

    // Bar
    const barX = MARGIN + 45;
    doc.setFillColor(...color);
    doc.roundedRect(barX, y, barW, funnelH, 2, 2, 'F');

    // Value inside bar
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...WHITE);
    doc.text(`${item.count} deals · ${fmtSGD(item.value)}`, barX + 5, y + 10);

    // Conversion rate
    if (item.conversion != null) {
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...LIGHT_GRAY);
      doc.text(`${item.conversion}% →`, barX + barW + 5, y + 10);
    }
  });

  // Win Rate section
  const wrY = funnelStartY + data.funnel.length * (funnelH + 8) + 15;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...WHITE);
  doc.text('Win Rate by Month', MARGIN, wrY);

  autoTable(doc, {
    startY: wrY + 5,
    margin: { left: MARGIN, right: W / 2 + 10 },
    head: [['Month', 'Win Rate', 'Won', 'Total']],
    body: data.winRateByMonth.map(m => [m.label, `${m.winRate}%`, String(m.won), String(m.total)]),
    theme: 'plain',
    styles: { fontSize: 9, textColor: [...WHITE] as [number, number, number], cellPadding: 3 },
    headStyles: { fillColor: [...BRAND_DARK] as [number, number, number], textColor: [...BRAND_ACCENT] as [number, number, number], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [25, 33, 50] as [number, number, number] },
  });

  // Loss Reasons
  if (data.lossReasons.length > 0) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...WHITE);
    doc.text('Top Loss Reasons', W / 2 + 10, wrY);

    autoTable(doc, {
      startY: wrY + 5,
      margin: { left: W / 2 + 10, right: MARGIN },
      head: [['Reason', 'Count']],
      body: data.lossReasons.map(l => [l.reason, String(l.count)]),
      theme: 'plain',
      styles: { fontSize: 9, textColor: [...WHITE] as [number, number, number], cellPadding: 3 },
      headStyles: { fillColor: [...BRAND_DARK] as [number, number, number], textColor: [...RED] as [number, number, number], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [25, 33, 50] as [number, number, number] },
    });
  }

  // ─── PAGE 4: TOP DEALS ───
  doc.addPage();
  drawPageBg(doc, W, H);
  drawHeader(doc, 'Top Deals by Value', MARGIN);

  autoTable(doc, {
    startY: 45,
    margin: { left: MARGIN, right: MARGIN },
    head: [['Deal Title', 'Account', 'Stage', 'Value', 'Win Prob.', 'Owner']],
    body: data.topDeals.map(d => [
      d.title,
      d.account_name,
      d.stage,
      fmtSGD(d.value),
      `${Math.round(d.win_probability * 100)}%`,
      d.owner_name,
    ]),
    theme: 'plain',
    styles: { fontSize: 9, textColor: [...WHITE] as [number, number, number], cellPadding: 4 },
    headStyles: { fillColor: [...BRAND_DARK] as [number, number, number], textColor: [...BRAND_ACCENT] as [number, number, number], fontStyle: 'bold', fontSize: 10 },
    alternateRowStyles: { fillColor: [25, 33, 50] as [number, number, number] },
    columnStyles: {
      0: { cellWidth: 65 },
      3: { halign: 'right', fontStyle: 'bold' },
      4: { halign: 'center' },
    },
  });

  // Commentary area
  const tableEndY = (doc as any).lastAutoTable?.finalY ?? 120;
  const commentY = tableEndY + 15;
  doc.setFillColor(...BRAND_DARK);
  doc.roundedRect(MARGIN, commentY, W - MARGIN * 2, 40, 3, 3, 'F');

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...BRAND_ACCENT);
  doc.text('COMMENTARY & NOTES', MARGIN + 8, commentY + 12);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(...MID_GRAY);
  doc.text('Use this space to add board-level commentary, strategic observations, or action items.', MARGIN + 8, commentY + 22);
  doc.text('_______________________________________________________________________________________________________________', MARGIN + 8, commentY + 32);

  // Footer on all pages
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(80, 80, 80);
    doc.text(`enfactum · Board Pack · ${format(new Date(), 'dd MMM yyyy')}`, MARGIN, H - 8);
    doc.text(`Page ${i} of ${pageCount}`, W - MARGIN, H - 8, { align: 'right' });
  }

  doc.save(`enfactum-board-pack-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
}

function drawPageBg(doc: jsPDF, w: number, h: number) {
  doc.setFillColor(...BRAND_NAVY);
  doc.rect(0, 0, w, h, 'F');
  // Subtle left accent
  doc.setFillColor(...BRAND_ACCENT);
  doc.rect(0, 0, 3, h, 'F');
}

function drawHeader(doc: jsPDF, title: string, margin: number) {
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...WHITE);
  doc.text(title, margin + 5, 30);

  // Divider
  doc.setDrawColor(...BRAND_ACCENT);
  doc.setLineWidth(0.5);
  doc.line(margin + 5, 35, 150, 35);
}
