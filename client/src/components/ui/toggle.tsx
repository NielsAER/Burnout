import * as React from "react";
import { cn } from "@/lib/utils";

export interface ToggleProps extends React.HTMLAttributes<HTMLLabelElement> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
}

const Toggle = React.forwardRef<HTMLLabelElement, ToggleProps>(
  ({ className, checked = false, onCheckedChange, disabled = false, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (onCheckedChange) {
        onCheckedChange(e.target.checked);
      }
    };

    return (
      <label
        ref={ref}
        className={cn(
          "relative inline-block w-11 h-6",
          disabled && "opacity-50 cursor-not-allowed",
          className
        )}
        {...props}
      >
        <input
          type="checkbox"
          className="opacity-0 w-0 h-0"
          checked={checked}
          onChange={handleChange}
          disabled={disabled}
        />
        <span
          className={cn(
            "absolute cursor-pointer top-0 left-0 right-0 bottom-0 rounded-full transition-all",
            checked ? "bg-emerald-500" : "bg-gray-300",
            !disabled && "cursor-pointer"
          )}
        >
          <span
            className={cn(
              "absolute h-5 w-5 bg-white rounded-full top-0.5 left-0.5 transform transition-transform",
              checked && "translate-x-5"
            )}
          />
        </span>
      </label>
    );
  }
);

Toggle.displayName = "Toggle";

export { Toggle };
