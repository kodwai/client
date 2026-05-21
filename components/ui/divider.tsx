import { HTMLAttributes } from "react";

function Divider({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`w-12 h-px bg-rust mx-auto ${className}`}
      {...props}
    />
  );
}

export { Divider };
