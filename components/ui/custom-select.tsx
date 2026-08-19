"use client";

import * as React from "react";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CustomSelectOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface CustomSelectProps {
  id?: string;
  name?: string;
  value: string;
  onChange: (value: string) => void;
  options: CustomSelectOption[] | string[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function CustomSelect({
  id,
  name,
  value,
  onChange,
  options,
  placeholder = "Select an option",
  className,
  disabled = false,
  onOpenChange,
}: CustomSelectProps) {
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const toggleOpen = () => {
    const nextState = !open;
    setOpen(nextState);
    if (onOpenChange) onOpenChange(nextState);
  };

  const closeSelect = () => {
    setOpen(false);
    if (onOpenChange) onOpenChange(false);
  };

  // Normalize options to object format
  const normalizedOptions: CustomSelectOption[] = React.useMemo(() => {
    return options.map((opt) =>
      typeof opt === "string" ? { value: opt, label: opt } : opt,
    );
  }, [options]);

  const selectedOption = normalizedOptions.find((o) => o.value === value);

  // Close when clicking outside or pressing Escape
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        closeSelect();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeSelect();
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div
      ref={containerRef}
      className={cn("relative w-full inline-block", open ? "z-[99]" : "z-auto")}
    >
      {/* Hidden input for HTML form submissions */}
      {name && <input type="hidden" id={id} name={name} value={value} />}

      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={toggleOpen}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-3.5 text-xs font-extrabold text-slate-800 shadow-2xs transition-all hover:border-indigo-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed",
          open && "border-indigo-500 ring-4 ring-indigo-100",
          className,
        )}
      >
        <span className="truncate flex items-center gap-2">
          {selectedOption ? (
            <>
              {selectedOption.icon}
              <span>{selectedOption.label}</span>
            </>
          ) : (
            <span className="text-slate-400 font-semibold">{placeholder}</span>
          )}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-indigo-600 transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>

      {/* Floating Dropdown Popover Menu */}
      {open && (
        <div className="absolute left-0 top-full z-[100] mt-1.5 w-full min-w-[160px] overflow-hidden rounded-2xl border-2 border-slate-900/10 bg-white p-1.5 shadow-2xl shadow-indigo-950/20 animate-in fade-in-50 zoom-in-95">
          <div className="max-h-56 overflow-y-auto space-y-0.5 pr-1">
            {normalizedOptions.map((option) => {
              const isSelected = option.value === value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    closeSelect();
                  }}
                  className={cn(
                    "flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-bold transition-colors cursor-pointer text-left",
                    isSelected
                      ? "bg-indigo-600 text-white font-extrabold"
                      : "text-slate-700 hover:bg-indigo-50 hover:text-indigo-950",
                  )}
                >
                  <span className="flex items-center gap-2 truncate">
                    {option.icon}
                    <span>{option.label}</span>
                  </span>
                  {isSelected && <Check className="h-3.5 w-3.5 shrink-0 text-white stroke-[3]" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
