// Full invoice lifecycle on a local chain: pool deposit -> create -> advance -> pay -> cleared.
// MockStablecoin stands in for tUSD8 (both are 6-decimal ERC-20s).
//   npx hardhat test
const { expect } = require("chai");
const { ethers } = require("hardhat");

const U = (n) => ethers.parseUnits(String(n), 6);
const DAY = 24 * 60 * 60;

async function deploy() {
  const [admin, seller, buyer, lp, stranger] = await ethers.getSigners();
  const make = async (name, ...args) => (await (await ethers.getContractFactory(name)).deploy(...args)).waitForDeployment();

  const token = await make("MockStablecoin");
  const nft = await make("InvoiceNFT", admin.address);
  const registry = await make("InvoiceRegistry", nft.target, admin.address);
  const usmt = await make("USMTPlus", admin.address);
  const vault = await make("Vault", token.target, usmt.target, admin.address);
  const engine = await make("AdvanceEngine", registry.target, vault.target, admin.address);
  const reputation = await make("Reputation", admin.address);
  const router = await make(
    "SettlementRouter", token.target, registry.target, vault.target, engine.target, reputation.target, admin.address, 50, admin.address,
  );

  await nft.setInvoiceRegistry(registry.target);
  await nft.grantRole(await nft.MINTER_ROLE(), registry.target);
  await usmt.grantRole(await usmt.MINTER_ROLE(), vault.target);
  await registry.grantRole(await registry.SETTLEMENT_ROUTER_ROLE(), router.target);
  await registry.grantRole(await registry.ADVANCE_ENGINE_ROLE(), engine.target);
  await reputation.grantRole(await reputation.SETTLEMENT_ROUTER_ROLE(), router.target);
  await vault.grantRole(await vault.BORROWER_ROLE(), engine.target);
  await engine.grantRole(await engine.SETTLEMENT_ROUTER_ROLE(), router.target);

  await token.mint(lp.address, U(50_000));
  await token.mint(buyer.address, U(10_000));
  await token.connect(lp).approve(vault.target, U(50_000));
  await vault.connect(lp).deposit(U(50_000));

  return { admin, seller, buyer, lp, stranger, token, nft, registry, usmt, vault, engine, reputation, router };
}

async function createInvoice(ctx, amount = U(10_000)) {
  const { timestamp } = await ethers.provider.getBlock("latest");
  const tx = await ctx.registry.connect(ctx.seller).createInvoice(ctx.buyer.address, amount, timestamp + 30 * DAY + 60, ethers.ZeroHash);
  const receipt = await tx.wait();
  const log = receipt.logs.map((l) => { try { return ctx.registry.interface.parseLog(l); } catch { return null; } })
    .find((l) => l && l.name === "InvoiceCreated");
  return log.args.invoiceId;
}

describe("SETTL. settlement", () => {
  it("mints USMT+ 1:1 on deposit and an NFT on invoice creation", async () => {
    const ctx = await deploy();
    expect(await ctx.usmt.balanceOf(ctx.lp.address)).to.equal(U(50_000));
    const id = await createInvoice(ctx);
    expect((await ctx.registry.getInvoice(id)).status).to.equal(0n);
    expect(await ctx.nft.balanceOf(ctx.seller.address)).to.equal(1n);
  });

  it("settles an unfinanced invoice: fee to treasury, rest to seller", async () => {
    const ctx = await deploy();
    const id = await createInvoice(ctx);
    await ctx.token.connect(ctx.buyer).approve(ctx.router.target, U(10_000));
    await ctx.router.connect(ctx.buyer).payInvoice(id);

    expect(await ctx.token.balanceOf(ctx.admin.address)).to.equal(U(50)); // 0.5% fee
    expect(await ctx.token.balanceOf(ctx.seller.address)).to.equal(U(9_950));
    expect(await ctx.token.balanceOf(ctx.router.target)).to.equal(0n);
    expect((await ctx.registry.getInvoice(id)).status).to.equal(3n); // Cleared
  });

  it("settles a financed invoice in one payment: fee, pool repayment, seller remainder", async () => {
    const ctx = await deploy();
    const id = await createInvoice(ctx);

    await ctx.engine.connect(ctx.seller).requestAdvance(id, 3500, 1800); // 35% at 18% APR
    expect(await ctx.token.balanceOf(ctx.seller.address)).to.equal(U(3_500));
    expect((await ctx.registry.getInvoice(id)).status).to.equal(1n); // Financed

    const repay = await ctx.engine.getRepaymentAmount(id);
    expect(repay).to.be.greaterThan(U(3_500)); // principal plus interest
    const vaultBefore = await ctx.token.balanceOf(ctx.vault.target);

    await ctx.token.connect(ctx.buyer).approve(ctx.router.target, U(10_000));
    await ctx.router.connect(ctx.buyer).payInvoice(id);

    const fee = await ctx.token.balanceOf(ctx.admin.address);
    const repaid = (await ctx.token.balanceOf(ctx.vault.target)) - vaultBefore;
    const payout = (await ctx.token.balanceOf(ctx.seller.address)) - U(3_500);
    expect(fee).to.equal(U(50));
    expect(repaid).to.equal(repay);
    expect(fee + repaid + payout).to.equal(U(10_000));
    expect(await ctx.token.balanceOf(ctx.buyer.address)).to.equal(0n);
    expect(await ctx.token.balanceOf(ctx.router.target)).to.equal(0n);
    expect((await ctx.registry.getInvoice(id)).status).to.equal(3n);
    expect(await ctx.engine.getRepaymentAmount(id)).to.equal(0n);
  });

  it("raises the seller's reputation when an invoice clears", async () => {
    const ctx = await deploy();
    expect(await ctx.reputation.getScore(ctx.seller.address)).to.equal(450n);
    const id = await createInvoice(ctx);
    await ctx.token.connect(ctx.buyer).approve(ctx.router.target, U(10_000));
    await ctx.router.connect(ctx.buyer).payInvoice(id);
    expect(await ctx.reputation.getScore(ctx.seller.address)).to.be.greaterThan(450n);
  });

  it("only lets the named buyer pay, and only once", async () => {
    const ctx = await deploy();
    const id = await createInvoice(ctx);
    await ctx.token.mint(ctx.stranger.address, U(10_000));
    await ctx.token.connect(ctx.stranger).approve(ctx.router.target, U(10_000));
    await expect(ctx.router.connect(ctx.stranger).payInvoice(id)).to.be.revertedWith("Not invoice buyer");

    await ctx.token.connect(ctx.buyer).approve(ctx.router.target, U(20_000));
    await ctx.router.connect(ctx.buyer).payInvoice(id);
    await expect(ctx.router.connect(ctx.buyer).payInvoice(id)).to.be.revertedWith("Already cleared");
  });

  it("only lets the seller take an advance, and not more than the pool holds", async () => {
    const ctx = await deploy();
    const id = await createInvoice(ctx);
    await expect(ctx.engine.connect(ctx.stranger).requestAdvance(id, 3500, 1800)).to.be.revertedWith("Not invoice seller");

    const big = await createInvoice(ctx, U(1_000_000));
    await expect(ctx.engine.connect(ctx.seller).requestAdvance(big, 9000, 800)).to.be.revertedWith("Insufficient vault liquidity");
  });

  it("caps the protocol fee at 5% and restricts who can set it", async () => {
    const ctx = await deploy();
    await expect(ctx.router.setProtocolFee(501)).to.be.revertedWith("Fee too high");
    await expect(ctx.router.connect(ctx.stranger).setProtocolFee(10)).to.be.reverted;
    await ctx.router.setProtocolFee(100);
    expect(await ctx.router.protocolFeeBps()).to.equal(100n);
  });

  it("lets a liquidity provider withdraw", async () => {
    const ctx = await deploy();
    await ctx.vault.connect(ctx.lp).withdraw(U(1_000));
    expect(await ctx.token.balanceOf(ctx.lp.address)).to.equal(U(1_000));
    expect(await ctx.usmt.balanceOf(ctx.lp.address)).to.equal(U(49_000));
  });
});
