/* eslint-disable */
const { BigNumber } = require('ethers');

const { Order, Asset, sign } = require("./order");
const { ETH, ERC20, ERC721, ERC1155, ORDER_DATA_V1, TO_MAKER, TO_TAKER, PROTOCOL, ROYALTY, ORIGIN, PAYOUT, enc, id } = require("./assets");
const chai = require("chai");
const { solidity } = require("ethereum-waffle");
chai.use(solidity);
const { expect } = chai;

const ZERO = "0x0000000000000000000000000000000000000000";
const {
  expectRevert,
  ether
} = require('@openzeppelin/test-helpers');
const { TOKEN_NAME, TOKEN_SYMBOL, BASE_URI, METADATA_JSON, getLastTokenID, verifyBalanceChange, encDataV1JS } = require('./include_in_tesfiles.js')

const hardhat = require('hardhat');
const { exit } = require('process');



describe('Exchange', async function () {

  let accounts0
  let accounts1
  let accounts2
  let accounts3
  let accounts4
  let accounts5
  let accounts6
  let accounts7
  let wallet0
  let wallet1
  let wallet2
  let protocol
  let community

  let testing;
  let transferProxy;
  let erc20TransferProxy;
  let transferManagerTest;
  let t1;
  let t2;
  let erc721V1;
  let ghostERC1155
  let erc721WithRoyalties;

  const data = '0x'
  const eth = "0x0000000000000000000000000000000000000000";


  let do_not_deploy = true
  let addOperator = false

  beforeEach(async function () {
    let accounts = await ethers.getSigners()
    accounts0 = accounts[0].address
    accounts1 = accounts[3].address
    accounts2 = accounts[4].address
    accounts3 = accounts[5].address
    accounts4 = accounts[6].address
    accounts5 = accounts[7].address
    accounts6 = accounts[8].address
    wallet0 = accounts[0]
    wallet1 = accounts[3]
    wallet2 = accounts[4]
    protocol = accounts[1].address;
    community = accounts[2].address;
    console.log("accounts0: ", accounts0)
    console.log("accounts1: ", accounts1)
    console.log("accounts2: ", accounts2)
    console.log("accounts3: ", accounts3)
    console.log("accounts4: ", accounts4)
    console.log("protocol: ", protocol)
    console.log("community: ", community)
    let TransferProxyTest = await ethers.getContractFactory("TransferProxy");
    let ERC20TransferProxyTest = await ethers.getContractFactory("ERC20TransferProxy");
    let ExchangeV2 = await ethers.getContractFactory("TestExchangeV2");
    let GhostMarketTransferManagerTest = await ethers.getContractFactory("GhostMarketTransferManagerTest");
    let TestERC20 = await ethers.getContractFactory("TestERC20");
    let TestERC721V1 = await ethers.getContractFactory("GhostMarketERC721");
    let GhostERC1155contract = await ethers.getContractFactory("GhostMarketERC1155");
    let ERC721WithRoyalties = await ethers.getContractFactory("ERC721WithRoyalties");
    let RoyaltiesRegistry = await ethers.getContractFactory("RoyaltiesRegistry")
    if (hre.network.name == 'testnet_nodeploy' && do_not_deploy) {
      console.log("using existing", hre.network.name, "contracts")
      transferProxy = await TransferProxyTest.attach("0x08a8c4804b4165E7DD52d909Eb14275CF3FB643C")
      erc20TransferProxy = await ERC20TransferProxyTest.attach("0xA280aAB41d2a9999B1190A0b4467043557f734c2")
      testing = await ExchangeV2.attach("0x51c66f7499a70a7875602fA0b01c2E80581C6CD0")
      transferManagerTest = await GhostMarketTransferManagerTest.attach("0x14a6A490094bA4f8B38b8A48E4111dBcE02DC3f9")
      t1 = await TestERC20.attach("0x3018D3652c3978e9b8cb98e083F7216b7911dcED")
      erc721V1 = await TestERC721V1.attach("0xE3830eCE5DBB8910794B3743710d87550b5c84Ca")
      ghostERC1155 = await GhostERC1155contract.attach("")
    } else {
      console.log("deploying contracts")
      addOperator = true

      transferProxy = await TransferProxyTest.deploy();
      await transferProxy.__TransferProxy_init();

      erc20TransferProxy = await ERC20TransferProxyTest.deploy();
      await erc20TransferProxy.__ERC20TransferProxy_init();

      royaltiesRegistryProxy = await RoyaltiesRegistry.deploy();
      await royaltiesRegistryProxy.__RoyaltiesRegistry_init();

      testing = await upgrades.deployProxy(ExchangeV2, [transferProxy.address, erc20TransferProxy.address, 300, protocol, royaltiesRegistryProxy.address], { initializer: "__ExchangeV2_init" });
      transferManagerTest = await GhostMarketTransferManagerTest.deploy();
      t1 = await TestERC20.deploy();
      t2 = await TestERC20.deploy();
      erc721V1 = await TestERC721V1.deploy();
      await erc721V1.initialize(TOKEN_NAME, TOKEN_SYMBOL, BASE_URI);

      ghostERC1155 = await GhostERC1155contract.deploy();
      await ghostERC1155.initialize(TOKEN_NAME, TOKEN_SYMBOL, BASE_URI);

      //fee receiver for ETH transfer is the protocol address
      await testing.setFeeReceiver(eth, protocol);
      //fee receiver for Token t1 transfer is the protocol address
      await testing.setFeeReceiver(t1.address, protocol);
      await transferProxy.addOperator(testing.address)
      await erc20TransferProxy.addOperator(testing.address)

      erc721WithRoyalties = await ERC721WithRoyalties.deploy('ERC721WithRoyalties', '2981');
      console.log(erc721WithRoyalties.address)
    }
    if (addOperator) {
      await transferProxy.addOperator(testing.address)
      await erc20TransferProxy.addOperator(testing.address)
    }


    console.log('deployed transferProxy: ', transferProxy.address);
    console.log('deployed erc20TransferProxy: ', erc20TransferProxy.address);
    console.log('deployed Exchange proxy contract: ', testing.address);
    console.log('deployed transferManagerTest: ', transferManagerTest.address);
    console.log('deployed t1: ', t1.address);
    console.log('deployed erc721V1: ', erc721V1.address);
    console.log('deployed ghostERC1155: ', ghostERC1155.address);
    console.log('deployed erc721WithRoyalties', erc721WithRoyalties.address)

  });

  it("cancel erc20 order", async () => {
    const { left, right } = await prepare2Orders()
    let testingAsSigner = await testing.connect(wallet2);

    const tx = testingAsSigner.cancel(left, { from: accounts2 })

    await expect(tx).to.be.revertedWith('not a maker');

    let testingAsSigner2 = await testing.connect(wallet1);
    await testingAsSigner2.cancel(left, { from: accounts1 })

    const tx2 = testing.matchOrders(left, await getSignature(left, accounts1), right, await getSignature(right, accounts2))
    await expect(tx2).to.be.revertedWith('revert');
  })

  it("order with salt 0 can't be canceled", async () => {
    const { left, right } = await prepare2Orders()
    left.salt = "0";

    let testingAsSigner = await testing.connect(wallet1);

    const tx = testingAsSigner.cancel(left, { from: accounts1 })

    await expect(tx).to.be.revertedWith("0 salt can't be used");

  })

  it("cancel erc1155 order", async () => {
    const { left, right } = await prepare_ERC_1155V1_Orders(5)
    let testingAsSigner = await testing.connect(wallet1);

    const tx = testingAsSigner.cancel(left, { from: accounts1 })

    await expect(tx).to.be.revertedWith('not a maker');

    let testingAsSigner2 = await testing.connect(wallet2);
    await testingAsSigner2.cancel(left, { from: accounts2 })

    const tx2 = testingAsSigner2.matchOrders(left, await getSignature(left, accounts1), right, await getSignature(right, accounts2), { from: accounts2, value: 300 })
    await expect(tx2).to.be.revertedWith('revert');

  })

  it("bulk cancel erc20 orders", async () => {
    //all orders are created with the same maker and taker account,
    //left (order) = account1 tries to bulk cancel his orders
    const orderArray = await prepareMultiple2Orders(3)

    let leftOrderArray = []
    orderArray.forEach((ordersLR) => {
      leftOrderArray.push(ordersLR[0])
    })
    let testingAsSigner2 = await testing.connect(wallet1);
    await testingAsSigner2.bulkCancelOrders(leftOrderArray, { from: accounts1 })
  })

  async function prepareMultiple2Orders(orderAmount) {
    const ordersArray = []
    let i = 0;
    while (i < orderAmount) {
      i++;
      const { left, right } = await prepare2Orders()
      let orderLeftRight = [left, right]
      ordersArray.push(orderLeftRight)
    }
    return ordersArray
  }


  async function prepare2Orders(t1Amount = 100, t2Amount = 200) {
    await t1.mint(accounts1, t1Amount);
    await t2.mint(accounts2, t2Amount);
    let t1AsSigner = await t1.connect(wallet1);
    let t2AsSigner = await t1.connect(wallet2);
    await t1AsSigner.approve(erc20TransferProxy.address, 10000000, { from: accounts1 });
    await t2AsSigner.approve(erc20TransferProxy.address, 10000000, { from: accounts2 });

    const left = Order(accounts1, Asset(ERC20, enc(t1.address), 100), ZERO, Asset(ERC20, enc(t2.address), 200), 1, 0, 0, "0xffffffff", "0x");
    const right = Order(accounts2, Asset(ERC20, enc(t2.address), 200), ZERO, Asset(ERC20, enc(t1.address), 100), 1, 0, 0, "0xffffffff", "0x");
    return { left, right }
  }

  async function getSignature(order, signer) {
    return sign(order, signer, testing.address);
  }

  it("eth orders work, rest is returned to taker (other side)", async () => {
    await t1.mint(accounts1, 100);
    let t1AsSigner = await t1.connect(wallet1);

    await t1AsSigner.approve(erc20TransferProxy.address, 10000000, { from: accounts1 });

    const left = Order(accounts2, Asset(ETH, "0x", 200), ZERO, Asset(ERC20, enc(t1.address), 100), 1, 0, 0, "0xffffffff", "0x");
    const right = Order(accounts1, Asset(ERC20, enc(t1.address), 100), ZERO, Asset(ETH, "0x", 200), 1, 0, 0, "0xffffffff", "0x");

    let signatureRight = await getSignature(right, accounts1);
    let signatureLeft = await getSignature(left, accounts2);

    let testingAsSigner = await testing.connect(wallet2);
    let result
    if (hre.network.name == 'testnet' || hre.network.name == 'testnet_nodeploy' || hre.network.name == 'hardhat' || hre.network.name == 'hardhat') {
      console.log("matchOrders on rinkeby")
      let account1T1BalanceBefore = (await t1.balanceOf(accounts1)).toString()
      let account2T1BalanceBefore = (await t1.balanceOf(accounts2)).toString()
      let tx = await testingAsSigner.matchOrders(left, "0x", right, signatureRight, { from: accounts2, value: 300 })
      console.log("tx: ", tx)

      let account1T1BalanceAfter = (await t1.balanceOf(accounts1)).toString()
      let account2T1BalanceAfter = (await t1.balanceOf(accounts2)).toString()

      console.log("account1T1BalanceBefore:", account1T1BalanceBefore)
      console.log("account2T1BalanceBefore:", account2T1BalanceBefore)
      console.log("account1T1BalanceAfter:", account1T1BalanceAfter)
      console.log("account2T1BalanceAfter:", account2T1BalanceAfter)


    } else {
      console.log("matchOrders on local")
      await verifyBalanceChange(accounts2, 206, async () =>
        verifyBalanceChange(accounts1, -200, async () =>
          verifyBalanceChange(protocol, -6, () =>
            testingAsSigner.matchOrders(left, "0x", right, signatureRight, { from: accounts2, value: 300, gasPrice: 0 })
          )
        )
      )
      console.log("accounts1 token balance: ", (await t1.balanceOf(accounts1)).toString())
      console.log("accounts2 token balance: ", (await t1.balanceOf(accounts2)).toString())

      expect((await t1.balanceOf(accounts1)).toString()).to.equal('0');
      expect((await t1.balanceOf(accounts2)).toString()).to.equal('100');
    }
  })

  // can be used with testnets
  it("From ETH(DataV1) to ERC721(RoyalytiV1, DataV1) Protocol, NO Origin fees, Royalties", async () => {
    await erc721V1.mintGhost(accounts1, [[accounts2, 300], [accounts3, 400]], "ext_uri", "", "");
    const erc721TokenId1 = await erc721V1.getLastTokenID()
    let erc721V1AsSigner = await erc721V1.connect(wallet1);


    if (hre.network.name == 'testnet' || hre.network.name == 'testnet_nodeploy' || hre.network.name == 'hardhat') {
      await erc721V1AsSigner.setApprovalForAll(transferProxy.address, true, { from: accounts1 })
      console.log('erc721V1 isApprovedForAll: ', await erc721V1.isApprovedForAll(accounts1, transferProxy.address));
    } else {
      const { events } = await (
        await erc721V1AsSigner.setApprovalForAll(transferProxy.address, true, { from: accounts1 })
      ).wait()
      //test token approval status
      const [eventObject] = events;
      expect(eventObject.event).eq('ApprovalForAll');
      expect(eventObject.args.owner).eq(accounts1);
      expect(eventObject.args.operator).eq(transferProxy.address);
      expect(eventObject.args.approved).eq(true);
    }

    let matchOrdersSigner = await testing.connect(wallet0);

    const left = Order(accounts0, Asset(ETH, "0x", 200), ZERO, Asset(ERC721, enc(erc721V1.address, erc721TokenId1), 1), 1, 0, 0, "0xffffffff", "0x");
    const right = Order(accounts1, Asset(ERC721, enc(erc721V1.address, erc721TokenId1), 1), ZERO, Asset(ETH, "0x", 200), 1, 0, 0, "0xffffffff", "0x");
    let signatureRight = await getSignature(right, accounts1);
    // console.log('left: ', left);
    // console.log('right: ', right);
    console.log("accounts2 royalty balance before: ", (await web3.eth.getBalance(accounts2)).toString())
    console.log("accounts3 royalty balance before: ", (await web3.eth.getBalance(accounts3)).toString())

    console.log("protocol balance before: ", (await web3.eth.getBalance(protocol)).toString())
    console.log("community balance before: ", (await web3.eth.getBalance(community)).toString())

    console.log("seller token balance: ", (await erc721V1.balanceOf(accounts1)).toString())
    console.log("buyer token balance: ", (await erc721V1.balanceOf(accounts0)).toString())

    if (hre.network.name == 'testnet' || hre.network.name == 'testnet_nodeploy' || hre.network.name == 'hardhat') {
      console.log('matchAndTransfer on', hre.network.name);
      let tx = await matchOrdersSigner.matchOrders(left, "0x", right, signatureRight, { from: accounts0, value: 300 })
      tx.wait()
      console.log("tx: ", tx)
    }
    else {
      await verifyBalanceChange(accounts0, 206, async () =>			//200+6buyerFee (72back)
        verifyBalanceChange(accounts1, -186, async () =>				//200 - (6+8royalties)
          verifyBalanceChange(accounts2, -6, async () =>
            verifyBalanceChange(accounts3, -8, async () =>
              verifyBalanceChange(protocol, -6, () =>
                matchOrdersSigner.matchOrders(left, "0x", right, signatureRight, { from: accounts0, value: 300, gasPrice: 0 })
              )
            )
          )
        )
      )

      expect((await erc721V1.balanceOf(accounts1)).toString()).to.equal('0');
      expect((await erc721V1.balanceOf(accounts0)).toString()).to.equal('1');
    }

    console.log("protocol balance after: ", (await web3.eth.getBalance(protocol)).toString())
    console.log("community balance after: ", (await web3.eth.getBalance(community)).toString())

    console.log("accounts2 royalty balance after: ", (await web3.eth.getBalance(accounts2)).toString())
    console.log("accounts3 royalty balance after: ", (await web3.eth.getBalance(accounts3)).toString())

    console.log("seller token balance: ", (await erc721V1.balanceOf(accounts1)).toString())
    console.log("buyer token balance: ", (await erc721V1.balanceOf(accounts0)).toString())

  })

  it("From ETH(DataV1) to erc721 2981 royalties stndard, NO Origin fees, Royalties", async () => {
    //await erc721WithRoyalties.mint(accounts1, [[accounts2, 300], [accounts3, 400]], "ext_uri", "", "");
    erc721V1 = erc721WithRoyalties
    await erc721V1.mint(
      accounts1,
      accounts2,
      300, // 2.50%
    );
    console.log("ownerOf 1 tokenid:", await erc721V1.ownerOf(1))

    const erc721TokenId1 = 1
    let erc721V1AsSigner = await erc721V1.connect(wallet1);


    if (hre.network.name == 'testnet' || hre.network.name == 'testnet_nodeploy' || hre.network.name == 'hardhat') {
      await erc721V1AsSigner.setApprovalForAll(transferProxy.address, true, { from: accounts1 })
      console.log('erc721V1 isApprovedForAll: ', await erc721V1.isApprovedForAll(accounts1, transferProxy.address));
    } else {
      const { events } = await (
        await erc721V1AsSigner.setApprovalForAll(transferProxy.address, true, { from: accounts1 })
      ).wait()
      //test token approval status
      const [eventObject] = events;
      expect(eventObject.event).eq('ApprovalForAll');
      expect(eventObject.args.owner).eq(accounts1);
      expect(eventObject.args.operator).eq(transferProxy.address);
      expect(eventObject.args.approved).eq(true);
    }

    let matchOrdersSigner = await testing.connect(wallet0);

    const left = Order(accounts0, Asset(ETH, "0x", 200), ZERO, Asset(ERC721, enc(erc721V1.address, erc721TokenId1), 1), 1, 0, 0, "0xffffffff", "0x");
    const right = Order(accounts1, Asset(ERC721, enc(erc721V1.address, erc721TokenId1), 1), ZERO, Asset(ETH, "0x", 200), 1, 0, 0, "0xffffffff", "0x");
    let signatureRight = await getSignature(right, accounts1);
    // console.log('left: ', left);
    // console.log('right: ', right);
    console.log("accounts2 royalty balance before: ", (await web3.eth.getBalance(accounts2)).toString())
    console.log("accounts3 royalty balance before: ", (await web3.eth.getBalance(accounts3)).toString())

    console.log("protocol balance before: ", (await web3.eth.getBalance(protocol)).toString())
    console.log("community balance before: ", (await web3.eth.getBalance(community)).toString())

    console.log("seller token balance: ", (await erc721V1.balanceOf(accounts1)).toString())
    console.log("buyer token balance: ", (await erc721V1.balanceOf(accounts0)).toString())

    if (hre.network.name == 'testnet' || hre.network.name == 'testnet_nodeploy' || hre.network.name == 'hardhat') {
      console.log('matchAndTransfer on', hre.network.name);
      let tx = await matchOrdersSigner.matchOrders(left, "0x", right, signatureRight, { from: accounts0, value: 300 })
      tx.wait()
      //console.log("tx: ", tx)
    }
    else {
      await verifyBalanceChange(accounts0, 206, async () =>			//200+6buyerFee (72back)
        verifyBalanceChange(accounts1, -194, async () =>				//200 - (6+8royalties)
          verifyBalanceChange(accounts2, -6, async () =>
            verifyBalanceChange(protocol, -6, () =>
              matchOrdersSigner.matchOrders(left, "0x", right, signatureRight, { from: accounts0, value: 300, gasPrice: 0 })
            )
          )
        )
      )

      expect((await erc721V1.balanceOf(accounts1)).toString()).to.equal('0');
      expect((await erc721V1.balanceOf(accounts0)).toString()).to.equal('1');
    }

    console.log("protocol balance after: ", (await web3.eth.getBalance(protocol)).toString())
    console.log("community balance after: ", (await web3.eth.getBalance(community)).toString())

    console.log("accounts2 royalty balance after: ", (await web3.eth.getBalance(accounts2)).toString())
    console.log("accounts3 royalty balance after: ", (await web3.eth.getBalance(accounts3)).toString())

    console.log("seller token balance: ", (await erc721V1.balanceOf(accounts1)).toString())
    console.log("buyer token balance: ", (await erc721V1.balanceOf(accounts0)).toString())

  })

  it("From ETH(DataV1) to ERC721(RoyalytiV1, DataV1) Protocol, Origin left and right fees, Royalties", async () => {
    await erc721V1.mintGhost(accounts1, [[accounts2, 300], [accounts3, 400]], "ext_uri", "", "");
    const erc721TokenId1 = await erc721V1.getLastTokenID()
    let erc721V1AsSigner = await erc721V1.connect(wallet1);


    if (hre.network.name == 'testnet' || hre.network.name == 'testnet_nodeploy' || hre.network.name == 'hardhat') {
      await erc721V1AsSigner.setApprovalForAll(transferProxy.address, true, { from: accounts1 })
      console.log('erc721V1 isApprovedForAll: ', await erc721V1.isApprovedForAll(accounts1, transferProxy.address));
    } else {
      const { events } = await (
        await erc721V1AsSigner.setApprovalForAll(transferProxy.address, true, { from: accounts1 })
      ).wait()
      //test token approval status
      const [eventObject] = events;
      expect(eventObject.event).eq('ApprovalForAll');
      expect(eventObject.args.owner).eq(accounts1);
      expect(eventObject.args.operator).eq(transferProxy.address);
      expect(eventObject.args.approved).eq(true);
    }


    let addrOriginLeft = [[accounts5, 500], [accounts6, 600]];
    let addrOriginRight = [[accounts1, 700]];

    //ERC721 token will be transfered to this account
    let encDataLeft = encDataV1JS([[[accounts0, 10000]], addrOriginLeft])
    let encDataRight = encDataV1JS([[[accounts1, 10000]], addrOriginRight])

    let matchOrdersSigner = await testing.connect(wallet0);

    //TODO fix "BigNumber.toString does not accept any parameters; base-10 is assumed"
    const left = Order(accounts0, Asset(ETH, "0x", 200), ZERO, Asset(ERC721, enc(erc721V1.address, erc721TokenId1), 1), 1, 0, 0, ORDER_DATA_V1, encDataLeft);
    const right = Order(accounts1, Asset(ERC721, enc(erc721V1.address, erc721TokenId1), 1), ZERO, Asset(ETH, "0x", 200), 1, 0, 0, ORDER_DATA_V1, encDataRight);

    let signatureRight = await getSignature(right, accounts1);
    // console.log('left: ', left);
    // console.log('right: ', right);

    console.log("accounts2 royalty balance before: ", (await web3.eth.getBalance(accounts2)).toString())
    console.log("accounts3 royalty balance before: ", (await web3.eth.getBalance(accounts3)).toString())

    console.log("protocol balance before: ", (await web3.eth.getBalance(protocol)).toString())
    console.log("community balance before: ", (await web3.eth.getBalance(community)).toString())

    console.log("seller token balance: ", (await erc721V1.balanceOf(accounts1)).toString())
    console.log("buyer token balance: ", (await erc721V1.balanceOf(accounts0)).toString())

    if (hre.network.name == 'testnet' || hre.network.name == 'testnet_nodeploy' || hre.network.name == 'hardhat') {
      console.log('matchAndTransfer on', hre.network.name);
      let tx = await matchOrdersSigner.matchOrders(left, "0x", right, signatureRight, { from: accounts0, value: 300 })
      tx.wait()
      console.log("tx: ", tx)
    }
    else {
      await verifyBalanceChange(accounts0, 228, async () =>			//200 + 6 buyerFee + 22 origin left  (72back)
        verifyBalanceChange(accounts1, -186, async () =>				//200 - (6+8royalties)
          verifyBalanceChange(accounts2, -6, async () =>
            verifyBalanceChange(accounts3, -8, async () =>
              verifyBalanceChange(accounts6, -12, () =>
                verifyBalanceChange(accounts5, -10, () =>
                  verifyBalanceChange(protocol, -6, () =>
                    matchOrdersSigner.matchOrders(left, "0x", right, signatureRight, { from: accounts0, value: 300, gasPrice: 0 })
                  )
                )
              )
            )
          )
        )
      )

      expect((await erc721V1.balanceOf(accounts1)).toString()).to.equal('0');
      expect((await erc721V1.balanceOf(accounts0)).toString()).to.equal('1');
    }

    console.log("protocol balance after: ", (await web3.eth.getBalance(protocol)).toString())
    console.log("community balance after: ", (await web3.eth.getBalance(community)).toString())

    console.log("accounts2 royalty balance after: ", (await web3.eth.getBalance(accounts2)).toString())
    console.log("accounts3 royalty balance after: ", (await web3.eth.getBalance(accounts3)).toString())

    console.log("seller token balance: ", (await erc721V1.balanceOf(accounts1)).toString())
    console.log("buyer token balance: ", (await erc721V1.balanceOf(accounts0)).toString())
    console.log("accounts2 token balance: ", (await erc721V1.balanceOf(accounts2)).toString())

  })

  async function prepare721sellingWithOptionalOriginRoyalties(encDataLeft, encDataRight, royalties = [], nftPrice = 200) {
    await erc721V1.mintGhost(accounts1, royalties, "ext_uri", "", "");
    const erc721TokenId1 = await erc721V1.getLastTokenID()
    let erc721V1AsSigner = await erc721V1.connect(wallet1);

    if (hre.network.name == 'testnet' || hre.network.name == 'testnet_nodeploy' || hre.network.name == 'hardhat') {
      await erc721V1AsSigner.setApprovalForAll(transferProxy.address, true, { from: accounts1 })
      console.log('erc721V1 isApprovedForAll: ', await erc721V1.isApprovedForAll(accounts1, transferProxy.address));
    } else {
      const { events } = await (
        await erc721V1AsSigner.setApprovalForAll(transferProxy.address, true, { from: accounts1 })
      ).wait()
      //test token approval status
      const [eventObject] = events;
      expect(eventObject.event).eq('ApprovalForAll');
      expect(eventObject.args.owner).eq(accounts1);
      expect(eventObject.args.operator).eq(transferProxy.address);
      expect(eventObject.args.approved).eq(true);
    }

    let matchOrdersSigner = await testing.connect(wallet2);

    //origin fee is only working if ORDER_DATA_V1 is passed; we cant pass here "0xffffffff" because the NFT is not locked in an acution contract
    const left = Order(accounts2, Asset(ETH, "0x", 200), ZERO, Asset(ERC721, enc(erc721V1.address, erc721TokenId1), 1), 1, 0, 0, ORDER_DATA_V1, encDataLeft);
    const right = Order(accounts1, Asset(ERC721, enc(erc721V1.address, erc721TokenId1), 1), ZERO, Asset(ETH, "0x", 200), 1, 0, 0, ORDER_DATA_V1, encDataRight);
    let signatureRight = await getSignature(right, accounts1);
    // console.log('left: ', left);
    // console.log('right: ', right);
    return { left, right, signatureRight, matchOrdersSigner }
  }

  async function testOriginRoyalties(addrOriginLeft, addrOriginRight, originDataLeft_buyer, originDataRight_seller) {
    let encDataLeft = await encDataV1JS([originDataLeft_buyer, addrOriginLeft]);
    let encDataRight = await encDataV1JS([originDataRight_seller, addrOriginRight]);

    let nftPrice = 200
    let royalities = []
    console.log("test2")
    const { left, right, signatureRight, matchOrdersSigner } = await prepare721sellingWithOptionalOriginRoyalties(encDataLeft, encDataRight, royalities, nftPrice)


    console.log("accounts2 royalty balance before: ", (await web3.eth.getBalance(accounts2)).toString())
    console.log("accounts3 royalty balance before: ", (await web3.eth.getBalance(accounts3)).toString())

    console.log("accounts5 origin; balance before: ", (await web3.eth.getBalance(accounts5)).toString())
    console.log("accounts6 origin; balance before: ", (await web3.eth.getBalance(accounts6)).toString())

    console.log("protocol balance before: ", (await web3.eth.getBalance(protocol)).toString())
    console.log("community balance before: ", (await web3.eth.getBalance(community)).toString())


    console.log("seller token balance: ", (await erc721V1.balanceOf(accounts1)).toString())
    console.log("buyer token balance: ", (await erc721V1.balanceOf(accounts0)).toString())

    if (hre.network.name == 'testnet' || hre.network.name == 'testnet_nodeploy' || hre.network.name == 'hardhat') {
      console.log('matchAndTransfer on', hre.network.name);
      let tx = await matchOrdersSigner.matchOrders(left, "0x", right, signatureRight, { from: accounts2, value: 300 })
      tx.wait()
      console.log("tx: ", tx)
    }
    else {
      //TODO calculate prices based on NFT price
      /*
      let protocolFee = nftPrice * 0.03
      console.log("protocolFee: ", protocolFee)

            let royalty1 = nftPrice * 0.1
          console.log("royalty1: ", royalty1)
          let royalty2 = nftPrice * 0.05
          console.log("royalty2: ", royalty2) */
      //let sellerGets = nftPrice - royalty1 - royalty2

      /* 		let sellerGets = nftPrice - origin1 - origin2
          console.log("sellerGets: ", sellerGets)
          let buyerGets = bidAmount1PlusRoyalties - (nftPrice + protocolFee)
          console.log("buyerGets: ", buyerGets)  */
      if (hre.network.name == 'testnet' || hre.network.name == 'testnet_nodeploy' || hre.network.name == 'hardhat' || hre.network.name == 'hardhat') {
        console.log('matchOrders for', hre.network.name);
        let tx = await matchOrdersSigner.matchOrders(left, "0x", right, signatureRight, { from: accounts2, value: 300 })
        tx.wait()
        console.log("tx: ", tx)
      }
      else {
        await verifyBalanceChange(accounts2, 228, async () =>			// 200 + 6 buyerFee + (10+12 origin left) - (72 back payment)
          verifyBalanceChange(accounts1, -200, async () =>				// 200
            verifyBalanceChange(protocol, -6, () =>								// protocol fee from buyer
              verifyBalanceChange(accounts6, -12, () =>						// origin fee paid by buyer 6%
                verifyBalanceChange(accounts5, -10, () => 				// origin fee paid by buyer 5%
                  matchOrdersSigner.matchOrders(left, "0x", right, signatureRight, { from: accounts2, value: 300, gasPrice: 0 })
                  //matchOrdersSigner.matchOrders(left, "0x", right, signatureRight, { from: accounts2, value: 300 })
                )
              )
            )
          )
        )
      }

      expect((await erc721V1.balanceOf(accounts1)).toString()).to.equal('0');
      expect((await erc721V1.balanceOf(accounts2)).toString()).to.equal('1');
    }

    console.log("protocol balance after: ", (await web3.eth.getBalance(protocol)).toString())
    console.log("community balance after: ", (await web3.eth.getBalance(community)).toString())

    console.log("accounts2 royalty balance after: ", (await web3.eth.getBalance(accounts2)).toString())
    console.log("accounts3 royalty balance after: ", (await web3.eth.getBalance(accounts3)).toString())

    console.log("accounts5 origin; balance after: ", (await web3.eth.getBalance(accounts5)).toString())
    console.log("accounts6 origin; balance after: ", (await web3.eth.getBalance(accounts6)).toString())

    console.log("seller token balance: ", (await erc721V1.balanceOf(accounts1)).toString())
    console.log("buyer token balance: ", (await erc721V1.balanceOf(accounts0)).toString())

  }

  it("From ETH(DataV1) to ERC721(RoyalytiV1, DataV1) Protocol, Origin left fees, no Royalties", async () => {
    let addrOriginLeft = [[accounts5, 500], [accounts6, 600]];
    let addrOriginRight = []
    let originDataLeft_buyer = [[accounts2, 10000]]
    let originDataRight_seller = [[accounts1, 10000]]
    await testOriginRoyalties(addrOriginLeft, addrOriginRight, originDataLeft_buyer, originDataRight_seller)
  })

  /*   it("From ETH(DataV1) to ERC721(RoyalytiV1, DataV1) Protocol, Origin left and right fees, no Royalties", async () => {
      let addrOriginLeft = [[accounts5, 500], [accounts6, 600]];
      let addrOriginRight = [[accounts2, 700]];

      let encDataLeft = await encDataV1JS([[[accounts2, 10000]], addrOriginLeft]);
      let encDataRight = await encDataV1JS([[[accounts1, 10000]], addrOriginRight]);

      await testOriginRoyalties(encDataLeft, encDataRight)

    }) */


  async function prepare_ERC_1155V1_Orders(erc1155amount = 10) {
    await ghostERC1155.mintGhost(accounts1, erc1155amount, data, [[accounts3, 1000], [accounts4, 500]], "ext_uri", "", "")
    const erc1155TokenId1 = (await getLastTokenID(ghostERC1155)).toString()
    console.log("erc1155TokenId1", erc1155TokenId1)

    let erc1155AsSigner = await ghostERC1155.connect(wallet1);

    await erc1155AsSigner.setApprovalForAll(transferProxy.address, true, { from: accounts1 });

    const left = Order(accounts2, Asset(ETH, "0x", 200), ZERO, Asset(ERC1155, enc(ghostERC1155.address, erc1155TokenId1), 4), 1, 0, 0, "0xffffffff", "0x");
    const right = Order(accounts1, Asset(ERC1155, enc(ghostERC1155.address, erc1155TokenId1), 4), ZERO, Asset(ETH, "0x", 200), 1, 0, 0, "0xffffffff", "0x");
    return { left, right, erc1155TokenId1 }
  }

  // can be used with testnets
  it("should buy ERC1155 with ETH; protocol fee and royalties", async () => {
    let matchSigner = await testing.connect(wallet2);

    const { left, right, erc1155TokenId1 } = await prepare_ERC_1155V1_Orders()
    let signatureRight = await getSignature(right, accounts1);

    console.log(accounts1, "accounts1 balance before: ", (await web3.eth.getBalance(accounts1)).toString())
    console.log(accounts2, "accounts2  balance before: ", (await web3.eth.getBalance(accounts2)).toString())
    console.log(accounts3, "accounts3  balance before: ", (await web3.eth.getBalance(accounts3)).toString())
    console.log(accounts4, "accounts4  balance before: ", (await web3.eth.getBalance(accounts4)).toString())
    console.log(protocol, "protocol balance before: ", (await web3.eth.getBalance(protocol)).toString())
    console.log(accounts1, "accounts1 erc1155 balance before: ", (await ghostERC1155.balanceOf(accounts1, erc1155TokenId1)).toString())
    console.log(accounts2, "accounts2 erc1155 balance before: ", (await ghostERC1155.balanceOf(accounts2, erc1155TokenId1)).toString())

    /* 		let protocolFee = nftPrice * 0.03
    console.log("protocolFee: ", protocolFee)
    let royalty1 = nftPrice * 0.1
    console.log("royalty1: ", royalty1)
    let royalty2 = nftPrice * 0.05
    console.log("royalty2: ", royalty2)
    let sellerGets = nftPrice - royalty1 - royalty2
    console.log("sellerGets: ", sellerGets)
    let buyerGets = bidAmount1PlusRoyalties - (nftPrice + protocolFee)
    console.log("buyerGets: ", buyerGets) */
    if (hre.network.name == 'testnet' || hre.network.name == 'testnet_nodeploy' || hre.network.name == 'hardhat') {
      let result = await matchSigner.matchOrders(left, "0x", right, signatureRight, { from: accounts2, value: 300 })
      console.log("matchOrders transaction", result)
    } else {
      await verifyBalanceChange(accounts2, 206, async () =>			//200 + 6 buyerFee (72back)
        verifyBalanceChange(accounts1, -170, async () =>				//200 seller - 14
          verifyBalanceChange(accounts3, -20, async () =>
            verifyBalanceChange(accounts4, -10, async () =>
              verifyBalanceChange(protocol, -6, () =>
                matchSigner.matchOrders(left, "0x", right, signatureRight, { from: accounts2, value: 300, gasPrice: 0 })
              )
            )
          )
        )
      )
      expectEqualStringValues(await ghostERC1155.balanceOf(accounts1, erc1155TokenId1), 6)
      expectEqualStringValues(await ghostERC1155.balanceOf(accounts2, erc1155TokenId1), 4)
    }
    console.log(accounts1, " accounts1  balance after: ", (await web3.eth.getBalance(accounts1)).toString())
    console.log(accounts2, " accounts2  balance after: ", (await web3.eth.getBalance(accounts2)).toString())
    console.log(accounts3, " accounts3  balance after: ", (await web3.eth.getBalance(accounts3)).toString())
    console.log(accounts4, " accounts4  balance after: ", (await web3.eth.getBalance(accounts4)).toString())
    console.log(protocol, " protocol balance after: ", (await web3.eth.getBalance(protocol)).toString())
    console.log(accounts1, " accounts1 erc1155 balance after: ", (await ghostERC1155.balanceOf(accounts1, erc1155TokenId1)).toString())
    console.log(accounts2, " accounts2 erc1155 balance after: ", (await ghostERC1155.balanceOf(accounts2, erc1155TokenId1)).toString())
  })

  it("should match And Transfer Orders Without Signature", async () => {
    let matchSigner = await testing.connect(wallet2);
    testing.setMatchTransferAdminAccount(accounts2);

    const { left, right, erc1155TokenId1 } = await prepare_ERC_1155V1_Orders()

    if (hre.network.name == 'testnet' || hre.network.name == 'testnet_nodeploy' || hre.network.name == 'hardhat') {
      let result = await matchSigner.matchAndTransferWithoutSignature(left, right, { from: accounts2, value: 300 })
      console.log("matchOrders transaction", result)
    } else {
      await verifyBalanceChange(accounts2, 206, async () =>			//200 + 6 buyerFee (72back)
        verifyBalanceChange(accounts1, -170, async () =>				//200 seller - 14
          verifyBalanceChange(accounts3, -20, async () =>
            verifyBalanceChange(accounts4, -10, async () =>
              verifyBalanceChange(protocol, -6, () =>
                matchSigner.matchOrders(left, right, { from: accounts2, value: 300, gasPrice: 0 })
              )
            )
          )
        )
      )
      expectEqualStringValues(await ghostERC1155.balanceOf(accounts1, erc1155TokenId1), 6)
      expectEqualStringValues(await ghostERC1155.balanceOf(accounts2, erc1155TokenId1), 4)
    }


  })

  it("throws: if matchAndTransferAdmin account is not set or does not match", async () => {
    let matchSigner = await testing.connect(wallet2);

    const { left, right, erc1155TokenId1 } = await prepare_ERC_1155V1_Orders()
    let accountNotSet = matchSigner.matchAndTransferWithoutSignature(left, right, { from: accounts2, value: 300 })

    testing.setMatchTransferAdminAccount(accounts1);
    let wrongAccount = matchSigner.matchAndTransferWithoutSignature(left, right, { from: accounts2, value: 300 })

    if (hre.network.name == 'testnet' || hre.network.name == 'testnet_nodeploy') {
      console.log("matchOrders transaction", result)
    } else {
      await expect(accountNotSet).to.be.revertedWith('not allowed to matchAndTransfer without a signature');
      await expect(wrongAccount).to.be.revertedWith('not allowed to matchAndTransfer without a signature');
    }
  })

  async function getSignature(order, signer) {
    return sign(order, signer, testing.address);
  }

  function expectEqualStringValues(value1, value2) {
    expect(value1.toString()).to.equal(value2.toString())
  }
});








