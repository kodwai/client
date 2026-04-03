"use client";

import { useState } from "react";

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  label?: string;
  disabled?: boolean;
}

function StarRating({ value, onChange, label, disabled = false }: StarRatingProps) {
  const [hovered, setHovered] = useState(0);

  return (
    <div className="space-y-1.5">
      {label && (
        <p className="font-mono text-xs uppercase tracking-widest text-muted">{label}</p>
      )}
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = star <= (hovered || value);
          return (
            <button
              key={star}
              type="button"
              disabled={disabled}
              className={`transition-colors ${disabled ? "cursor-default" : "cursor-pointer"}`}
              onMouseEnter={() => !disabled && setHovered(star)}
              onMouseLeave={() => !disabled && setHovered(0)}
              onClick={() => onChange?.(star)}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill={filled ? "currentColor" : "none"}
                stroke="currentColor"
                strokeWidth="1.5"
                className={filled ? "text-rust" : "text-border"}
              >
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export { StarRating };
