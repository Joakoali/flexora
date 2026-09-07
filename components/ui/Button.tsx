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
  const variant = props.variant ?? "primary";
  const className = props.className ?? "";
  const classes = `btn btn-${variant} ${className}`.trim();
  if (props.href !== undefined) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { href, external, variant: _variant, className: _className, children, ...rest } = props;
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { href: _href, external: _external, variant: _variant, className: _className, children, ...rest } = props;
  return (
    <button type="button" className={classes} {...rest}>
      {children}
    </button>
  );
}
