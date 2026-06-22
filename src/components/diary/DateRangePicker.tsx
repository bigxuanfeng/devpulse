"use client";

import { Calendar, X } from "lucide-react";

interface Props {
  dateFrom: string;
  dateTo: string;
  onDateFromChange: (date: string) => void;
  onDateToChange: (date: string) => void;
  onClear: () => void;
}

export function DateRangePicker({ dateFrom, dateTo, onDateFromChange, onDateToChange, onClear }: Props) {
  const handleFromChange = (value: string) => {
    onDateFromChange(value);
    if (value && !dateTo) onDateToChange(value);
    if (value && dateTo && value > dateTo) onDateToChange(value);
  };

  const handleToChange = (value: string) => {
    if (dateFrom && value && value < dateFrom) {
      onDateFromChange(value);
      onDateToChange(dateFrom);
    } else {
      onDateToChange(value);
    }
  };

  const showClear = dateFrom || dateTo;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs text-text-muted flex items-center gap-1">
          <Calendar size={11} /> 从
        </span>
        {showClear && (
          <button onClick={onClear} className="text-text-muted hover:text-text-secondary transition-colors duration-150">
            <X size={12} />
          </button>
        )}
      </div>
      <input
        type="date"
        value={dateFrom}
        onChange={(e) => handleFromChange(e.target.value)}
        className="w-full px-2 py-1 bg-bg-hover border border-border-default rounded-sm text-xs text-text-primary outline-none [color-scheme:dark] focus:border-accent"
      />
      <span className="text-xs text-text-muted block">至</span>
      <input
        type="date"
        value={dateTo}
        onChange={(e) => handleToChange(e.target.value)}
        className="w-full px-2 py-1 bg-bg-hover border border-border-default rounded-sm text-xs text-text-primary outline-none [color-scheme:dark] focus:border-accent"
      />
    </div>
  );
}
