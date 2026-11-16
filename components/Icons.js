/* Inline SVG icons (no extra dependency). All inherit currentColor. */

const base = {
  width: 24,
  height: 24,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
};

function Svg({ size = 20, className = '', children }) {
  return (
    <svg {...base} width={size} height={size} className={className}>
      {children}
    </svg>
  );
}

const sensorPaths = {
  temperature: <path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z" />,
  ph: (
    <>
      <path d="M10 2v7.527a2 2 0 0 1-.211.896L4.72 20.55a1 1 0 0 0 .9 1.45h12.76a1 1 0 0 0 .9-1.45l-5.069-10.127A2 2 0 0 1 14 9.527V2" />
      <path d="M8.5 2h7" />
      <path d="M7 16h10" />
    </>
  ),
  turbidity: (
    <path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z" />
  ),
  rain: (
    <>
      <path d="M4 14.9A7 7 0 1 1 15.7 8h1.8a4.5 4.5 0 0 1 2.5 8.2" />
      <path d="M16 14v6M8 14v6M12 16v6" />
    </>
  ),
  conductivity: <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />,
};

export function SensorIcon({ sensor, size = 20, className = '' }) {
  return (
    <Svg size={size} className={className}>
      {sensorPaths[sensor] || <circle cx="12" cy="12" r="9" />}
    </Svg>
  );
}

export const CheckIcon = (p) => (
  <Svg {...p}>
    <path d="m5 12.5 4.5 4.5L19 7.500" />
  </Svg>
);
export const AlertIcon = (p) => (
  <Svg {...p}>
    <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.700 3.900a2 2 0 0 0-3.400 0z" />
    <path d="M12 9v4M12 17h.01" />
  </Svg>
);
export const XIcon = (p) => (
  <Svg {...p}>
    <path d="M18 6 6 18M6 6l12 12" />
  </Svg>
);
export const DashIcon = (p) => (
  <Svg {...p}>
    <path d="M6 12h12" />
  </Svg>
);
export const RefreshIcon = (p) => (
  <Svg {...p}>
    <path d="M21 12a9 9 0 1 1-3-6.7L21 8" />
    <path d="M21 3v5h-5" />
  </Svg>
);
export const ArrowLeftIcon = (p) => (
  <Svg {...p}>
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </Svg>
);
export const ArrowRightIcon = (p) => (
  <Svg {...p}>
    <path d="M5 12h14M12 5l7 7-7 7" />
  </Svg>
);
export const ArrowUpIcon = (p) => (
  <Svg {...p}>
    <path d="M12 19V5M5 12l7-7 7 7" />
  </Svg>
);
export const ArrowDownIcon = (p) => (
  <Svg {...p}>
    <path d="M12 5v14M19 12l-7 7-7-7" />
  </Svg>
);
export const SunIcon = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.900 4.900l1.400 1.400M17.700 17.700l1.400 1.400M2 12h2M20 12h2M4.900 19.100l1.400-1.400M17.700 6.300l1.400-1.400" />
  </Svg>
);
export const MoonIcon = (p) => (
  <Svg {...p}>
    <path d="M21 12.800A9 9 0 1 1 11.200 3a7 7 0 0 0 9.800 9.800z" />
  </Svg>
);
export const WifiOffIcon = (p) => (
  <Svg {...p}>
    <path d="M2 2l20 20M8.500 16.400a5 5 0 0 1 7 0M2 8.800a15 15 0 0 1 4.200-2.700M10.700 5.100A15 15 0 0 1 22 8.800M5 12.900a10 10 0 0 1 5.100-2.700M14 10.300a10 10 0 0 1 5 2.600M12 20h.01" />
  </Svg>
);
export const InboxIcon = (p) => (
  <Svg {...p}>
    <path d="M22 12h-6l-2 3h-4l-2-3H2" />
    <path d="M5.500 5.100 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.500-6.900A2 2 0 0 0 16.700 4H7.300a2 2 0 0 0-1.800 1.100z" />
  </Svg>
);
export const ChipIcon = (p) => (
  <Svg {...p}>
    <rect x="5" y="5" width="14" height="14" rx="2" />
    <rect x="9" y="9" width="6" height="6" />
    <path d="M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3" />
  </Svg>
);
export const ServerIcon = (p) => (
  <Svg {...p}>
    <rect x="2" y="3" width="20" height="7" rx="2" />
    <rect x="2" y="14" width="20" height="7" rx="2" />
    <path d="M6 6.500h.01M6 17.500h.01" />
  </Svg>
);
export const WrenchIcon = (p) => (
  <Svg {...p}>
    <path d="M14.700 6.300a1 1 0 0 0 0 1.400l1.600 1.600a1 1 0 0 0 1.400 0l3.800-3.800a6 6 0 0 1-7.900 7.900l-6.900 6.900a2.100 2.100 0 0 1-3-3l6.900-6.900a6 6 0 0 1 7.900-7.900z" />
  </Svg>
);

export function FishLogo({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        <linearGradient id="fs-logo" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#38bdf8" />
          <stop offset="1" stopColor="#0284c7" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" fill="url(#fs-logo)" />
      <path
        d="M10 32c7-10 17-14 27-9 3 1.500 5.500 3.500 8 6l9-7v20l-9-7c-2.500 2.500-5 4.500-8 6-10 5-20 1-27-9z"
        fill="#fff"
      />
      <circle cx="21" cy="29" r="2.600" fill="#0284c7" />
    </svg>
  );
}

const glyphs = { check: CheckIcon, alert: AlertIcon, x: XIcon, dash: DashIcon };
export function StatusGlyph({ glyph = 'dash', size = 12, className = '' }) {
  const Icon = glyphs[glyph] || DashIcon;
  return <Icon size={size} className={className} />;
}

export const ChevronDownIcon = (p) => (
  <Svg {...p}>
    <path d="m6 9 6 6 6-6" />
  </Svg>
);
export const FishIcon = (p) => (
  <Svg {...p}>
    <path d="M6.500 12c3-5 8-6.500 12-3.500 1 .8 2 1.700 3 3.500-1 1.800-2 2.700-3 3.500-4 3-9 1.500-12-3.500Z" />
    <path d="M18 12h.01" />
    <path d="M6.500 12 3 8.500v7L6.500 12Z" />
    <path d="M10.500 9.500c.5 1.500.5 3.500 0 5" />
  </Svg>
);

export const GridIcon = (p) => (<Svg {...p}><rect x="3" y="3" width="7" height="7" rx="1.500" /><rect x="14" y="3" width="7" height="7" rx="1.500" /><rect x="3" y="14" width="7" height="7" rx="1.500" /><rect x="14" y="14" width="7" height="7" rx="1.500" /></Svg>);
export const ActivityIcon = (p) => (<Svg {...p}><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></Svg>);
export const BarChartIcon = (p) => (<Svg {...p}><path d="M3 3v18h18" /><path d="M7 16v-5M12 16V7M17 16v-8" /></Svg>);
export const BellIcon = (p) => (<Svg {...p}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.300 21a1.900 1.900 0 0 0 3.400 0" /></Svg>);
export const TableIcon = (p) => (<Svg {...p}><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 10h18M3 15h18M9 4v16" /></Svg>);
export const SettingsIcon = (p) => (<Svg {...p}><circle cx="12" cy="12" r="3" /><path d="M19.400 15a1.700 1.700 0 0 0 .3 1.800l.1.100a2 2 0 1 1-2.800 2.800l-.1-.1a1.700 1.700 0 0 0-1.800-.3 1.700 1.700 0 0 0-1 1.500V21a2 2 0 1 1-4 0v-.1a1.700 1.700 0 0 0-1.100-1.500 1.700 1.700 0 0 0-1.800.3l-.1.100a2 2 0 1 1-2.800-2.800l.1-.1a1.700 1.700 0 0 0 .3-1.800 1.700 1.700 0 0 0-1.500-1H3a2 2 0 1 1 0-4h.1a1.700 1.700 0 0 0 1.500-1.100 1.700 1.700 0 0 0-.3-1.800l-.1-.1a2 2 0 1 1 2.800-2.800l.1.1a1.700 1.700 0 0 0 1.800.3H9a1.700 1.700 0 0 0 1-1.500V3a2 2 0 1 1 4 0v.1a1.700 1.700 0 0 0 1 1.500 1.700 1.700 0 0 0 1.800-.3l.1-.1a2 2 0 1 1 2.800 2.800l-.1.100a1.700 1.700 0 0 0-.3 1.800V9a1.700 1.700 0 0 0 1.500 1H21a2 2 0 1 1 0 4h-.1a1.700 1.700 0 0 0-1.500 1z" /></Svg>);
export const MenuIcon = (p) => (<Svg {...p}><path d="M4 6h16M4 12h16M4 18h16" /></Svg>);
export const PanelLeftIcon = (p) => (<Svg {...p}><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M9 3v18" /></Svg>);
export const SearchIcon = (p) => (<Svg {...p}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.500-3.500" /></Svg>);
export const PlusIcon = (p) => (<Svg {...p}><path d="M12 5v14M5 12h14" /></Svg>);
export const TrashIcon = (p) => (<Svg {...p}><path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6" /></Svg>);
export const EditIcon = (p) => (<Svg {...p}><path d="M12 20h9" /><path d="M16.500 3.500a2.100 2.100 0 0 1 3 3L7 19l-4 1 1-4Z" /></Svg>);
export const DownloadIcon = (p) => (<Svg {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" /></Svg>);
export const CalendarIcon = (p) => (<Svg {...p}><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></Svg>);
export const InfoIcon = (p) => (<Svg {...p}><circle cx="12" cy="12" r="9" /><path d="M12 16v-4M12 8h.01" /></Svg>);
export const SignalIcon = (p) => (<Svg {...p}><path d="M2 20h.01M7 20v-4M12 20v-8M17 20V8M22 4v16" /></Svg>);
export const MailCheckIcon = (p) => (<Svg {...p}><path d="M22 13V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12c0 1.100.9 2 2 2h8" /><path d="m22 7-8.970 5.700a1.940 1.940 0 0 1-2.060 0L2 7M16 19l2 2 4-4" /></Svg>);
export const ClockIcon = (p) => (<Svg {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></Svg>);

export const TargetIcon = (p) => (<Svg {...p}><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1" /></Svg>);
export const FileTextIcon =(p) => (<Svg {...p}><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z" /><path d="M14 3v5h5M9 13h6M9 17h6M9 9h2" /></Svg>);
export const PrinterIcon = (p) => (<Svg {...p}><path d="M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect x="6" y="14" width="12" height="8" rx="1" /></Svg>);
