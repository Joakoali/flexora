import type { ComponentProps } from "react";

export function TextLink({ className = "", ...rest }: ComponentProps<"a">) {
  return <a className={`text-link ${className}`.trim()} {...rest} />;
}
