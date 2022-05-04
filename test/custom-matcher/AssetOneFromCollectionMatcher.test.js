/* eslint-disable */
import { ethers } from "hardhat";

const order = require("../order.js");
const { enc, ETH, ERC20, ERC721, ERC1155, COLLECTION, id } = require("../assets.js");
const chai = require("chai");
const { solidity } = require("ethereum-waffle");
chai.use(solidity);
const { expect } = chai;

describe("AssetMatcherCustom", function () {
  let assetMatcherCollection;
  let accounts;
  let operator;

  beforeEach(async () => {
    accounts = await ethers.getSigners().then((res) => res.map((signer) => signer.address));
    operator = accounts[3];
    const AssetMatcherCollection = await ethers.getContractFactory("AssetMatcherCollection");
    assetMatcherCollection = await AssetMatcherCollection.deploy();
    await assetMatcherCollection.deployed();
  });

  describe("Check match by customMatcher Match one from Collection", () => {
    it("Collection COLLECTION <-> ERC1155  matches!", async () => {
      const tokenId = 3000;
      const encoded = enc(accounts[5]);
      const encodedNFT = enc(accounts[5], tokenId);
      const result = await assetMatcherCollection.connect(operator).matchAssets(order.AssetType(COLLECTION, encoded), order.AssetType(ERC1155, encodedNFT),);
      await expect(result[0]).to.be.equal(ERC1155);
      await expect(result[1]).to.be.equal(encodedNFT);
    });

    it("Collection COLLECTION <-> ERC721  matches!", async () => {
      const tokenId = 3000;
      const encoded = enc(accounts[5]);
      const encodedNFT = enc(accounts[5], tokenId);
      const result = await assetMatcherCollection.connect(operator).matchAssets(order.AssetType(COLLECTION, encoded), order.AssetType(ERC721, encodedNFT),);
      expect(result[0]).to.be.equal(ERC721);
      expect(result[1]).to.be.equal(encodedNFT);
    });

    it("Collection COLLECTION <-> ERC1155 (another collection) don`t match!", async () => {
      const tokenId = 3000;
      const encoded = enc(accounts[5]);
      const encodedNFT = enc(accounts[6], tokenId);
      const result = await assetMatcherCollection.connect(operator).matchAssets(order.AssetType(COLLECTION, encoded), order.AssetType(ERC1155, encodedNFT),);
      expect(result[0]).to.be.equal(0);
    });

    it("Collection COLLECTION <-> ERC721 (another collection) don`t match!", async () => {
      const tokenId = 3000;
      const encoded = enc(accounts[5]);
      const encodedNFT = enc(accounts[6], tokenId);
      const result = await assetMatcherCollection.connect(operator).matchAssets(order.AssetType(COLLECTION, encoded), order.AssetType(ERC721, encodedNFT),);
      expect(result[0]).to.be.equal(0);
    });

    it("Collection COLLECTION <-> ERC20  don`t match", async () => {
      const encoded = enc(accounts[5]);
      const encodedERC20 = enc(accounts[5]);
      const result = await assetMatcherCollection.connect(operator).matchAssets(order.AssetType(COLLECTION, encoded), order.AssetType(ERC20, encodedERC20),);
      expect(result[0]).to.be.equal(0);
    });

    it("Collection COLLECTION <-> COLLECTION  don`t match", async () => {
      const encoded = enc(accounts[5]);
      const encodedCollection = enc(accounts[5]);
      const result = await assetMatcherCollection.connect(operator).matchAssets(order.AssetType(COLLECTION, encoded), order.AssetType(COLLECTION, encodedCollection),);
      expect(result[0]).to.be.equal(0);
    });

    it("Collection COLLECTION <-> ETH  don`t match", async () => {
      const encoded = enc(accounts[5]);
      const encodedETH = enc(accounts[5]);
      const result = await assetMatcherCollection.connect(operator).matchAssets(order.AssetType(COLLECTION, encoded), order.AssetType(ETH, encodedETH),);
      expect(result[0]).to.be.equal(0);
    });
  })
});
