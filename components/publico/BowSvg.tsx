export function BowSvg({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Left loop */}
      <path
        d="M100 60 C80 20, 20 10, 15 45 C10 75, 55 85, 100 60Z"
        fill="currentColor"
        opacity="0.15"
      />
      <path
        d="M100 60 C80 20, 20 10, 15 45 C10 75, 55 85, 100 60Z"
        stroke="currentColor"
        strokeWidth="2"
        opacity="0.3"
        fill="none"
      />
      {/* Right loop */}
      <path
        d="M100 60 C120 20, 180 10, 185 45 C190 75, 145 85, 100 60Z"
        fill="currentColor"
        opacity="0.15"
      />
      <path
        d="M100 60 C120 20, 180 10, 185 45 C190 75, 145 85, 100 60Z"
        stroke="currentColor"
        strokeWidth="2"
        opacity="0.3"
        fill="none"
      />
      {/* Center knot */}
      <ellipse
        cx="100"
        cy="60"
        rx="12"
        ry="10"
        fill="currentColor"
        opacity="0.25"
      />
      <ellipse
        cx="100"
        cy="60"
        rx="12"
        ry="10"
        stroke="currentColor"
        strokeWidth="2"
        opacity="0.4"
        fill="none"
      />
      {/* Tails */}
      <path
        d="M92 68 C85 90, 75 110, 70 115"
        stroke="currentColor"
        strokeWidth="2"
        opacity="0.3"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M108 68 C115 90, 125 110, 130 115"
        stroke="currentColor"
        strokeWidth="2"
        opacity="0.3"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}
