import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { HP_QUARTERS, getCurrentHPQuarter } from "@/lib/constants";
import { Calendar } from "lucide-react";

interface QuarterFilterProps {
  value: string;
  onValueChange: (value: string) => void;
  fiscalYear: number;
  onFiscalYearChange: (year: number) => void;
}

export function QuarterFilter({ value, onValueChange, fiscalYear, onFiscalYearChange }: QuarterFilterProps) {
  const currentYear = new Date().getFullYear();
  const years = [currentYear - 1, currentYear, currentYear + 1];

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Calendar className="h-4 w-4" />
        <span className="font-medium">HP Fiscal:</span>
      </div>
      
      <Select value={`FY${fiscalYear}`} onValueChange={(v) => onFiscalYearChange(parseInt(v.replace('FY', '')))}>
        <SelectTrigger className="w-28">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {years.map((year) => (
            <SelectItem key={year} value={`FY${year}`}>
              FY{year}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Select Quarter" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Quarters</SelectItem>
          {HP_QUARTERS.map((q) => (
            <SelectItem key={q.value} value={q.value}>
              {q.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
