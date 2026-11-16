/**
 * Runs one invoice through the live Aevum deployment and prints every transaction hash:
 * mint sUSD -> pool deposit -> create invoice -> advance -> buyer pays -> cleared.
 *
 *   npx hardhat run scripts/e2e-aevum.cjs --network aevumTestnet
 *
 * The deployer acts as liquidity provider and seller. The buyer is a throwaway wallet
 * that the deployer funds with a little gas. Uses the mintable demo token, so it needs
 * nothing but tQDAY in the deployer.
 */
const hre = require("hardhat");
const { contracts: C } = require("../deployments/44005.json");

const EXPLORER = "https://explorer-test.qday.info";
const U = (n) => hre.ethers.parseUnits(String(n), 6);
const fmt = (v) => hre.ethers.formatUnits(v, 6);

async function send(label, txPromise) {
  const tx = await txPromise;
  const receipt = await tx.wait();
  console.log(`${label.padEnd(28)} ${EXPLORER}/tx/${tx.hash}`);
  return receipt;
}

function check(label, ok, detail = "") {
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}${detail ? `  (${detail})` : ""}`);
  if (!ok) process.exitCode = 1;
}

async function main() {
  const { ethers } = hre;
  const [deployer] = await ethers.getSigners();
  const buyer = ethers.Wallet.createRandom().connect(ethers.provider);
  console.log(`Seller / LP: ${deployer.address}\nBuyer:       ${buyer.address}\n`);

  const token = await ethers.getContractAt("DemoUSDC", C.Stablecoin);
  const registry = await ethers.getContractAt("InvoiceRegistry", C.InvoiceRegistry);
  const vault = await ethers.getContractAt("Vault", C.Vault);
  const engine = await ethers.getContractAt("AdvanceEngine", C.AdvanceEngine);
  const router = await ethers.getContractAt("SettlementRouter", C.SettlementRouter);
  const reputation = await ethers.getContractAt("Reputation", C.Reputation);

  await send("Fund buyer with gas", deployer.sendTransaction({ to: buyer.address, value: ethers.parseEther("0.02") }));
  await send("Mint 50,000 sUSD to LP", token.mint(deployer.address, U(50_000)));
  await send("Mint 10,000 sUSD to buyer", token.mint(buyer.address, U(10_000)));

  await send("Approve pool", token.approve(C.Vault, U(50_000)));
  await send("Deposit 50,000 into pool", vault.deposit(U(50_000)));

  const { timestamp } = await ethers.provider.getBlock("latest");
  const receipt = await send(
    "Create 10,000 sUSD invoice",
    registry.createInvoice(buyer.address, U(10_000), timestamp + 30 * 24 * 3600 + 3600, ethers.ZeroHash),
  );
  const id = receipt.logs.map((l) => { try { return registry.interface.parseLog(l); } catch { return null; } })
    .find((l) => l && l.name === "InvoiceCreated").args.invoiceId;
  console.log(`  invoice id ${id}`);

  const sellerBefore = await token.balanceOf(deployer.address);
  await send("Request 35% advance", engine.requestAdvance(id, 3500, 1800));
  const advance = (await token.balanceOf(deployer.address)) - sellerBefore;
  check("Advance reached the seller", advance === U(3_500), `${fmt(advance)} sUSD`);
  const repay = await engine.getRepaymentAmount(id);

  const treasury = await router.treasury();
  const sameWallet = treasury.toLowerCase() === deployer.address.toLowerCase();
  const [sBefore, vBefore] = await Promise.all([token.balanceOf(deployer.address), token.balanceOf(C.Vault)]);
  await send("Buyer approves router", token.connect(buyer).approve(C.SettlementRouter, U(10_000)));
  await send("Buyer pays the invoice", router.connect(buyer).payInvoice(id));
  const [sAfter, vAfter] = await Promise.all([token.balanceOf(deployer.address), token.balanceOf(C.Vault)]);

  const repaid = vAfter - vBefore;
  const sellerSide = sAfter - sBefore; // seller payout, plus the fee when the treasury is the same wallet
  const expectedSeller = U(10_000) - repay - (sameWallet ? 0n : U(50));
  check("Pool repaid principal + interest", repaid === repay, `${fmt(repaid)} sUSD`);
  check(sameWallet ? "Seller payout + protocol fee received" : "Seller payout received", sellerSide === expectedSeller, `${fmt(sellerSide)} sUSD`);
  check("Buyer paid exactly 10,000", (await token.balanceOf(buyer.address)) === 0n);
  check("Router holds nothing", (await token.balanceOf(C.SettlementRouter)) === 0n);
  check("Invoice is Cleared", (await registry.getInvoice(id)).status === 3n);
  check("Reputation moved", (await reputation.getScore(deployer.address)) > 450n, `score ${await reputation.getScore(deployer.address)}`);

  console.log(process.exitCode ? "\nSome checks failed." : "\nAll checks passed on QDay Aevum testnet.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
