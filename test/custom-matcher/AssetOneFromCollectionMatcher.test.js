/* eslint-disable */
import { ethers } from "hardhat";

const order = require("../order.js");
const { enc, ETH, ERC20, ERC721, ERC1155, COLLECTION, id } = require("../assets.js");

describe("AssetMatcherCustom", async accounts => {
  let assetMatcherCollection;
  const accounts = await ethers.getSigners().then((res) => res.map((signer) => signer.address));
  console.log('====================================');
  console.log(accounts);
  console.log('====================================');
  const operator = accounts[3];

  beforeEach(async () => {
    const AssetMatcherCollection = await ethers.getContractFactory("AssetMatcherCollection");
    assetMatcherCollection = await AssetMatcherCollection.deploy();
    await assetMatcherCollection.deployed();
  });

  describe("Check match by customMatcher Match one from Collection", () => {
    it("Collection COLLECTION <-> ERC1155  matches!", async () => {
      const tokenId = 3000;
      console.log('====================================');
      console.log('accounts[5]', accounts[5]);
      console.log('====================================');
      const encoded = enc(accounts[5]);
      const encodedNFT = enc(accounts[5], tokenId);
      const result = await assetMatcherCollection.connect(operator).matchAssets(order.AssetType(COLLECTION, encoded), order.AssetType(ERC1155, encodedNFT),);
      assert.equal(result[0], ERC1155);
      assert.equal(result[1], encodedNFT);
    });

    it("Collection COLLECTION <-> ERC721  matches!", async () => {
      const tokenId = 3000;
      const encoded = enc(accounts[5]);
      const encodedNFT = enc(accounts[5], tokenId);
      const result = await assetMatcherCollection.connect(operator).matchAssets(order.AssetType(COLLECTION, encoded), order.AssetType(ERC721, encodedNFT),);
      assert.equal(result[0], ERC721);
      assert.equal(result[1], encodedNFT);
    });

    it("Collection COLLECTION <-> ERC1155 (another collection) don`t match!", async () => {
      const tokenId = 3000;
      const encoded = enc(accounts[5]);
      const encodedNFT = enc(accounts[6], tokenId);
      const result = await assetMatcherCollection.connect(operator).matchAssets(order.AssetType(COLLECTION, encoded), order.AssetType(ERC1155, encodedNFT),);
      assert.equal(result[0], 0);
    });

    it("Collection COLLECTION <-> ERC721 (another collection) don`t match!", async () => {
      const tokenId = 3000;
      const encoded = enc(accounts[5]);
      const encodedNFT = enc(accounts[6], tokenId);
      const result = await assetMatcherCollection.connect(operator).matchAssets(order.AssetType(COLLECTION, encoded), order.AssetType(ERC721, encodedNFT),);
      assert.equal(result[0], 0);
    });

    it("Collection COLLECTION <-> ERC20  don`t match", async () => {
      const encoded = enc(accounts[5]);
      const encodedERC20 = enc(accounts[5]);
      const result = await assetMatcherCollection.connect(operator).matchAssets(order.AssetType(COLLECTION, encoded), order.AssetType(ERC20, encodedERC20),);
      assert.equal(result[0], 0);
    });

    it("Collection COLLECTION <-> COLLECTION  don`t match", async () => {
      const encoded = enc(accounts[5]);
      const encodedCollection = enc(accounts[5]);
      const result = await assetMatcherCollection.connect(operator).matchAssets(order.AssetType(COLLECTION, encoded), order.AssetType(COLLECTION, encodedCollection),);
      assert.equal(result[0], 0);
    });

    it("Collection COLLECTION <-> ETH  don`t match", async () => {
      const encoded = enc(accounts[5]);
      const encodedETH = enc(accounts[5]);
      const result = await assetMatcherCollection.connect(operator).matchAssets(order.AssetType(COLLECTION, encoded), order.AssetType(ETH, encodedETH),);
      assert.equal(result[0], 0);
    });
  })
});
