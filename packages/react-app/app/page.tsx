'use client';

import KudosForm from '../components/KudosForm';
import { WagmiConfig } from 'wagmi';
import { ConnectKitProvider } from 'connectkit';
import { wagmiConfig } from '../config/wagmi';

export default function Home() {
  return (
    <WagmiConfig config={wagmiConfig}>
      <ConnectKitProvider>
        <main className="min-h-screen flex flex-col items-center justify-center p-4">
          <KudosForm />
        </main>
      </ConnectKitProvider>
    </WagmiConfig>
  );
}
