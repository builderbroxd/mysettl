// Reads the Aevum deployment back from chain: code size, token, fee and role wiring.
//   npx hardhat run scripts/check-aevum.cjs --network aevumTestnet
const hre = require("hardhat");
(async () => {
  const c = require("../deployments/44005.json").contracts;
  for (const [n, a] of Object.entries(c)) console.log(n.padEnd(18), a, ((await hre.ethers.provider.getCode(a)).length - 2) / 2, "bytes");
  const router = await hre.ethers.getContractAt("SettlementRouter", c.SettlementRouter);
  const reg = await hre.ethers.getContractAt("InvoiceRegistry", c.InvoiceRegistry);
  const vault = await hre.ethers.getContractAt("Vault", c.Vault);
  console.log("router.token      ", await router.token());
  console.log("router.feeBps     ", (await router.protocolFeeBps()).toString());
  console.log("registry role->router", await reg.hasRole(await reg.SETTLEMENT_ROUTER_ROLE(), c.SettlementRouter));
  console.log("vault role->engine   ", await vault.hasRole(await vault.BORROWER_ROLE(), c.AdvanceEngine));
  const [d] = await hre.ethers.getSigners();
  console.log("deployer balance  ", hre.ethers.formatEther(await hre.ethers.provider.getBalance(d.address)));
})().catch(e => { console.error(e.message); process.exit(1); });
