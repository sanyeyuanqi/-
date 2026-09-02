import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '供应商管理系统',
  description: 'React reverse build for the supplier management frontend.',
  icons: {
    icon: [{ url: '/favicon.svg?v=2', type: 'image/svg+xml' }],
    shortcut: '/favicon.svg?v=2',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
