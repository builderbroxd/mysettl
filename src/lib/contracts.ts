export interface ContractsData {
  network: string;
  chainId: string;
  deployer: string;
  contracts: {
    DemoUSDC?: string;
    USMTPlus?: string;
    InvoiceNFT?: string;
    InvoiceRegistry?: string;
    Vault?: string;
    Staking?: string;
    AdvanceEngine?: string;
    Reputation?: string;
    SettlementRouter?: string;
    Treasury?: string;
    ProtocolFeeBps?: string;
  };
  deployedAt: string;
}

// Load contract addresses from contracts.json or environment variables
function getContractAddresses(): ContractsData['contracts'] {
  // Priority: Environment variables > contracts.json
  // For now, use environment variables (can be updated to load from contracts.json dynamically)
  
  const addresses = {
    // Settlement stablecoin: SETTL USD (sUSD). The key keeps its historical name.
    DemoUSDC: import.meta.env.VITE_DEMO_USDC_ADDRESS,
    USMTPlus: import.meta.env.VITE_USMT_PLUS_ADDRESS,
    InvoiceNFT: import.meta.env.VITE_INVOICE_NFT_ADDRESS,
    InvoiceRegistry: import.meta.env.VITE_INVOICE_REGISTRY_ADDRESS,
    Vault: import.meta.env.VITE_VAULT_ADDRESS,
    Staking: import.meta.env.VITE_STAKING_ADDRESS,
    AdvanceEngine: import.meta.env.VITE_ADVANCE_ENGINE_ADDRESS,
    Reputation: import.meta.env.VITE_REPUTATION_ADDRESS,
    SettlementRouter: import.meta.env.VITE_SETTLEMENT_ROUTER_ADDRESS,
  };

  return addresses;
}

export const contractAddresses = getContractAddresses();

// Helper to check if contracts are configured
export function areContractsConfigured(): boolean {
  return !!(
    contractAddresses.DemoUSDC &&
    contractAddresses.USMTPlus &&
    contractAddresses.InvoiceRegistry &&
    contractAddresses.Vault &&
    contractAddresses.Staking &&
    contractAddresses.AdvanceEngine &&
    contractAddresses.Reputation &&
    contractAddresses.SettlementRouter
  );
}

