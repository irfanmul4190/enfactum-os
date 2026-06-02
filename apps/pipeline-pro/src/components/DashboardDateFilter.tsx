import { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, subQuarters, subMonths } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export type DatePreset = 'this_month' | 'last_month' | 'this_quarter' | 'last_quarter' | 'ytd' | 'custom';

export interface DateRange {
  from: Date;
  to: Date;
  preset: DatePreset;
  label: string;
}

const PRESETS: { key: DatePreset; label: string; range: () => { from: Date; to: Date } }[] = [
  { key: 'this_month', label: 'This Month', range: () => ({ from: startOfMonth(new Date()), to: new Date() }) },
  { key: 'last_month', label: 'Last Month', range: () => {
    const d = subMonths(new Date(), 1);
    return { from: startOfMonth(d), to: endOfMonth(d) };
  }},
  { key: 'this_quarter', label: 'This Quarter', range: () => ({ from: startOfQuarter(new Date()), to: new Date() }) },
  { key: 'last_quarter', label: 'Last Quarter', range: () => {
    const d = subQuarters(new Date(), 1);
    return { from: startOfQuarter(d), to: endOfQuarter(d) };
  }},
  { key: 'ytd', label: 'Year to Date', range: () => ({ from: startOfYear(new Date()), to: new Date() }) },
];

interface DashboardDateFilterProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

export function getDefaultDateRange(): DateRange {
  const preset = PRESETS.find(p => p.key === 'this_quarter')!;
  const { from, to } = preset.range();
  return { from, to, preset: preset.key, label: preset.label };
}

export function DashboardDateFilter({ value, onChange }: DashboardDateFilterProps) {
  const [customFrom, setCustomFrom] = useState<Date | undefined>(value.from);
  const [customTo, setCustomTo] = useState<Date | undefined>(value.to);
  const [showCustom, setShowCustom] = useState(value.preset === 'custom');

  const handlePreset = (preset: typeof PRESETS[number]) => {
    const { from, to } = preset.range();
    setShowCustom(false);
    onChange({ from, to, preset: preset.key, label: preset.label });
  };

  const handleCustomApply = () => {
    if (customFrom && customTo) {
      onChange({
        from: customFrom,
        to: customTo,
        preset: 'custom',
        label: `${format(customFrom, 'MMM d')} – ${format(customTo, 'MMM d, yyyy')}`,
      });
    }
  };

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {PRESETS.map(p => (
        <Button
          key={p.key}
          size="sm"
          variant={value.preset === p.key ? 'default' : 'outline'}
          className="h-7 text-[11px] px-2.5"
          onClick={() => handlePreset(p)}
        >
          {p.label}
        </Button>
      ))}

      <Popover>
        <PopoverTrigger asChild>
          <Button
            size="sm"
            variant={value.preset === 'custom' ? 'default' : 'outline'}
            className="h-7 text-[11px] px-2.5"
            onClick={() => setShowCustom(true)}
          >
            <CalendarIcon className="h-3 w-3 mr-1" />
            {value.preset === 'custom' ? value.label : 'Custom'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <div className="p-3 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[11px] text-muted-foreground mb-1">From</p>
                <Calendar
                  mode="single"
                  selected={customFrom}
                  onSelect={setCustomFrom}
                  className={cn("p-2 pointer-events-auto")}
                />
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground mb-1">To</p>
                <Calendar
                  mode="single"
                  selected={customTo}
                  onSelect={setCustomTo}
                  className={cn("p-2 pointer-events-auto")}
                />
              </div>
            </div>
            <Button size="sm" className="w-full h-7 text-xs" onClick={handleCustomApply} disabled={!customFrom || !customTo}>
              Apply Range
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
