import type { ComponentProps, ReactNode } from "react";

type Variant = "primary" | "secondary";

type Props = {
  variant?: Variant;
  href?: string;
  external?: boolean;
  className?: string;
  children: ReactNode;
} & Omit<ComponentProps<"button">, "className" | "children">;

export function Button({ variant = "primary", href, external, className = "", children, ...rest }: Props) {
  const classes = `btn btn-${variant} ${className}`.trim();
  if (href) {
    return (
      <a
        href={href}
        className={classes}
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      >
        {children}
      </a>
    );
  }
  return (
    <button type="button" className={classes} {...rest}>
      {children}
    </button>
  );
}
