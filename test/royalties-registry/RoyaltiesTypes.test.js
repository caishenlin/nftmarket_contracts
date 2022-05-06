import { ethers, upgrades } from "hardhat";
const { BigNumber } = require('ethers')

const chai = require("chai");
const { solidity } = require("ethereum-waffle");
chai.use(solidity);
const { expect } = chai;

// const { expectThrow, verifyBalanceChange, assertEq } = require("@daonomic/tests-common");

describe("RoyaltiesRegistry, royalties types test", () => {

  let RoyaltiesRegistry;
  let RoyaltiesRegistryOld;
  let accounts;
  let signers = {};

  let TestERC721RoyaltyV1OwnUpgrd;
  let TestERC721RoyaltyV2OwnUpgrd;
  let TestRoyaltiesProvider;
  let TestERC721WithRoyaltiesV2981;
  let TestERC721;
  let royaltiesRegistry;

  let royaltiesAddr1;
  let royaltiesAddr2;
  let ownerErc721;

  let defaultRoyalties;
  const defaultTokenId1 = 533;
  const defaultTokenId2 = 644;

  const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

  beforeEach(async () => {
    accounts = await ethers.getSigners().then((res) => res.map((signer) => signer.address));
    accounts.map(async (x) => signers[x] = await ethers.getSigner(x))

    royaltiesAddr1 = accounts[5]
    royaltiesAddr2 = accounts[6]
    ownerErc721 = accounts[7];

    defaultRoyalties = [[royaltiesAddr1, 1000], [royaltiesAddr2, 500]]

    RoyaltiesRegistry = await ethers.getContractFactory("RoyaltiesRegistry");
    RoyaltiesRegistryOld = await ethers.getContractFactory("RoyaltiesRegistryOld");
    TestERC721RoyaltyV1OwnUpgrd = await ethers.getContractFactory("TestERC721WithRoyaltiesV1OwnableUpgradeable");
    TestERC721RoyaltyV2OwnUpgrd = await ethers.getContractFactory("TestERC721WithRoyaltiesV2OwnableUpgradeable");
    TestRoyaltiesProvider = await ethers.getContractFactory("RoyaltiesProviderTest");
    TestERC721WithRoyaltiesV2981 = await ethers.getContractFactory("TestERC721WithRoyaltyV2981");
    TestERC721 = await ethers.getContractFactory("TestERC721");
    //royalties registry
    royaltiesRegistry = await RoyaltiesRegistry.deploy();
    await royaltiesRegistry.__RoyaltiesRegistry_init();
  });

  describe("royalties types are set correctly", () => {

    it("test royalties type = 1, royalties set in royaltiesByToken", async () => {
      const token = royaltiesRegistry.address;

      await royaltiesRegistry.setRoyaltiesByToken(token, defaultRoyalties)
      expect(await royaltiesRegistry.getRoyaltiesType(token)).to.be.equal(1, "setRoyaltiesByToken type = 1")

      await royaltiesRegistry.clearRoyaltiesType(token);
      expect(await royaltiesRegistry.getRoyaltiesType(token)).to.be.equal(0, "correct royalties type")

      const tx1 = await royaltiesRegistry.getRoyalties(token, defaultTokenId1);
      expect(await royaltiesRegistry.getRoyaltiesType(token)).to.be.equal(1, "correct royalties type")
      console.log("royaltiesByToken gas used first request", tx1.receipt.gasUsed)

      const tx2 = await royaltiesRegistry.getRoyalties(token, defaultTokenId2);
      expect(await royaltiesRegistry.getRoyaltiesType(token)).to.be.equal(1, "correct royalties type")
      console.log("royaltiesByToken gas used second request", tx2.receipt.gasUsed)
    })

    //   it("test royalties type = 2, royalties v2", async () => {
    //     const ERC721_V2OwnUpgrd = await TestERC721RoyaltyV2OwnUpgrd.deploy("Rarible", "RARI", "https://ipfs.rarible.com", { from: ownerErc721 });
    //     await ERC721_V2OwnUpgrd.initialize({ from: ownerErc721 });
    //     await ERC721_V2OwnUpgrd.mint(accounts[2], defaultTokenId1, defaultRoyalties);
    //     await ERC721_V2OwnUpgrd.mint(accounts[2], defaultTokenId2, defaultRoyalties);

    //     const tx1 = await royaltiesRegistry.getRoyalties(ERC721_V2OwnUpgrd.address, defaultTokenId1);
    //     assert.equal(await royaltiesRegistry.getRoyaltiesType(ERC721_V2OwnUpgrd.address), 2, "correct royalties type")
    //     console.log("royalties v2 gas used first request", tx1.receipt.gasUsed)

    //     const tx2 = await royaltiesRegistry.getRoyalties(ERC721_V2OwnUpgrd.address, defaultTokenId2);
    //     assert.equal(await royaltiesRegistry.getRoyaltiesType(ERC721_V2OwnUpgrd.address), 2, "correct royalties type")
    //     console.log("royalties v2 gas used second request", tx2.receipt.gasUsed)
    //   })

    //   it("test royalties type = 3, royalties v1", async () => {
    //     const ERC721_V1OwnUpgrd = await TestERC721RoyaltyV1OwnUpgrd.deploy("Rarible", "RARI", "https://ipfs.rarible.com", { from: ownerErc721 });
    //     await ERC721_V1OwnUpgrd.initialize({ from: ownerErc721 });
    //     await ERC721_V1OwnUpgrd.mint(accounts[2], defaultTokenId1, defaultRoyalties);
    //     await ERC721_V1OwnUpgrd.mint(accounts[2], defaultTokenId2, defaultRoyalties);

    //     const tx1 = await royaltiesRegistry.getRoyalties(ERC721_V1OwnUpgrd.address, defaultTokenId1);
    //     assert.equal(await royaltiesRegistry.getRoyaltiesType(ERC721_V1OwnUpgrd.address), 3, "correct royalties type")
    //     console.log("royalties v1 gas used first request", tx1.receipt.gasUsed)

    //     const tx2 = await royaltiesRegistry.getRoyalties(ERC721_V1OwnUpgrd.address, defaultTokenId2);
    //     assert.equal(await royaltiesRegistry.getRoyaltiesType(ERC721_V1OwnUpgrd.address), 3, "correct royalties type")
    //     console.log("royalties v1 gas used second request", tx2.receipt.gasUsed)
    //   })

    //   it("test royalties type = 4, royalties from external provider", async () => {
    //     const token = royaltiesRegistry.address;

    //     const testRoyaltiesProvider = await TestRoyaltiesProvider.deploy();
    //     await testRoyaltiesProvider.initializeProvider(token, defaultTokenId1, defaultRoyalties);
    //     await testRoyaltiesProvider.initializeProvider(token, defaultTokenId2, defaultRoyalties);

    //     await royaltiesRegistry.setProviderByToken(token, testRoyaltiesProvider.address)
    //     assert.equal(await royaltiesRegistry.getRoyaltiesType(token), 4, "external provider type = 4")

    //     await royaltiesRegistry.clearRoyaltiesType(token);
    //     assert.equal(await royaltiesRegistry.getRoyaltiesType(token), 0, "correct royalties type")

    //     const tx1 = await royaltiesRegistry.getRoyalties(token, defaultTokenId1);
    //     assert.equal(await royaltiesRegistry.getRoyaltiesType(token), 4, "correct royalties type")
    //     console.log("external provider gas used first request", tx1.receipt.gasUsed)

    //     const tx2 = await royaltiesRegistry.getRoyalties(token, defaultTokenId2);
    //     assert.equal(await royaltiesRegistry.getRoyaltiesType(token), 4, "correct royalties type")
    //     console.log("external provider gas used second request", tx2.receipt.gasUsed)
    //   })

    //   it("test royalties type = 5, royalties 2981", async () => {
    //     const tokenId1 = accounts[1] + "b00000000000000000000001";
    //     const tokenId2 = accounts[2] + "b00000000000000000000002";

    //     const ERC721_V2981 = await TestERC721WithRoyaltiesV2981.deploy("Rarible", "RARI", "https://ipfs.rarible.com", { from: ownerErc721 });
    //     await ERC721_V2981.initialize({ from: ownerErc721 });

    //     const tx1 = await royaltiesRegistry.getRoyalties(ERC721_V2981.address, tokenId1);
    //     assert.equal(await royaltiesRegistry.getRoyaltiesType(ERC721_V2981.address), 5, "correct royalties type")
    //     console.log("royalties 2981 gas used first request", tx1.receipt.gasUsed)

    //     const tx2 = await royaltiesRegistry.getRoyalties(ERC721_V2981.address, tokenId2);
    //     assert.equal(await royaltiesRegistry.getRoyaltiesType(ERC721_V2981.address), 5, "correct royalties type")
    //     console.log("royalties 2981 gas used second request", tx2.receipt.gasUsed)
    //   })

    //   it("test royalties type = 6, no royalties contract", async () => {
    //     const token = royaltiesRegistry.address

    //     await royaltiesRegistry.getRoyalties(token, defaultTokenId1)
    //     assert.equal(await royaltiesRegistry.getRoyaltiesType(token), 6, "type 6 ")
    //     assert.equal((await royaltiesRegistry.getRoyalties.call(token, defaultTokenId1)).length, 0, "royalties 0")
    //   })

    //   it("should change royalties types correctly", async () => {
    //     const token = royaltiesRegistry.address

    //     //firstly type = 6, no royalties
    //     await royaltiesRegistry.getRoyalties(token, defaultTokenId1)
    //     assert.equal(await royaltiesRegistry.getRoyaltiesType(token), 6, "type 6 ")
    //     assert.equal((await royaltiesRegistry.getRoyalties.call(token, defaultTokenId1)).length, 0, "royalties 0")

    //     const testRoyaltiesProvider = await TestRoyaltiesProvider.deploy();
    //     await testRoyaltiesProvider.initializeProvider(token, defaultTokenId1, defaultRoyalties);
    //     await testRoyaltiesProvider.initializeProvider(token, defaultTokenId2, defaultRoyalties);

    //     // then we set external provider, now type is 4
    //     await royaltiesRegistry.setProviderByToken(token, testRoyaltiesProvider.address)
    //     assert.equal(await royaltiesRegistry.getRoyaltiesType(token), 4, "external provider type = 4")


    //     // then we use setRoyaltiesByToken
    //     await royaltiesRegistry.setRoyaltiesByToken(token, defaultRoyalties)
    //     assert.equal(await royaltiesRegistry.getRoyaltiesType(token), 1, "setRoyaltiesByToken type = 1")

    //     // finally clear type
    //     await royaltiesRegistry.clearRoyaltiesType(token);
    //     assert.equal(await royaltiesRegistry.getRoyaltiesType(token), 0, "correct royalties type")

    //   })

    //   it("royalties types correctly work with zero address", async () => {
    //     assert.equal(await royaltiesRegistry.getRoyaltiesType(ZERO_ADDRESS), 0, "unset royalties type = 0")
    //   })

    // })

    // describe("royalties types set correctly from external methods", () => {

    //   it("setRoyaltiesByToken sets royalties type = 1", async () => {
    //     const token = accounts[4];

    //     await royaltiesRegistry.setRoyaltiesByToken(token, defaultRoyalties)
    //     assert.equal(await royaltiesRegistry.getProvider(token), ZERO_ADDRESS, "provider is not set")
    //     assert.equal(await royaltiesRegistry.getRoyaltiesType(token), 1, "setRoyaltiesByToken type = 1")

    //     //forceSetRoyaltiesType = 3
    //     await royaltiesRegistry.forceSetRoyaltiesType(token, 3);
    //     assert.equal(await royaltiesRegistry.getRoyaltiesType(token), 3, "forceSetRoyaltiesType 3")
    //     assert.equal(await royaltiesRegistry.getProvider(token), ZERO_ADDRESS, "provider is not set")

    //     //clearRoyaltiesType
    //     await royaltiesRegistry.clearRoyaltiesType(token);
    //     assert.equal(await royaltiesRegistry.getRoyaltiesType(token), 0, "clearRoyaltiesType ")
    //     assert.equal(await royaltiesRegistry.getProvider(token), ZERO_ADDRESS, "provider is not set")
    //   })

    //   it("setProvider sets royalties type = 4, forceSetRoyaltiesType = 3, clearRoyaltiesType", async () => {
    //     const token = accounts[4];
    //     const provider = accounts[5]

    //     await royaltiesRegistry.setProviderByToken(token, provider)
    //     assert.equal(await royaltiesRegistry.getProvider(token), provider, "setProviderByToken works")
    //     assert.equal(await royaltiesRegistry.getRoyaltiesType(token), 4, "external provider type = 4")

    //     //forceSetRoyaltiesType = 3
    //     await royaltiesRegistry.forceSetRoyaltiesType(token, 3);
    //     assert.equal(await royaltiesRegistry.getRoyaltiesType(token), 3, "forceSetRoyaltiesType 3")
    //     assert.equal(await royaltiesRegistry.getProvider(token), provider, "provider is set")

    //     //clearRoyaltiesType
    //     await royaltiesRegistry.clearRoyaltiesType(token);
    //     assert.equal(await royaltiesRegistry.getRoyaltiesType(token), 0, "clearRoyaltiesType ")
    //     assert.equal(await royaltiesRegistry.getProvider(token), provider, "provider is set")
    //   })

    //   it("forceSetRoyaltiesType + clearRoyaltiesType", async () => {
    //     const token = accounts[4]

    //     //forceSetRoyaltiesType not from owner
    //     await expectThrow(
    //       royaltiesRegistry.forceSetRoyaltiesType(token, 1, { from: accounts[3] })
    //     );

    //     //can't set royalties type to 0
    //     await expectThrow(
    //       royaltiesRegistry.forceSetRoyaltiesType(token, 0)
    //     );

    //     //forceSetRoyaltiesType from 1 to 5 works
    //     for (let i = 1; i <= 6; i++) {
    //       await royaltiesRegistry.forceSetRoyaltiesType(token, i);
    //       assert.equal(await royaltiesRegistry.getRoyaltiesType(token), i, "forceSetRoyaltiesType " + i)
    //       assert.equal(await royaltiesRegistry.getProvider(token), ZERO_ADDRESS, "provider is not set")
    //     }

    //     //can't set royalties type to 7, max value is 6
    //     await expectThrow(
    //       royaltiesRegistry.forceSetRoyaltiesType(token, 7)
    //     );

    //     //only owner can clear royalties
    //     await expectThrow(
    //       royaltiesRegistry.clearRoyaltiesType(token, { from: accounts[3] })
    //     );

    //     //clearRoyaltiesType
    //     await royaltiesRegistry.clearRoyaltiesType(token);
    //     assert.equal(await royaltiesRegistry.getRoyaltiesType(token), 0, "clearRoyaltiesType ")
    //     assert.equal(await royaltiesRegistry.getProvider(token), ZERO_ADDRESS, "provider is not set")
    //   })

    // })

    // describe("upgrade checks", () => {

    //   it("check storage after upgrade", async () => {
    //     const token = (await TestERC721.deploy()).address;
    //     const token2 = (await TestERC721.deploy()).address;
    //     const token3 = (await TestERC721.deploy()).address;

    //     const tokenId3 = 11234;

    //     const royaltiesRegistryOld = await upgrades.deployProxy(RoyaltiesRegistryOld, [], { initializer: '__RoyaltiesRegistry_init' })

    //     //setRoyaltiesByTokenAndTokenId
    //     await royaltiesRegistryOld.setRoyaltiesByTokenAndTokenId(token, tokenId3, [[accounts[0], 1000]])

    //     //setRoyaltiesByToken
    //     await royaltiesRegistryOld.setRoyaltiesByToken(token2, [[accounts[1], 900]])

    //     //external provider
    //     const testRoyaltiesProvider = await TestRoyaltiesProvider.deploy();
    //     await testRoyaltiesProvider.initializeProvider(token3, defaultTokenId1, [[accounts[0], 800]]);
    //     await royaltiesRegistryOld.setProviderByToken(token3, testRoyaltiesProvider.address)

    //     const royaltiesFromToken = await royaltiesRegistryOld.getRoyalties.call(token2, tokenId3)
    //     const royaltiesFromProvider = await royaltiesRegistryOld.getRoyalties.call(token3, defaultTokenId1)

    //     royaltiesRegistry = await upgrades.upgradeProxy(royaltiesRegistryOld.address, RoyaltiesRegistry);

    //     assert.equal(await royaltiesRegistry.getRoyaltiesType(token2), 0, "")
    //     assert.equal(await royaltiesRegistry.getRoyaltiesType(token3), 0, "")

    //     assert.equal((await royaltiesRegistry.getRoyalties.call(token, tokenId3)).length, 0, "royaltiesFromTokenAndTokenId")

    //     assert.equal((await royaltiesRegistry.getRoyalties.call(token2, tokenId3))[0].accounts, royaltiesFromToken[0].accounts, "royaltiesFromToken")
    //     assert.equal((await royaltiesRegistry.getRoyalties.call(token2, tokenId3))[0].value, royaltiesFromToken[0].value, "royaltiesFromToken")

    //     assert.equal((await royaltiesRegistry.getRoyalties.call(token3, defaultTokenId1))[0].accounts, royaltiesFromProvider[0].accounts, "royaltiesFromProvider")
    //     assert.equal((await royaltiesRegistry.getRoyalties.call(token3, defaultTokenId1))[0].value, royaltiesFromProvider[0].value, "royaltiesFromProvider")

    //     await royaltiesRegistry.getRoyalties(token, tokenId3)
    //     await royaltiesRegistry.getRoyalties(token2, tokenId3)
    //     await royaltiesRegistry.getRoyalties(token3, tokenId3)

    //     assert.equal(await royaltiesRegistry.getRoyaltiesType(token2), 1, "royaltiesFromToken type 1")
    //     assert.equal(await royaltiesRegistry.getRoyaltiesType(token3), 4, "external provider type 4")

    //   })

  })

});
