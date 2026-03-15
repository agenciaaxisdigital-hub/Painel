import { useState } from "react";
import { Calendar } from "lucide-react";

interface DateRangeSelectorProps {
  selectedDays: number;
  onChange: (days: number) => void;
}

const presets = [
  { label: "Hoje", days: 1 },
  { label: "7 dias", days: 7 },
  { label: "30 dias", days: 30 },
  { label: "3 meses", days: 90 },
];

export function DateRangeSelector({ selectedDays, onChange }: DateRangeSelectorProps) {
  return (
    <div className="flex items-center gap-2">
      <Calendar className="h-4 w-4 text-muted-foreground" />
      <div className="flex gap-1">
        {presets.map((p) => (
          <button
            key={p.days}
            onClick={() => onChange(p.days)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              selectedDays === p.days
                ? "bg-primary text-primary-foreground"
                : "bg-white/[0.04] text-muted-foreground hover:text-foreground"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}
