import { ethers } from "hardhat";
const { BigNumber } = require('ethers')

const chai = require("chai");
const { solidity } = require("ethereum-waffle");
chai.use(solidity);
const { expect } = chai;
// const truffleAssert = require('truffle-assertions');

// const { expectThrow, verifyBalanceChange } = require("@daonomic/tests-common");

describe("RoyaltiesRegistry, test methods", () => {
  let erc721TokenId1 = 51;
  let erc721TokenId2 = 52;
  let royaltiesRegistry;
  let royaltiesRegistryTest;
  let testRoyaltiesProvider;
  let accounts;
  let signers = {};

  let RoyaltiesRegistry;
  let RoyaltiesRegistryTest;
  let TestERC721RoyaltyV1OwnUpgrd;
  let TestERC721RoyaltyV2OwnUpgrd;
  let TestRoyaltiesProvider;
  let TestERC721RoyaltyV2Legacy;
  let RoyaltiesProviderV2Legacy;
  let TestERC721ArtBlocks;
  let RoyaltiesProviderArtBlocks;
  let TestERC721WithRoyaltiesV2981;

  let ERC721_V1OwnUpgrd;
  let ERC721_V2OwnUpgrd;

  beforeEach(async () => {
    accounts = await ethers.getSigners().then((res) => res.map((signer) => signer.address));
    accounts.map(async (x) => signers[x] = await ethers.getSigner(x))
    RoyaltiesRegistry = await ethers.getContractFactory("RoyaltiesRegistry");
    RoyaltiesRegistryTest = await ethers.getContractFactory("RoyaltiesRegistryTest");
    TestERC721RoyaltyV1OwnUpgrd = await ethers.getContractFactory("TestERC721WithRoyaltiesV1OwnableUpgradeable");
    TestERC721RoyaltyV2OwnUpgrd = await ethers.getContractFactory("TestERC721WithRoyaltiesV2OwnableUpgradeable");
    TestRoyaltiesProvider = await ethers.getContractFactory("RoyaltiesProviderTest");
    TestERC721RoyaltyV2Legacy = await ethers.getContractFactory("TestERC721RoyaltyV2Legacy");
    RoyaltiesProviderV2Legacy = await ethers.getContractFactory("RoyaltiesProviderV2Legacy");
    TestERC721ArtBlocks = await ethers.getContractFactory("TestERC721ArtBlocks");
    RoyaltiesProviderArtBlocks = await ethers.getContractFactory("RoyaltiesProviderArtBlocks");
    TestERC721WithRoyaltiesV2981 = await ethers.getContractFactory("TestERC721WithRoyaltyV2981");

    royaltiesRegistry = await RoyaltiesRegistry.deploy();
    await royaltiesRegistry.__RoyaltiesRegistry_init();
    royaltiesRegistryTest = await RoyaltiesRegistryTest.deploy();
    testRoyaltiesProvider = await TestRoyaltiesProvider.deploy();
  });

  describe("RoyaltiesRegistry token supports IERC2981:", () => {

    it("Get royalties by token, use RoyaltiesRegistryTest (event)", async () => {
      const getRoyalties = accounts[1];
      const tokenId = getRoyalties + "b00000000000000000000001";
      const ERC721_V2981 = await TestERC721WithRoyaltiesV2981.deploy();
      await ERC721_V2981.initialize();                                   	//set 2981 interface

      const part = royaltiesRegistryTest._getRoyalties(royaltiesRegistry.address, ERC721_V2981.address, tokenId);
      await expect(part).to.emit(royaltiesRegistryTest, 'getRoyaltiesTest')
        .withArgs([[getRoyalties, BigNumber.from(1000)]]);
    })

    it("Get royalties by token, use RoyaltiesRegistry (call)", async () => {
      const getRoyalties = accounts[1];
      const tokenId = getRoyalties + "b00000000000000000000001";
      const ERC721_V2981 = await TestERC721WithRoyaltiesV2981.deploy();
      await ERC721_V2981.initialize();                                   	//set 2981 interface

      const part = royaltiesRegistry.getRoyalties.call(ERC721_V2981.address, tokenId);
      await expect(part).to.emit(royaltiesRegistryTest, 'getRoyaltiesTest')
        .withArgs([[getRoyalties, BigNumber.from(1000)]]);
    })
  })

  describe("RoyaltiesRegistry methods works:", () => {

    it("simple V1 royalties", async () => {
      ERC721_V1OwnUpgrd = await TestERC721RoyaltyV1OwnUpgrd.deploy("Rarible", "RARI", "https://ipfs.rarible.com");
      ERC721_V1OwnUpgrd.initialize(); 																				//set V1 interface
      await ERC721_V1OwnUpgrd.mint(accounts[2], erc721TokenId1, [[accounts[5], 1000], [accounts[7], 1200]]);								//set royalties by contract
      const part = await royaltiesRegistryTest._getRoyalties(royaltiesRegistry.address, ERC721_V1OwnUpgrd.address, erc721TokenId1);
      await expect(part).to.emit(royaltiesRegistryTest, 'getRoyaltiesTest')
        .withArgs([[accounts[5], BigNumber.from(1000)], [accounts[7], BigNumber.from(1200)]]);
    })

    it("simple V1 royalties, set empty, check empty", async () => {
      ERC721_V1OwnUpgrd = await TestERC721RoyaltyV1OwnUpgrd.deploy();
      ERC721_V1OwnUpgrd.initialize();                                         //set V1 interface
      await ERC721_V1OwnUpgrd.mint(accounts[2], erc721TokenId1, []);					//set royalties by contract empty
      const part = royaltiesRegistryTest._getRoyalties(royaltiesRegistry.address, ERC721_V1OwnUpgrd.address, erc721TokenId1);
      await expect(part).to.emit(royaltiesRegistryTest, 'getRoyaltiesTest')
        .withArgs([]);
    })

    it("simple V2 royalties", async () => {
      ERC721_V2OwnUpgrd = await TestERC721RoyaltyV2OwnUpgrd.deploy();
      ERC721_V2OwnUpgrd.initialize();                                   	//set V2 interface
      await ERC721_V2OwnUpgrd.mint(accounts[2], erc721TokenId1, [[accounts[5], 700], [accounts[6], 800], [accounts[7], 900], [accounts[8], 1000]]);  //set royalties by contract
      const part = royaltiesRegistryTest._getRoyalties(royaltiesRegistry.address, ERC721_V2OwnUpgrd.address, erc721TokenId1);
      await expect(part).to.emit(royaltiesRegistryTest, 'getRoyaltiesTest')
        .withArgs([[accounts[5], BigNumber.from(700)], [accounts[6], BigNumber.from(800)], [accounts[7], BigNumber.from(900)], [accounts[8], BigNumber.from(1000)]]);
    })

    it("simple V2 royalties, set empty, check empty", async () => {
      ERC721_V2OwnUpgrd = await TestERC721RoyaltyV2OwnUpgrd.deploy("Rarible", "RARI", "https://ipfs.rarible.com");
      ERC721_V2OwnUpgrd.initialize();                                       //set V2 interface
      await ERC721_V2OwnUpgrd.mint(accounts[2], erc721TokenId1, []);        //set royalties by contract empty
      const part = royaltiesRegistryTest._getRoyalties(royaltiesRegistry.address, ERC721_V2OwnUpgrd.address, erc721TokenId1);
      await expect(part).to.emit(royaltiesRegistryTest, 'getRoyaltiesTest')
        .withArgs([]);
    })

    it("SetRoyaltiesByToken, initialize by Owner, emit get", async () => {
      await royaltiesRegistry.setRoyaltiesByToken(accounts[5], [[accounts[3], 600], [accounts[4], 1100]]); //set royalties by token and tokenId
      await royaltiesRegistry.setRoyaltiesByToken(accounts[5], [[accounts[3], 600], [accounts[4], 1100]]); //set royalties by token and tokenId
      const part = royaltiesRegistryTest._getRoyalties(royaltiesRegistry.address, accounts[5], erc721TokenId1);
      await expect(part).to.emit(royaltiesRegistryTest, 'getRoyaltiesTest')
        .withArgs([[accounts[3], BigNumber.from(600)], [accounts[4], BigNumber.from(1100)]]);
    })

    it("SetRoyaltiesByToken, initialize by OwnableUpgradaeble(ERC721_V1OwnUpgrd).owner", async () => {
      const ownerErc721 = accounts[6];
      const signer = signers[ownerErc721];
      ERC721_V1OwnUpgrd = await TestERC721RoyaltyV1OwnUpgrd.deploy();
      await ERC721_V1OwnUpgrd.connect(signer).initialize();
      await ERC721_V1OwnUpgrd.mint(accounts[2], erc721TokenId1, []);
      await royaltiesRegistry.connect(signer).setRoyaltiesByToken(ERC721_V1OwnUpgrd.address, [[accounts[3], 500], [accounts[4], 1000]]); //set royalties by token and tokenId
      const part = royaltiesRegistryTest._getRoyalties(royaltiesRegistry.address, ERC721_V1OwnUpgrd.address, erc721TokenId1);
      await expect(part).to.emit(royaltiesRegistryTest, 'getRoyaltiesTest')
        .withArgs([[accounts[3], BigNumber.from(500)], [accounts[4], BigNumber.from(1000)]]);
    })

  })

  describe("ExternalProviders test:", () => {

    it("using royaltiesProvider v2 legacy", async () => {

      const token = await TestERC721RoyaltyV2Legacy.deploy("Rarible", "RARI", "https://ipfs.rarible.com");
      const provider = await RoyaltiesProviderV2Legacy();

      await royaltiesRegistry.setProviderByToken(token.address, provider.address);

      const royaltiesToSet = [[accounts[1], 1000]]
      await token.mint(accounts[2], erc721TokenId1);
      await token._saveRoyalties(erc721TokenId1, royaltiesToSet)

      const royalties = await royaltiesRegistry.getRoyalties.call(token.address, erc721TokenId1)
      assert.equal(royalties[0][0], royaltiesToSet[0][0], "royalty recepient 0");
      assert.equal(royalties[0][1], royaltiesToSet[0][1], "token address 0");

    })

    it("using royaltiesProvider artBlocks", async () => {

      const artBlocksAddr = accounts[5];
      const artistAdrr = accounts[2];
      const addPayeeAddr = accounts[4];

      //deploying contracts
      const token = await TestERC721ArtBlocks.deploy("Rarible", "RARI", "https://ipfs.rarible.com");
      const provider = await RoyaltiesProviderArtBlocks({ from: artBlocksAddr });

      const owner = await provider.owner();
      assert.equal(owner, artBlocksAddr, "owner")

      const artblocksPercentage = await provider.artblocksPercentage();
      assert.equal(artblocksPercentage, 250, "artblocksPercentage")

      //setting provider in registry
      await royaltiesRegistry.setProviderByToken(token.address, provider.address);

      //creating token and setting royalties
      await token.mint(artistAdrr, erc721TokenId1);
      await token.updateProjectAdditionalPayeeInfo(erc721TokenId1, addPayeeAddr, 44);
      await token.updateProjectSecondaryMarketRoyaltyPercentage(erc721TokenId1, 15);

      //getting royalties for token
      const royaltiesFromProvider = await provider.getRoyalties(token.address, erc721TokenId1);

      assert.equal(royaltiesFromProvider[0].account, artBlocksAddr, "artBlocks royalty address")
      assert.equal(royaltiesFromProvider[0].value, 250, "artBlocks royalty percentage")

      assert.equal(royaltiesFromProvider[1].account, artistAdrr, "artist royalty address")
      assert.equal(royaltiesFromProvider[1].value, 840, "artBlocks royalty percentage")

      assert.equal(royaltiesFromProvider[2].account, addPayeeAddr, "additional payee royalty address")
      assert.equal(royaltiesFromProvider[2].value, 660, "additional payee royalty percentage")

      //changing artBlocksAddr
      const newArtBlocksAddr = accounts[6]
      let eventSetAddr;
      const txSetAddr = await provider.transferOwnership(newArtBlocksAddr, { from: artBlocksAddr })
      // truffleAssert.eventEmitted(txSetAddr, 'OwnershipTransferred', (ev) => {
      //   eventSetAddr = ev;
      //   return true;
      // });
      assert.equal(eventSetAddr.previousOwner, artBlocksAddr, "from artBlocks addr");
      assert.equal(eventSetAddr.deployOwner, newArtBlocksAddr, "to artBlocks addr");

      // await expectThrow(
      //   provider.transferOwnership(artBlocksAddr, { from: artBlocksAddr })
      // );

      //checking royalties
      const royalties = await royaltiesRegistry.getRoyalties.call(token.address, erc721TokenId1)

      assert.equal(royalties[0].account, newArtBlocksAddr, "artBlocks addr");
      assert.equal(royalties[0].value, 250, "artBlocks value");

      assert.equal(royalties[1].account, artistAdrr, "artist addr");
      assert.equal(royalties[1].value, 840, "artist value");

      assert.equal(royalties[2].account, addPayeeAddr, "additional payee addr");
      assert.equal(royalties[2].value, 660, "additional payee value");

      //setting new artblocksPercentage
      let eventChangePercentage;
      const txChangePercentage = await provider.setArtblocksPercentage(300, { from: newArtBlocksAddr })
      // truffleAssert.eventEmitted(txChangePercentage, 'ArtblocksPercentageChanged', (ev) => {
      //   eventChangePercentage = ev;
      //   return true;
      // });
      assert.equal(eventChangePercentage._who, newArtBlocksAddr, "from artBlocks addr");
      assert.equal(eventChangePercentage._old, 250, "old percentage");
      assert.equal(eventChangePercentage._new, 300, "new percentage");

      //only owner can set %
      // await expectThrow(
      //   provider.setArtblocksPercentage(0, { from: artBlocksAddr })
      // );

      // _artblocksPercentage can't be over 10000
      // await expectThrow(
      //   provider.setArtblocksPercentage(100000, { from: newArtBlocksAddr })
      // );
    })

    it("using royaltiesProvider artBlocks royalties edge cases", async () => {

      const artBlocksAddr = accounts[5];
      const artistAdrr = accounts[2];
      const addPayeeAddr = accounts[4];

      //deploying contracts
      const token = await TestERC721ArtBlocks.deploy("Rarible", "RARI", "https://ipfs.rarible.com");
      const provider = await RoyaltiesProviderArtBlocks({ from: artBlocksAddr });

      const owner = await provider.owner();
      assert.equal(owner, artBlocksAddr, "owner")

      const artblocksPercentage = await provider.artblocksPercentage();
      assert.equal(artblocksPercentage, 250, "artblocksPercentage")

      //setting provider in registry
      await royaltiesRegistry.setProviderByToken(token.address, provider.address);

      //creating token and setting royalties
      await token.mint(artistAdrr, erc721TokenId1);
      await token.updateProjectAdditionalPayeeInfo(erc721TokenId1, addPayeeAddr, 0);
      await token.updateProjectSecondaryMarketRoyaltyPercentage(erc721TokenId1, 15);

      //getting royalties for token
      //case artist = 15% additionalPatee = 0
      const royaltiesFromProvider = await provider.getRoyalties(token.address, erc721TokenId1);
      assert.equal(royaltiesFromProvider[0].account, artBlocksAddr, "artBlocks royalty address")
      assert.equal(royaltiesFromProvider[0].value, 250, "artBlocks royalty percentage")

      assert.equal(royaltiesFromProvider[1].account, artistAdrr, "artist royalty address")
      assert.equal(royaltiesFromProvider[1].value, 1500, "artBlocks royalty percentage")

      assert.equal(royaltiesFromProvider.length, 2, "should be 2 royalties")

      //case artist = 15%, additionalPayee = 100% of 15%
      await token.updateProjectAdditionalPayeeInfo(erc721TokenId1, addPayeeAddr, 100);
      const royaltiesFromProvider2 = await provider.getRoyalties(token.address, erc721TokenId1);

      assert.equal(royaltiesFromProvider2[0].account, artBlocksAddr, "artBlocks royalty address")
      assert.equal(royaltiesFromProvider2[0].value, 250, "artBlocks royalty percentage")

      assert.equal(royaltiesFromProvider2[1].account, addPayeeAddr, "artist royalty address")
      assert.equal(royaltiesFromProvider2[1].value, 1500, "artBlocks royalty percentage")

      assert.equal(royaltiesFromProvider2.length, 2, "should be 2 royalties")

      //case additionalPayee > 100
      await token.updateProjectAdditionalPayeeInfo(erc721TokenId1, addPayeeAddr, 110);
      // await expectThrow(
      //   provider.getRoyalties(token.address, erc721TokenId1)
      // );
      await token.updateProjectAdditionalPayeeInfo(erc721TokenId1, addPayeeAddr, 0);

      //case artist > 100
      await token.updateProjectSecondaryMarketRoyaltyPercentage(erc721TokenId1, 110);
      // await expectThrow(
      //   provider.getRoyalties(token.address, erc721TokenId1)
      // );
      await token.updateProjectSecondaryMarketRoyaltyPercentage(erc721TokenId1, 0);

      //case artist = 0, additionalPayee = 0
      const royaltiesFromProvider3 = await provider.getRoyalties(token.address, erc721TokenId1);
      assert.equal(royaltiesFromProvider3[0].account, artBlocksAddr, "artBlocks royalty address")
      assert.equal(royaltiesFromProvider3[0].value, 250, "artBlocks royalty percentage")
      assert.equal(royaltiesFromProvider3.length, 1, "should be 1 royalties")

      //case artist = 0, additionalPayee = 0, artBlocks = 0
      await provider.setArtblocksPercentage(0, { from: artBlocksAddr })
      const royaltiesFromProvider4 = await provider.getRoyalties(token.address, erc721TokenId1);
      assert.equal(royaltiesFromProvider4.length, 0, "should be 0 royalties")

    })

    it("SetProviderByToken, initialize by Owner", async () => {
      ERC721_V1OwnUpgrd = await TestERC721RoyaltyV1OwnUpgrd();
      await testRoyaltiesProvider.initializeProvider(ERC721_V1OwnUpgrd.address, erc721TokenId1, [[accounts[3], 500], [accounts[4], 1000]]); //initialize royalties provider
      await ERC721_V1OwnUpgrd.mint(accounts[2], erc721TokenId1, []);
      await royaltiesRegistry.setProviderByToken(ERC721_V1OwnUpgrd.address, testRoyaltiesProvider.address); 	//set royalties by provider
      const part = await royaltiesRegistryTest._getRoyalties(royaltiesRegistry.address, ERC721_V1OwnUpgrd.address, erc721TokenId1);
      await expect(part).to.emit(royaltiesRegistryTest, 'getRoyaltiesTest')
        .withArgs([[accounts[3], BigNumber.from(500)], [accounts[4], BigNumber.from(1000)]]);
    })

    it("SetProviderByToken + ContractRoyalties, which not work, because royalties detect by provider, initialize by Owner", async () => {
      ERC721_V1OwnUpgrd = await TestERC721RoyaltyV1OwnUpgrd.deploy();
      ERC721_V1OwnUpgrd.initialize();  //set V1 interface
      await testRoyaltiesProvider.initializeProvider(ERC721_V1OwnUpgrd.address, erc721TokenId1, [[accounts[3], 500], [accounts[4], 1000]]); 	//initialize royalties provider
      await ERC721_V1OwnUpgrd.mint(accounts[2], erc721TokenId1, [[accounts[5], 1000], [accounts[7], 1200]]);								//set royalties by contract
      await royaltiesRegistry.setProviderByToken(ERC721_V1OwnUpgrd.address, testRoyaltiesProvider.address); 								//set royalties by provider
      const part = royaltiesRegistryTest._getRoyalties(royaltiesRegistry.address, ERC721_V1OwnUpgrd.address, erc721TokenId1);
      await expect(part).to.emit(royaltiesRegistryTest, 'getRoyaltiesTest')
        .withArgs([[accounts[3], BigNumber.from(500)], [accounts[4], BigNumber.from(1000)]]);
    })

    it("SetProviderByToken, initialize  by ownableUpgradaeble(ERC721_V1OwnUpgrd).owner ", async () => {
      const ownerErc721 = accounts[6];
      const signer = signers[ownerErc721];
      ERC721_V1OwnUpgrd = await TestERC721RoyaltyV1OwnUpgrd.deploy();
      await testRoyaltiesProvider.initializeProvider(ERC721_V1OwnUpgrd.address, erc721TokenId1, [[accounts[3], 600], [accounts[4], 1100]]); 				//initialize royalties provider
      await ERC721_V1OwnUpgrd.connect(signer).initialize();
      await ERC721_V1OwnUpgrd.mint(accounts[2], erc721TokenId1, []);
      await royaltiesRegistry.connect(signer).setProviderByToken(ERC721_V1OwnUpgrd.address, testRoyaltiesProvider.address); //set royalties by provider
      const part = royaltiesRegistryTest._getRoyalties(royaltiesRegistry.address, ERC721_V1OwnUpgrd.address, erc721TokenId1);
      await expect(part).to.emit(royaltiesRegistryTest, 'getRoyaltiesTest')
        .withArgs([[accounts[3], BigNumber.from(600)], [accounts[4], BigNumber.from(1100)]]);
    })

    it("SetProviderByToken, initialize by ownableUpgradaeble(ERC721_V1OwnUpgrd).owner, royalties for erc721TokenId2 should be empty", async () => {
      const ownerErc721 = accounts[6];
      const signer = signers[ownerErc721];
      ERC721_V1OwnUpgrd = await TestERC721RoyaltyV1OwnUpgrd.deploy();
      await testRoyaltiesProvider.initializeProvider(ERC721_V1OwnUpgrd.address, erc721TokenId1, [[accounts[3], 600], [accounts[4], 1100]]); 				//initialize royalties provider
      await ERC721_V1OwnUpgrd.connect(signer).initialize();
      await ERC721_V1OwnUpgrd.mint(accounts[2], erc721TokenId2, []);
      await royaltiesRegistry.connect(signer).setProviderByToken(ERC721_V1OwnUpgrd.address, testRoyaltiesProvider.address); //set royalties by provider
      const part = royaltiesRegistryTest._getRoyalties(royaltiesRegistry.address, ERC721_V1OwnUpgrd.address, erc721TokenId2);
      await expect(part).to.emit(royaltiesRegistryTest, 'getRoyaltiesTest')
        .withArgs([]);
    })

  })
});