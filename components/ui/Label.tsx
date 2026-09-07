import type { ReactNode } from "react";

export function Label({ as: Tag = "span", children, className = "" }: { as?: "span" | "p"; children: ReactNode; className?: string }) {
  return <Tag className={`label ${className}`.trim()}>{children}</Tag>;
}
