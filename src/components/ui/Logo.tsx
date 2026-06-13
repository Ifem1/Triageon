"use client";

interface LogoMarkProps {
  size?: number;
}

export function LogoMark({ size = 32 }: LogoMarkProps) {
  const s = size / 160;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 160 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Fragment 1 — top half, shifted up-left */}
      <g transform="translate(-4,-4)">
        <polygon
          points="80,18 112,36 108,72 55,56 48,36"
          fill="#032221"
          stroke="#FFC71F"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        <circle cx="80"  cy="18" r="4.5" fill="#FFC71F" />
        <circle cx="112" cy="36" r="3"   fill="#FFC71F" opacity="0.55" />
        <circle cx="48"  cy="36" r="3"   fill="#FFC71F" opacity="0.55" />
      </g>
      {/* Fragment 2 — bottom half, shifted down-right */}
      <g transform="translate(4,4)">
        <polygon
          points="108,72 112,90 80,108 48,90 55,56"
          fill="#032221"
          stroke="#FFC71F"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        <circle cx="80" cy="108" r="4.5" fill="#FFC71F" />
        <circle cx="112" cy="90" r="3"   fill="#FFC71F" opacity="0.55" />
        <circle cx="48"  cy="90" r="3"   fill="#FFC71F" opacity="0.55" />
      </g>
    </svg>
  );
}

interface LogoProps {
  size?: number;
  showWordmark?: boolean;
}

export function Logo({ size = 32, showWordmark = true }: LogoProps) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <LogoMark size={size} />
      {showWordmark && (
        <span
          style={{
            fontFamily: "var(--font-syne), sans-serif",
            fontWeight: 800,
            fontSize: size * 0.6,
            letterSpacing: "0.08em",
            color: "var(--text-primary)",
            lineHeight: 1,
          }}
        >
          Triageon
        </span>
      )}
    </div>
  );
}
