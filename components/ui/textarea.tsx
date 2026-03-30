"use client";

import { TextareaHTMLAttributes, forwardRef } from "react";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, className = "", id, ...props }, ref) => {
    const textareaId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="space-y-2">
        {label && (
          <label
            htmlFor={textareaId}
            className="block font-mono text-xs uppercase tracking-widest text-muted"
          >
            {label}
          </label>
        )}
        {hint && (
          <p className="font-mono text-xs text-muted/70">{hint}</p>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={`w-full border-b-2 border-border bg-transparent py-2 font-display text-lg text-ink outline-none transition-colors placeholder:text-muted/50 focus:border-rust resize-y ${
            error ? "border-rust" : ""
          } ${className}`}
          {...props}
        />
        {error && (
          <p className="font-mono text-xs text-rust">{error}</p>
        )}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";

export { Textarea };
export type { TextareaProps };
