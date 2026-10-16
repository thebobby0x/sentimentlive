import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'sentimentLive — studio0x',
  description: 'Real-time attendee sentiment dashboard',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="bg-noir">
      <body className="min-h-screen bg-noir text-[#f4eef1] antialiased">
        {children}
      </body>
    </html>
  );
}
