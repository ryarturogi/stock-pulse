import { Inter } from 'next/font/google';

import type { Metadata } from 'next';

import './globals.css';
import 'intro.js/introjs.css';
import '../src/styles/intro.css';
import { ErrorBoundaryWrapper } from '../src/shared/components/ErrorBoundaryWrapper';
import { Analytics } from '@vercel/analytics/next';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'StockPulse - Real-time Stock Market Tracker',
  description:
    'Track stocks, manage portfolios, and stay updated with real-time market data',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'StockPulse',
  },
  icons: {
    icon: '/icons/icon-192x192.svg',
    apple: '/icons/icon-192x192.svg',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#000000',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang='en'>
      <head>
        <meta name='application-name' content='StockPulse' />
        <meta name='apple-mobile-web-app-capable' content='yes' />
        <meta name='apple-mobile-web-app-status-bar-style' content='default' />
        <meta name='apple-mobile-web-app-title' content='StockPulse' />
        <meta name='format-detection' content='telephone=no' />
        <meta name='mobile-web-app-capable' content='yes' />
        <meta name='msapplication-config' content='/browserconfig.xml' />
        <meta name='msapplication-TileColor' content='#000000' />
        <meta name='msapplication-tap-highlight' content='no' />

        <link rel='apple-touch-icon' href='/icons/icon-192x192.svg' />
        <link rel='manifest' href='/manifest.json' />
        <link rel='shortcut icon' href='/favicon.ico' />
      </head>
      <body className={inter.className}>
        <div id='app'>
          <ErrorBoundaryWrapper>{children}</ErrorBoundaryWrapper>
          <Analytics />
        </div>
      </body>
    </html>
  );
}
