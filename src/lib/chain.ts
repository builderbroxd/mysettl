// QDay Aevum Testnet: the single chain SETTL. runs on.
export const aevumTestnet = {
  id: 44005,
  name: 'QDay Aevum Testnet',
  nativeCurrency: { decimals: 18, name: 'tQDAY', symbol: 'tQDAY' },
  rpcUrls: {
    default: { http: ['https://rpc-test.qday.info'], webSocket: ['wss://rpc-test.qday.info'] },
    public: { http: ['https://rpc-test.qday.info'], webSocket: ['wss://rpc-test.qday.info'] },
  },
  blockExplorers: {
    default: { name: 'QDay Explorer', url: 'https://explorer-test.qday.info' },
  },
  testnet: true,
} as const;

export const EXPLORER_URL = aevumTestnet.blockExplorers.default.url;
export const FAUCET_URL = 'https://faucet.qday.info/en';
