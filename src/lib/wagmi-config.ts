import { createConfig } from '@privy-io/wagmi';
import { http } from 'viem';
import { aevumTestnet } from './chain';

export { aevumTestnet };

export const wagmiConfig = createConfig({
  chains: [aevumTestnet],
  transports: {
    [aevumTestnet.id]: http(aevumTestnet.rpcUrls.default.http[0]),
  },
});

export const chains = [aevumTestnet];
