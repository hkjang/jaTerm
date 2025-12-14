import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'jaTerm - Web SSH Terminal',
  description: 'Secure web-based SSH terminal with access control and audit logging',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        <div id="app-root">{children}</div>
      </body>
    </html>
  );
}
