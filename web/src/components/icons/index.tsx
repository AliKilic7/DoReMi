import type { SVGProps } from "react";

/**
 * DoReMi's hand-drawn SVG icon set. All icons render on a 24×24 grid,
 * inherit `currentColor`, and accept standard SVG props (className, aria-*).
 */

type IconProps = SVGProps<SVGSVGElement>;

function base(props: IconProps): IconProps {
  return {
    width: 24,
    height: 24,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": props["aria-label"] ? undefined : true,
    ...props,
  };
}

/** Brand mark — three ascending "notes" forming a rising wave. */
export function LogoIcon(props: IconProps) {
  return (
    <svg {...base(props)} fill="none" stroke="none">
      <defs>
        <linearGradient id="dm-logo-grad" x1="0" y1="24" x2="24" y2="0">
          <stop offset="0%" stopColor="#7c3aed" />
          <stop offset="55%" stopColor="#e879f9" />
          <stop offset="100%" stopColor="#22d3ee" />
        </linearGradient>
      </defs>
      <rect x="3" y="13" width="4" height="8" rx="2" fill="url(#dm-logo-grad)" />
      <rect x="10" y="8" width="4" height="13" rx="2" fill="url(#dm-logo-grad)" />
      <rect x="17" y="3" width="4" height="18" rx="2" fill="url(#dm-logo-grad)" />
    </svg>
  );
}

export function PlayIcon(props: IconProps) {
  return (
    <svg {...base(props)} fill="currentColor" stroke="none">
      <path d="M8.2 5.11c0-.95 1.03-1.54 1.85-1.06l11.1 6.39a1.22 1.22 0 0 1 0 2.12l-11.1 6.39c-.82.48-1.85-.11-1.85-1.06V5.11Z" />
    </svg>
  );
}

export function PauseIcon(props: IconProps) {
  return (
    <svg {...base(props)} fill="currentColor" stroke="none">
      <rect x="6" y="4.5" width="4" height="15" rx="1.4" />
      <rect x="14" y="4.5" width="4" height="15" rx="1.4" />
    </svg>
  );
}

export function SkipNextIcon(props: IconProps) {
  return (
    <svg {...base(props)} fill="currentColor" stroke="none">
      <path d="M5.5 6.03c0-.94 1.02-1.53 1.84-1.07l9.02 5.16a1.22 1.22 0 0 1 0 2.13l-9.02 5.16c-.82.47-1.84-.12-1.84-1.07V6.03Z" />
      <rect x="17" y="5" width="2.6" height="14" rx="1.2" />
    </svg>
  );
}

export function SkipPrevIcon(props: IconProps) {
  return (
    <svg {...base(props)} fill="currentColor" stroke="none">
      <path d="M18.5 6.03c0-.94-1.02-1.53-1.84-1.07l-9.02 5.16a1.22 1.22 0 0 0 0 2.13l9.02 5.16c.82.47 1.84-.12 1.84-1.07V6.03Z" />
      <rect x="4.4" y="5" width="2.6" height="14" rx="1.2" />
    </svg>
  );
}

export function ShuffleIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M3 7h3.2c1.3 0 2.5.63 3.24 1.7l4.12 5.9A3.96 3.96 0 0 0 16.8 16.3H20" />
      <path d="M3 17h3.2c1.3 0 2.5-.63 3.24-1.7l.56-.8" />
      <path d="M13 8.5l.56-.8A3.96 3.96 0 0 1 16.8 6H20" />
      <path d="M17.5 3.5 20 6l-2.5 2.5" />
      <path d="M17.5 13.8 20 16.3l-2.5 2.5" />
    </svg>
  );
}

export function RepeatIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M17 3.5 20 6l-3 2.5" />
      <path d="M4 13v-2a5 5 0 0 1 5-5h11" />
      <path d="M7 20.5 4 18l3-2.5" />
      <path d="M20 11v2a5 5 0 0 1-5 5H4" />
    </svg>
  );
}

export function HeartIcon({ filled = false, ...props }: IconProps & { filled?: boolean }) {
  return (
    <svg {...base(props)} fill={filled ? "currentColor" : "none"}>
      <path d="M12 20.2S3.5 15.2 3.5 9.3c0-2.9 2.2-5 4.9-5 1.5 0 2.8.7 3.6 1.8a4.5 4.5 0 0 1 3.6-1.8c2.7 0 4.9 2.1 4.9 5 0 5.9-8.5 10.9-8.5 10.9Z" />
    </svg>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="10.8" cy="10.8" r="6.8" />
      <path d="m20 20-3.9-3.9" />
    </svg>
  );
}

export function HomeIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 10.5 12 3.8l8 6.7" />
      <path d="M5.8 9v9.7a1.5 1.5 0 0 0 1.5 1.5h9.4a1.5 1.5 0 0 0 1.5-1.5V9" />
      <path d="M9.8 20.2v-5.4a1.2 1.2 0 0 1 1.2-1.2h2a1.2 1.2 0 0 1 1.2 1.2v5.4" />
    </svg>
  );
}

export function LibraryIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 3.8v16.4" />
      <path d="M9 3.8v16.4" />
      <path d="m13.6 4.6 4.9 15" />
    </svg>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

export function VolumeIcon({ level = 2, ...props }: IconProps & { level?: 0 | 1 | 2 }) {
  return (
    <svg {...base(props)}>
      <path
        d="M4 9.5v5h2.8l4.2 3.6V5.9L6.8 9.5H4Z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      {level >= 1 && <path d="M14.5 9.2a4 4 0 0 1 0 5.6" />}
      {level >= 2 && <path d="M17.2 6.6a7.5 7.5 0 0 1 0 10.8" />}
      {level === 0 && <path d="m15 9.5 5 5M20 9.5l-5 5" />}
    </svg>
  );
}

export function QueueIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 6.5h16" />
      <path d="M4 11.5h9" />
      <path d="M4 16.5h9" />
      <path d="M17.5 11.5v7" />
      <path d="M21 15.2c-1.2.9-2.3 1.3-3.5 1.3" />
      <circle cx="15.9" cy="18.5" r="1.7" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function SettingsIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M19.4 13.4a1.7 1.7 0 0 1 .34 1.87l-.63 1.09a1.7 1.7 0 0 1-1.72.83l-1.06-.15a6.6 6.6 0 0 1-1.13.65l-.4 1a1.7 1.7 0 0 1-1.58 1.06h-1.24a1.7 1.7 0 0 1-1.58-1.07l-.4-.99a6.6 6.6 0 0 1-1.13-.65l-1.06.15a1.7 1.7 0 0 1-1.72-.83l-.63-1.09a1.7 1.7 0 0 1 .14-1.9l.66-.84a6.7 6.7 0 0 1 0-1.3l-.66-.85a1.7 1.7 0 0 1-.14-1.9l.63-1.08a1.7 1.7 0 0 1 1.72-.84l1.06.15c.36-.25.74-.47 1.13-.64l.4-1A1.7 1.7 0 0 1 10.02 3h1.24c.7 0 1.32.42 1.58 1.06l.4 1c.4.17.77.39 1.13.64l1.06-.15a1.7 1.7 0 0 1 1.72.84l.63 1.09a1.7 1.7 0 0 1-.14 1.89l-.66.85a6.7 6.7 0 0 1 0 1.3l.42.88Z" />
    </svg>
  );
}

export function UserIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="8.2" r="3.8" />
      <path d="M5 20.2c.8-3.4 3.7-5.3 7-5.3s6.2 1.9 7 5.3" />
    </svg>
  );
}

export function ClockIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="8.2" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  );
}

export function NoteIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M9.5 17.6V5.8c0-.55.37-1.03.9-1.16l7.2-1.9c.76-.2 1.5.37 1.5 1.16v11.6" />
      <circle cx="6.7" cy="17.8" r="2.8" />
      <circle cx="16.3" cy="15.7" r="2.8" />
    </svg>
  );
}

export function SparklesIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 4.5 13.6 9l4.5 1.6-4.5 1.6L12 16.7l-1.6-4.5L5.9 10.6 10.4 9 12 4.5Z" />
      <path d="M18.8 15.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2Z" />
    </svg>
  );
}

export function WaveIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M3 12c1.5 0 1.5-4 3-4s1.5 8 3 8 1.5-10 3-10 1.5 12 3 12 1.5-8 3-8 1.5 2 3 2" />
    </svg>
  );
}

export function DevicesIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="3" y="5" width="13" height="9.5" rx="1.6" />
      <path d="M7.5 18h4" />
      <path d="M9.5 14.5V18" />
      <rect x="17" y="9" width="4.5" height="9" rx="1.4" />
    </svg>
  );
}

export function DownloadIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 4v11" />
      <path d="m7.5 11 4.5 4.5L16.5 11" />
      <path d="M5 19.5h14" />
    </svg>
  );
}

export function ArrowRightIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4.5 12h15" />
      <path d="m13.5 6 6 6-6 6" />
    </svg>
  );
}

export function ChevronDownIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="m6 9.5 6 6 6-6" />
    </svg>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="m6 6 12 12" />
      <path d="M18 6 6 18" />
    </svg>
  );
}

export function MenuIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 7h16" />
      <path d="M4 12h16" />
      <path d="M4 17h16" />
    </svg>
  );
}

export function EyeIcon({ off = false, ...props }: IconProps & { off?: boolean }) {
  return (
    <svg {...base(props)}>
      <path d="M3 12s3.3-6 9-6 9 6 9 6-3.3 6-9 6-9-6-9-6Z" />
      <circle cx="12" cy="12" r="2.7" />
      {off && <path d="M4.5 4.5l15 15" />}
    </svg>
  );
}

export function DotsIcon(props: IconProps) {
  return (
    <svg {...base(props)} fill="currentColor" stroke="none">
      <circle cx="5" cy="12" r="1.7" />
      <circle cx="12" cy="12" r="1.7" />
      <circle cx="19" cy="12" r="1.7" />
    </svg>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </svg>
  );
}

/** Animated equalizer used to indicate the currently-playing track. */
export function EqualizerIcon({ className, ...props }: IconProps) {
  return (
    <svg {...base({ ...props, className })} fill="currentColor" stroke="none">
      <rect x="4" y="10" width="3" height="10" rx="1.5">
        <animate attributeName="height" values="10;16;6;12;10" dur="1s" repeatCount="indefinite" />
        <animate attributeName="y" values="10;4;14;8;10" dur="1s" repeatCount="indefinite" />
      </rect>
      <rect x="10.5" y="6" width="3" height="14" rx="1.5">
        <animate attributeName="height" values="14;7;17;10;14" dur="1s" repeatCount="indefinite" />
        <animate attributeName="y" values="6;13;3;10;6" dur="1s" repeatCount="indefinite" />
      </rect>
      <rect x="17" y="12" width="3" height="8" rx="1.5">
        <animate attributeName="height" values="8;14;5;11;8" dur="1s" repeatCount="indefinite" />
        <animate attributeName="y" values="12;6;15;9;12" dur="1s" repeatCount="indefinite" />
      </rect>
    </svg>
  );
}
