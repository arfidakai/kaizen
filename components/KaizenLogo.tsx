import React from "react";

interface KShapeProps {
  color?: string;
}

function KShape({ color = "white" }: KShapeProps) {
  return (
    <g>
      {/* Vertical bar */}
      <rect x="8" y="6" width="12" height="48" rx="6" fill={color} />
      {/* Upper diagonal arm */}
      <polygon points="17,27 52,6 58,18 22,33" fill={color} />
      {/* Lower diagonal arm */}
      <polygon points="17,33 22,33 58,54 52,66" fill={color} />
      {/* Round caps on arm tips */}
      <circle cx="55" cy="12" r="6" fill={color} />
      <circle cx="55" cy="60" r="6" fill={color} />
      {/* Elbow joint */}
      <circle cx="20" cy="30" r="6" fill={color} />
    </g>
  );
}

interface LogoIconProps {
  size?: number;
  className?: string;
}

/** Square app icon — use for favicons, app icons, avatar */
export function KaizenIcon({ size = 120, className }: LogoIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect width="120" height="120" rx="30" fill="#111111" />
      <circle cx="95" cy="22" r="38" fill="white" fillOpacity="0.08" />
      <g transform="translate(28, 24) scale(0.72)">
        <KShape color="white" />
      </g>
      {/* Spark dot */}
      <circle cx="88" cy="22" r="7" fill="white" fillOpacity="0.95" />
      <circle cx="88" cy="22" r="3.5" fill="#111111" />
    </svg>
  );
}

interface LogoHorizontalProps {
  width?: number;
  className?: string;
}

/** Horizontal lockup — icon + wordmark + tagline */
export function KaizenHorizontal({ width = 300, className }: LogoHorizontalProps) {
  return (
    <svg
      width={width}
      height={Math.round(width * (88 / 300))}
      viewBox="0 0 300 88"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Icon */}
      <rect x="0" y="4" width="80" height="80" rx="20" fill="#111111" />
      <circle cx="66" cy="20" r="30" fill="white" fillOpacity="0.08" />
      <g transform="translate(12, 14) scale(0.77)">
        <KShape color="white" />
      </g>
      <circle cx="68" cy="20" r="6" fill="white" fillOpacity="0.95" />
      <circle cx="68" cy="20" r="3" fill="#111111" />

      {/* Wordmark */}
      <text
        x="100"
        y="55"
        fontFamily="'Plus Jakarta Sans', sans-serif"
        fontWeight="800"
        fontSize="38"
        fill="#111111"
        letterSpacing="-1"
      >
        kaizen
      </text>

      {/* Tagline */}
      <text
        x="102"
        y="73"
        fontFamily="'Plus Jakarta Sans', sans-serif"
        fontWeight="500"
        fontSize="11"
        fill="#111111"
        fillOpacity="0.4"
        letterSpacing="2.5"
      >
        1% BETTER EVERY DAY
      </text>
    </svg>
  );
}

/** Wordmark only — just "kaizen" text, no icon */
export function KaizenWordmark({
  color = "#111111",
  fontSize = 38,
  className,
}: {
  color?: string;
  fontSize?: number;
  className?: string;
}) {
  return (
    <svg
      width={fontSize * 4.2}
      height={fontSize * 1.4}
      viewBox={`0 0 ${fontSize * 4.2} ${fontSize * 1.4}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <text
        x="0"
        y={fontSize}
        fontFamily="'Plus Jakarta Sans', sans-serif"
        fontWeight="800"
        fontSize={fontSize}
        fill={color}
        letterSpacing="-1"
      >
        kaizen
      </text>
    </svg>
  );
}

/** Default export — icon only */
export default KaizenIcon;
