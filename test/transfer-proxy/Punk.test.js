import { ethers } from "hardhat";
const { Asset } = require("../order");
const { id, enc } = require("../assets");
const chai = require('chai');
const { solidity } = require('ethereum-waffle');
chai.use(solidity);
const { expect } = chai;
const expectEvent = require('../helpers/expectEvent.ts');


/*Proxy  buy punk, sfter Proxy transfer punk to buyer */
describe("Exchange with PunkTransfer proxies", () => {
  let punkIndex = 256;
  let proxy;
  let cryptoPunksMarket;
  let accounts;
  let signers = {};


  let operator;
  before(async () => {
    accounts = await ethers
      .getSigners()
      .then((res) => res.map((signer) => signer.address));
    operator = accounts[1];
    accounts.map(async (x) => (signers[x] = await ethers.getSigner(x)));
  });

  beforeEach(async () => {
    const CryptoPunksMarket = await ethers.getContractFactory("CryptoPunksMarket");
    const PunkTransferProxy = await ethers.getContractFactory("PunkTransferProxy")
    cryptoPunksMarket = await CryptoPunksMarket.deploy();
    await cryptoPunksMarket.allInitialOwnersAssigned(); //allow test contract work with Punk CONTRACT_OWNER accounts[0]
    proxy = await PunkTransferProxy.deploy();;
    await proxy.__OperatorRole_init();
    await proxy.addOperator(operator)
  });

  it("Proxy transfer punk", async () => {
    await cryptoPunksMarket.connect(signers[accounts[1]]).getPunk(punkIndex); //accounts[1] - owner punk with punkIndex
    await cryptoPunksMarket.connect(signers[accounts[1]]).offerPunkForSaleToAddress(punkIndex, 0, proxy.address); //accounts[1] - wants to sell punk with punkIndex, min price 0 wei

    expect(await cryptoPunksMarket.balanceOf(accounts[1])).to.be.equal(1); //punk owner - accounts[1]
    const encodedPunkData = await enc(cryptoPunksMarket.address, punkIndex);

    await proxy.connect(signers[operator]).transfer(Asset(id("PUNK"), encodedPunkData, 1), accounts[1], accounts[2]);
    expect(await cryptoPunksMarket.balanceOf(accounts[1])).to.be.equal(0);
    expect(await cryptoPunksMarket.balanceOf(proxy.address)).to.be.equal(0);
    expect(await cryptoPunksMarket.balanceOf(accounts[2])).to.be.equal(1);//punk owner - accounts[2]
  })

  it("Try to transfer punk, which not offer to sale, throw", async () => {
    await cryptoPunksMarket.connect(signers[accounts[1]]).getPunk(punkIndex); //accounts[1] - owner punk with punkIndex
    await cryptoPunksMarket.connect(signers[accounts[1]]).offerPunkForSaleToAddress(punkIndex, 0, proxy.address); //accounts[1] - wants to sell punk to proxy with punkIndex, min price 0 wei
    let anotherPunkIndex = 300;
    expect(await cryptoPunksMarket.balanceOf(accounts[1])).to.be.equal(1); //punk owner accounts[1]
    const encodedPunkData = await enc(cryptoPunksMarket.address, anotherPunkIndex);

    await expect(
      proxy.connect(signers[accounts[1]]).transfer(Asset(id("PUNK"), encodedPunkData, 1), accounts[1], accounts[2])
    ).to.be.reverted;
  })

  it("Try to transfer punk, which offer not for proxy.address, throw", async () => {
    await cryptoPunksMarket.connect(signers[accounts[1]]).getPunk(punkIndex); //accounts[1] - owner punk with punkIndex
    await cryptoPunksMarket.connect(signers[accounts[1]]).offerPunkForSaleToAddress(punkIndex, 0, accounts[2]); //accounts[1] - wants to sell punk to accounts[2]  with punkIndex, min price 0 wei

    expect(await cryptoPunksMarket.balanceOf(accounts[1])).to.be.equal(1); //punk owner accounts[1]
    const encodedPunkData = await enc(cryptoPunksMarket.address, punkIndex);

    await expect(
      proxy.connect(signers[accounts[1]]).transfer(Asset(id("PUNK"), encodedPunkData, 1), accounts[1], accounts[2])
    ).to.be.reverted;
  })

  it("Check punk event", async () => {
    await cryptoPunksMarket.connect(signers[accounts[1]]).getPunk(punkIndex); //accounts[1] - owner punk with punkIndex
    let resOffer = await cryptoPunksMarket.connect(signers[accounts[1]]).offerPunkForSaleToAddress(punkIndex, 5, proxy.address); //accounts[1] - wants to sell punk with punkIndex, min price 0 wei
    resOffer = await resOffer.wait();
    expectEvent.inReceipt(resOffer, 'PunkOffered', { toAddress: proxy.address, punkIndex: punkIndex, minValue: 5 });
  })
});
