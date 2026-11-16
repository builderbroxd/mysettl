// Privy configuration for QDay Aevum Testnet
import { aevumTestnet } from './chain'

export const privyConfig = {
  appId: import.meta.env.VITE_PRIVY_APP_ID || '',
  config: {
    appearance: {
      theme: 'light',
      accentColor: '#0e3b2e', // Forest, to match SETTL. branding
      logo: '/set.png', // SETTL. logo
    },
    loginMethods: ['email'], // Email-only login
    embeddedWallets: {
      // Create embedded wallet on email/social login
      ethereum: {
        createOnLogin: 'all-users', // Create embedded wallet for ALL users on login
      },
      requireUserPasswordOnCreate: false,
      noPromptOnSignature: true, // CRITICAL: Disable transaction prompts for embedded wallets - transactions sign automatically
    },
    // Allow external wallets (MetaMask, etc.)
    externalWallets: {
      coinbaseWallet: {
        connectionOptions: 'all', // Allow both smart wallets and direct connections
      },
      walletConnect: {
        connectionOptions: 'all', // Allow both smart wallets and direct connections
      },
      metamask: {
        connectionOptions: 'all', // Allow MetaMask connections
      },
    },
    // Chain configuration - QDay Aevum Testnet (44005)
    // Note: Make sure QDay Aevum Testnet (44005) is enabled in your Privy dashboard
    // IMPORTANT: Add http://localhost:8080 to allowed origins in Privy dashboard to fix origin mismatch
    defaultChain: aevumTestnet,
    supportedChains: [aevumTestnet],
  },
}

