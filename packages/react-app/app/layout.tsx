import '@/styles/globals.css';
import { AppProvider } from '../providers/AppProvider';

export const metadata = {
  title: 'CeloKudos',
  description: 'Send kudos in cUSD on Celo ✨',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50">
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
