import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { STATUS_PIPELINE } from "@/lib/types";

interface StatusPipelineProps {
  currentStatus: string;
}

export function StatusPipeline({ currentStatus }: StatusPipelineProps) {
  const currentIndex = STATUS_PIPELINE.findIndex((s) => s.key === currentStatus);
  // For expired, show all stages as completed up to active
  const isExpired = currentStatus === "expired";
  const effectiveIndex = isExpired ? STATUS_PIPELINE.length : currentIndex;

  return (
    <div className="w-full overflow-x-auto">
      <div className="flex items-center min-w-[600px] gap-0">
        {STATUS_PIPELINE.map((stage, i) => {
          const isPast = i < effectiveIndex;
          const isCurrent = i === currentIndex && !isExpired;
          const isFuture = !isPast && !isCurrent;

          return (
            <div key={stage.key} className="flex items-center flex-1">
              {/* Node */}
              <div className="flex flex-col items-center gap-1.5 flex-1">
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold border-2 transition-all",
                    isPast && "bg-success border-success text-success-foreground",
                    isCurrent && "bg-primary border-primary text-primary-foreground ring-4 ring-primary/20",
                    isFuture && "bg-muted border-border text-muted-foreground"
                  )}
                >
                  {isPast ? <Check className="h-4 w-4" /> : i + 1}
                </div>
                <span
                  className={cn(
                    "text-[10px] font-medium text-center leading-tight max-w-[80px]",
                    isPast && "text-success",
                    isCurrent && "text-primary",
                    isFuture && "text-muted-foreground"
                  )}
                >
                  {stage.label}
                </span>
              </div>
              {/* Connector line */}
              {i < STATUS_PIPELINE.length - 1 && (
                <div
                  className={cn(
                    "h-0.5 flex-1 min-w-[20px] -mx-1",
                    i < effectiveIndex - 1 || (i < effectiveIndex && isPast)
                      ? "bg-success"
                      : i === effectiveIndex - 1 && isCurrent
                      ? "bg-primary"
                      : "bg-border"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
      {isExpired && (
        <div className="mt-3 text-center">
          <span className="text-xs font-medium text-destructive bg-destructive/10 px-3 py-1 rounded-full">
            Expired
          </span>
        </div>
      )}
    </div>
  );
}
