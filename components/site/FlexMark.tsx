"use client";

import { useId } from "react";

type Props = {
  className?: string;
  classNameTop?: string;
  classNameBottom?: string;
};

export function FlexMark({ className = "", classNameTop = "", classNameBottom = "" }: Props) {
  const gradientId = useId();
  return (
    <svg
      className={`flex-mark ${className}`.trim()}
      viewBox="0 0 81 110"
      width="81"
      height="110"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#4878FF" />
          <stop offset=".55" stopColor="#6C4FFA" />
          <stop offset="1" stopColor="#A848EC" />
        </linearGradient>
      </defs>
      <path className={classNameTop} fill={`url(#${gradientId})`} d="M81 0 L66 26 C34 38 6 48 0 56 L0 50 C2 40 8 31 13 26 Z" />
      <path className={classNameBottom} fill={`url(#${gradientId})`} d="M59 40 L42 66 L15 77 C15 88 10 100 1 110 L0 78 C2 68 14 52 51 42 Z" />
    </svg>
  );
}
