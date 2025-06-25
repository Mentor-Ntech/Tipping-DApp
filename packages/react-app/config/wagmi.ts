import { createConfig } from 'wagmi';
import { celoAlfajores } from 'wagmi/chains';
import { walletConnect, injected } from 'wagmi/connectors';
import { http } from 'viem';

export const wagmiConfig = createConfig({
  chains: [celoAlfajores],
  connectors: [
    injected(),
    walletConnect({ projectId: 'YOUR_WALLETCONNECT_PROJECT_ID' }),
  ],
  ssr: true,
  transports: {
    [celoAlfajores.id]: http(),
  },
});
