import './globals.css';
import { Inter } from "next/font/google";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata = {
  title: 'Mgp Studio — Môguô Puissant',
  description: 'Mgp Studio (Môguô Puissant) — Studio d\'Intelligence Artificielle Générative & Cinéma multi-moteurs, propulsé par le supercalculateur DGX Spark GB10.',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/icon.svg', type: 'image/svg+xml' }
    ],
    apple: '/favicon.svg'
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.variable}>{children}</body>
    </html>
  );
}
