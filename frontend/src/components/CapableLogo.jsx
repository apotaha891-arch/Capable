// Capable mark: a single continuous line forming a "C" — one open loop,
// rounded caps, no fill. Uses currentColor so it inherits text color
// (white on the navy hero, navy on light surfaces). Geometry: circle of
// radius 16 centered at 24,24 with a ~96° opening on the right.
export default function CapableLogo({ size = 24, strokeWidth = 6, className = '', title = 'Capable' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      role="img"
      aria-label={title}
      className={className}
    >
      <path
        d="M34.71 12.11 A16 16 0 1 0 34.71 35.89"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </svg>
  );
}
