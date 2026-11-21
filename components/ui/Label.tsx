import type { ReactNode } from "react";

export function Label({
  as: Tag = "span",
  children,
  className = "",
  "aria-hidden": ariaHidden,
}: {
  as?: "span" | "p";
  children: ReactNode;
  className?: string;
  "aria-hidden"?: boolean;
}) {
  return (
    <Tag className={`label ${className}`.trim()} aria-hidden={ariaHidden}>
      {children}
    </Tag>
  );
}
