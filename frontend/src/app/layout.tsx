import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'KLASH — Consensus Dialectic Arena',
  description: 'A decentralized debate arena on GenLayer where ideas clash under validator consensus.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
