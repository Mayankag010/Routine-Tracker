import { Fraunces, Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { ThemeProvider } from "@/lib/theme-context";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata = {
  title: "Routine — track your days",
  description: "Build and track your daily routines, day by day.",
  manifest: "/manifest.json",
  // Browser-tab / bookmark favicon. Previously missing entirely — there
  // was no favicon.ico or icon.png for Next to auto-detect, and no
  // rel="icon" link, so browsers fell back to a blank/default icon on
  // both desktop and mobile. Reuses the same PWA icons already in
  // public/icons (referenced by manifest.json) instead of adding new
  // image assets.
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icons/icon-192.png",
  },
};

export const viewport = {
  themeColor: "#1F6F5C",
  width: "device-width",
  initialScale: 1,
};

// Runs before React hydrates so the correct theme/accent paint immediately
// instead of flashing the default light palette first. Reads the same
// localStorage keys theme-context.js writes to.
const THEME_INIT_SCRIPT = `
(function () {
  try {
    var theme = localStorage.getItem('routine-tracker:theme') || 'system';
    var accent = localStorage.getItem('routine-tracker:accent') || '#1F6F5C';
    var isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.classList.toggle('dark', isDark);
    var clean = accent.replace('#', '');
    if (clean.length === 3) clean = clean.split('').map(function (c) { return c + c; }).join('');
    var r = parseInt(clean.slice(0, 2), 16);
    var g = parseInt(clean.slice(2, 4), 16);
    var b = parseInt(clean.slice(4, 6), 16);
    if (![r, g, b].some(isNaN)) {
      document.documentElement.style.setProperty('--color-accent', r + ' ' + g + ' ' + b);
      var mix = function (c) { return Math.round(c + (255 - c) * 0.18); };
      document.documentElement.style.setProperty('--color-accent-soft', mix(r) + ' ' + mix(g) + ' ' + mix(b));
    }
  } catch (e) {}
})();
`;

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${inter.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="font-sans antialiased" suppressHydrationWarning>
        <AuthProvider>
          <ThemeProvider>{children}</ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
