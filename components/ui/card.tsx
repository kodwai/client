import { HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  accent?: boolean;
}

function Card({ accent = false, className = "", children, ...props }: CardProps) {
  return (
    <div
      className={`bg-white/50 border border-border p-4 sm:p-6 md:p-8 ${
        accent ? "border-l-2 border-l-rust" : ""
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export { Card };
export type { CardProps };
