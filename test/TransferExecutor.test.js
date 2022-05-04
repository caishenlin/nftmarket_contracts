/* eslint-disable */
const order = require("./order")
const { chai, expect } = require('chai')
const ZERO = "0x0000000000000000000000000000000000000000"
const { TOKEN_NAME, TOKEN_SYMBOL, BASE_URI, METADATA_JSON, getLastTokenID, verifyBalanceChange, expectEqualStringValues } = require('./include_in_tesfiles.js')
const { ETH, ERC20, ERC721, ERC1155, enc } = require("./assets")
const {
	expectRevert,
	ether
} = require('@openzeppelin/test-helpers');

describe('TransferExecutor', async function () {
  let erc20Token
  let ghostMarketERC721Token
  let ghostERC1155Token
  let transferProxy
  let erc20TransferProxy

  let erc20TransferProxy
  let transferManagerTest
  const transferExecutorContract

  let accounts0
  let accounts1
  let accounts2
  let wallet1
  let wallet1
  const data = '0x'
  beforeEach(async () => {

    let accounts = await ethers.getSigners()
    accounts0 = accounts[0].address
    accounts1 = accounts[1].address
    accounts2 = accounts[2].address
    wallet1 = accounts[1]
    wallet2 = accounts[2]
    const TransferProxyTest = await ethers.getContractFactory("TransferProxy")
    const ERC20TransferProxyTest = await ethers.getContractFactory("ERC20TransferProxy")
    const TransferExecutorTest = await ethers.getContractFactory("TransferExecutorTest")
    const TestERC20 = await ethers.getContractFactory("TestERC20")
    const GhostMarketERC721 = await ethers.getContractFactory("GhostMarketERC721")
    const GhostERC1155contract = await ethers.getContractFactory("GhostMarketERC1155")

    erc20TransferProxy = await ERC20TransferProxyTest.deploy()
    await erc20TransferProxy.__ERC20TransferProxy_init()

    transferProxy = await TransferProxyTest.deploy()
    await transferProxy.__TransferProxy_init()

    transferExecutorContract = await TransferExecutorTest.deploy()

    await transferExecutorContract.__TransferExecutorTest_init(transferProxy.address, erc20TransferProxy.address)

    erc20Token = await TestERC20.deploy()
    ghostMarketERC721Token = await GhostMarketERC721.deploy()
    await ghostMarketERC721Token.initialize(TOKEN_NAME, TOKEN_SYMBOL, BASE_URI)

    ghostERC1155Token = await GhostERC1155contract.deploy()
    await ghostERC1155Token.initialize(TOKEN_NAME, TOKEN_SYMBOL, BASE_URI)

    await transferProxy.addOperator(transferExecutorContract.address)
    await erc20TransferProxy.addOperator(transferExecutorContract.address)
  })

  it("should support ETH transfers", async () => {
    await verifyBalanceChange(accounts0, 500, async () =>
      //verifyBalanceChange2(accounts1, -500, () =>
      await transferExecutorContract.transferTest(order.Asset(ETH, "0x", 500), ZERO, accounts1, { value: 500, gasPrice: 0 })
      //)
    )
  })

  it("should support ERC20 transfers", async () => {
    await erc20Token.mint(accounts1, 100)
    let t1AsSigner = await erc20Token.connect(wallet1);

    await t1AsSigner.approve(erc20TransferProxy.address, 100, { from: accounts1 })

    acc1AsSigner = transferExecutorContract.connect(wallet1);
    await acc1AsSigner.transferTest(order.Asset(ERC20, enc(erc20Token.address), 40), accounts1, accounts2)
    expectEqualStringValues(await erc20Token.balanceOf(accounts1), 60)
    expectEqualStringValues(await erc20Token.balanceOf(accounts2), 40)
  })

  it("should support ERC721 transfers", async () => {
    await ghostMarketERC721Token.mintGhost(accounts1, [], "ext_uri", "", "");
    const erc721TokenId1 = await ghostMarketERC721Token.getLastTokenID()

    let account1AsSigner = await ghostMarketERC721Token.connect(wallet1);
    await account1AsSigner.setApprovalForAll(transferProxy.address, true, { from: accounts1 })
    acc1AsSigner = transferExecutorContract.connect(wallet1);
    await expectRevert(
      acc1AsSigner.transferTest(order.Asset(ERC721, enc(ghostMarketERC721Token.address, 1), 2), accounts1, accounts2), "erc721 value error"
    )
    await acc1AsSigner.transferTest(order.Asset(ERC721, enc(ghostMarketERC721Token.address, 1), 1), accounts1, accounts2)

    expectEqualStringValues(await ghostMarketERC721Token.ownerOf(erc721TokenId1), accounts2)

  })

  it("should support ERC1155 transfers", async () => {
    let erc1155amount = 100
    await ghostERC1155Token.mintGhost(accounts1, erc1155amount, data, [], "ext_uri", "", "")
    const erc1155TokenId1 = (await getLastTokenID(ghostERC1155Token)).toString()
    console.log("erc1155TokenId1", erc1155TokenId1)
    let account1AsSigner = await ghostERC1155Token.connect(wallet1);

    await account1AsSigner.setApprovalForAll(transferProxy.address, true, { from: accounts1 })
    acc1AsSigner = transferExecutorContract.connect(wallet1);

    await acc1AsSigner.transferTest(order.Asset(ERC1155, enc(ghostERC1155Token.address, 1), 40), accounts1, accounts2)
    expectEqualStringValues(await ghostERC1155Token.balanceOf(accounts1, 1), 60)
    expectEqualStringValues(await ghostERC1155Token.balanceOf(accounts2, 1), 40)

  })

})
