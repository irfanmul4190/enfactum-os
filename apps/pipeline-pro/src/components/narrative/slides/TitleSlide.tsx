import { SlideLayout } from '../SlideLayout';

interface TitleSlideProps {
  slideNumber: number;
  totalSlides: number;
  date: string;
}

export function TitleSlide({ slideNumber, totalSlides, date }: TitleSlideProps) {
  return (
    <SlideLayout slideNumber={slideNumber} totalSlides={totalSlides}>
      <div className="flex flex-col items-center justify-center h-full px-[120px]">
        <div className="flex items-baseline gap-0 select-none mb-[24px]">
          <span className="text-[72px] font-bold tracking-tight text-[hsl(210,20%,92%)]">en</span>
          <span className="text-[72px] font-bold tracking-tight text-[hsl(210,100%,56%)]">fact</span>
          <span className="text-[72px] font-bold tracking-tight text-[hsl(210,20%,92%)]">um</span>
        </div>
        <h1 className="text-[54px] font-bold tracking-tight text-center mb-[16px]">
          Pipeline & Performance Review
        </h1>
        <p className="text-[24px] text-[hsl(215,12%,55%)] tracking-wider uppercase">
          Executive Summary · {date}
        </p>
        <div className="mt-[60px] w-[200px] h-[3px] bg-[hsl(210,100%,56%)] rounded-full" />
      </div>
    </SlideLayout>
  );
}
