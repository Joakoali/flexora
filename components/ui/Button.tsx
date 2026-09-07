import type { ComponentProps, ReactNode } from "react";

type Variant = "primary" | "secondary";

type Common = { variant?: Variant; className?: string; children: ReactNode };

type LinkProps = Common & {
  href: string;
  external?: boolean;
} & Omit<ComponentProps<"a">, "className" | "children" | "href" | "target" | "rel">;

type ButtonProps = Common & {
  href?: undefined;
  external?: undefined;
} & Omit<ComponentProps<"button">, "className" | "children" | "type">;

export type Props = LinkProps | ButtonProps;

export function Button(props: Props) {
  const { variant = "primary", className = "", children, href, external, ...rest } = props;
  const classes = `btn btn-${variant} ${className}`.trim();
  if (href !== undefined) {
    return (
      <a
        href={href}
        className={classes}
        {...rest}
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
