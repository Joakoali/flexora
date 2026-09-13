import { FlexMark } from "./FlexMark";

type Props = { id?: string; className?: string; title: string };

export function Logo({ id = "site-logo", className = "", title }: Props) {
  return (
    <span id={id} className={`logo ${className}`.trim()} role="img" aria-label={title}>
      <FlexMark className="logo__mark" />
      <svg className="logo__wordmark" viewBox="0 0 320 44" aria-hidden="true">
        <text
          x="0"
          y="38"
          fontFamily="var(--font-anybody)"
          fontWeight="800"
          fontSize="44"
          style={{ fontVariationSettings: '"wdth" 150' }}
          letterSpacing="-1"
        >
          <tspan fill="var(--accent)">FLEX</tspan>
          <tspan fill="currentColor">ORA</tspan>
        </text>
      </svg>
    </span>
  );
}
