import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'QR Code Generator Pro - Create Custom QR Codes Instantly',
  description: 'Generate professional QR codes for URLs, text, emails, phone numbers, WiFi, vCards, and more. Customize colors, size, error correction, and download as PNG or SVG.',
  keywords: ['QR code', 'QR code generator', 'custom QR code', 'URL to QR', 'WiFi QR code', 'vCard QR code'],
  authors: [{ name: 'QR Code Generator Pro' }],
  openGraph: {
    title: 'QR Code Generator Pro',
    description: 'Create custom QR codes for URLs, text, emails, phone numbers, WiFi, vCards, and more.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`}>
        {children}
      </body>
    </html>
  );
}