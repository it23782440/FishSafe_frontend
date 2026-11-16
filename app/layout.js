import './globals.css';
import DashboardLayout from '@/components/DashboardLayout';

export const metadata = {
  title: { default: 'FishSafe — Water Quality Monitoring', template: '%s · FishSafe' },
  description:
    'Real-time water quality monitoring and alert dashboard for freshwater aquaculture.',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f4f7fa' },
    { media: '(prefers-color-scheme: dark)', color: '#070c16' },
  ],
};

// Runs before first paint so the saved/system theme is applied without a flash.
const themeScript = `(function(){try{var t=localStorage.getItem('fishsafe-theme');
var d=t?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;
document.documentElement.classList.toggle('dark',d);}catch(e){}})();`;

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-surface focus:px-4 focus:py-2 focus:shadow-lift"
        >
          Skip to content
        </a>
        <DashboardLayout>{children}</DashboardLayout>
      </body>
    </html>
  );
}
