/**
 * SETTL. deployment for QDay Aevum Testnet (chainId 44005).
 *
 * Deploys SETTL USD (sUSD), a mintable demo stablecoin, as the settlement asset.
 *   npx hardhat run scripts/deploy-aevum.cjs --network aevumTestnet
 * To settle in an existing token instead (for example tUSD8), set STABLECOIN_ADDRESS.
 *
 * The script is resumable: every confirmed step is written to
 * deployments/<chainId>.json, and a re-run skips whatever is already there.
 */
require("dotenv").config();
const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

const AEVUM_CHAIN_ID = 44005n;
const PROTOCOL_FEE_BPS = 50; // 0.5%

async function retry(label, fn, attempts = 5) {
  let delay = 3000;
  for (let i = 1; ; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === attempts) throw err;
      console.log(`  ${label}: attempt ${i} failed (${String(err.message).slice(0, 80)}), retrying in ${delay / 1000}s`);
      await new Promise((r) => setTimeout(r, delay));
      delay = Math.min(delay * 2, 20000);
    }
  }
}

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  if (!deployer) throw new Error("No deployer account. Set DEPLOYER_PRIVATE_KEY in .env");

  const { chainId } = await hre.ethers.provider.getNetwork();
  const isLocal = chainId === 31337n;
  if (!isLocal && chainId !== AEVUM_CHAIN_ID) {
    throw new Error(`Refusing to deploy: connected to chain ${chainId}, expected ${AEVUM_CHAIN_ID} (Aevum testnet)`);
  }

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log(`Deployer ${deployer.address} on chain ${chainId}, balance ${hre.ethers.formatEther(balance)} tQDAY`);
  if (balance === 0n) throw new Error("Deployer has no gas. Fund it from https://faucet.qday.info/en");

  const dir = path.join(__dirname, "..", "deployments");
  const file = path.join(dir, `${chainId}.json`);
  fs.mkdirSync(dir, { recursive: true });
  const state = !isLocal && fs.existsSync(file)
    ? JSON.parse(fs.readFileSync(file, "utf8"))
    : { chainId: chainId.toString(), deployer: deployer.address, contracts: {}, txs: {}, roles: {} };
  const save = () => {
    if (!isLocal) fs.writeFileSync(file, JSON.stringify(state, null, 2) + "\n");
  };

  async function deploy(name, args) {
    if (state.contracts[name]) {
      console.log(`${name}: already at ${state.contracts[name]}`);
      return hre.ethers.getContractAt(name, state.contracts[name]);
    }
    const factory = await hre.ethers.getContractFactory(name);
    const contract = await retry(name, () => factory.deploy(...args));
    await contract.waitForDeployment();
    state.contracts[name] = await contract.getAddress();
    state.txs[name] = contract.deploymentTransaction().hash;
    save();
    console.log(`${name}: ${state.contracts[name]}`);
    return contract;
  }

  async function once(key, send) {
    if (state.roles[key]) return;
    const tx = await retry(key, send);
    await tx.wait();
    state.roles[key] = tx.hash;
    save();
    console.log(`  ${key}`);
  }

  // Settlement token: SETTL USD (sUSD), our mintable demo stablecoin, unless
  // STABLECOIN_ADDRESS points at an existing 6-decimal token such as tUSD8.
  let token = process.env.STABLECOIN_ADDRESS;
  if (token) {
    const erc20 = await hre.ethers.getContractAt("IERC20Metadata", token);
    const [symbol, decimals] = await Promise.all([erc20.symbol(), erc20.decimals()]);
    if (decimals !== 6n) throw new Error(`Stablecoin ${symbol} has ${decimals} decimals; SETTL. assumes 6`);
    console.log(`Settlement token: ${symbol} (${token})`);
  } else {
    token = await (await deploy("DemoUSDC", [deployer.address])).getAddress();
  }
  state.contracts.Stablecoin = token;

  const admin = deployer.address;
  const invoiceNFT = await deploy("InvoiceNFT", [admin]);
  const registry = await deploy("InvoiceRegistry", [state.contracts.InvoiceNFT, admin]);
  const usmtPlus = await deploy("USMTPlus", [admin]);
  const vault = await deploy("Vault", [token, state.contracts.USMTPlus, admin]);
  await deploy("Staking", [state.contracts.USMTPlus, admin]);
  const advanceEngine = await deploy("AdvanceEngine", [state.contracts.InvoiceRegistry, state.contracts.Vault, admin]);
  const reputation = await deploy("Reputation", [admin]);
  await deploy("SettlementRouter", [
    token,
    state.contracts.InvoiceRegistry,
    state.contracts.Vault,
    state.contracts.AdvanceEngine,
    state.contracts.Reputation,
    admin, // treasury
    PROTOCOL_FEE_BPS,
    admin,
  ]);
  const c = state.contracts;

  console.log("Wiring roles:");
  await once("InvoiceNFT.setInvoiceRegistry", () => invoiceNFT.setInvoiceRegistry(c.InvoiceRegistry));
  await once("InvoiceNFT.MINTER -> InvoiceRegistry", async () =>
    invoiceNFT.grantRole(await invoiceNFT.MINTER_ROLE(), c.InvoiceRegistry));
  await once("USMTPlus.MINTER -> Vault", async () =>
    usmtPlus.grantRole(await usmtPlus.MINTER_ROLE(), c.Vault));
  await once("InvoiceRegistry.SETTLEMENT_ROUTER -> SettlementRouter", async () =>
    registry.grantRole(await registry.SETTLEMENT_ROUTER_ROLE(), c.SettlementRouter));
  await once("InvoiceRegistry.ADVANCE_ENGINE -> AdvanceEngine", async () =>
    registry.grantRole(await registry.ADVANCE_ENGINE_ROLE(), c.AdvanceEngine));
  await once("Reputation.SETTLEMENT_ROUTER -> SettlementRouter", async () =>
    reputation.grantRole(await reputation.SETTLEMENT_ROUTER_ROLE(), c.SettlementRouter));
  await once("Vault.BORROWER -> AdvanceEngine", async () =>
    vault.grantRole(await vault.BORROWER_ROLE(), c.AdvanceEngine));
  await once("AdvanceEngine.SETTLEMENT_ROUTER -> SettlementRouter", async () =>
    advanceEngine.grantRole(await advanceEngine.SETTLEMENT_ROUTER_ROLE(), c.SettlementRouter));

  state.deployedAt = state.deployedAt || new Date().toISOString();
  save();

  console.log("\nFrontend env:");
  console.log(
    [
      `VITE_DEMO_USDC_ADDRESS=${c.Stablecoin}`,
      `VITE_INVOICE_NFT_ADDRESS=${c.InvoiceNFT}`,
      `VITE_INVOICE_REGISTRY_ADDRESS=${c.InvoiceRegistry}`,
      `VITE_USMT_PLUS_ADDRESS=${c.USMTPlus}`,
      `VITE_VAULT_ADDRESS=${c.Vault}`,
      `VITE_STAKING_ADDRESS=${c.Staking}`,
      `VITE_ADVANCE_ENGINE_ADDRESS=${c.AdvanceEngine}`,
      `VITE_REPUTATION_ADDRESS=${c.Reputation}`,
      `VITE_SETTLEMENT_ROUTER_ADDRESS=${c.SettlementRouter}`,
    ].join("\n")
  );
  if (!isLocal) console.log(`\nSaved to ${path.relative(process.cwd(), file)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
