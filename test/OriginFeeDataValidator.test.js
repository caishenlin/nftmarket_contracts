/* eslint-disable */
const { BigNumber } = require('ethers');

const { Order, Asset, sign } = require("./order");
const { ETH, ERC20, ERC721, ERC1155, ORDER_DATA_V1, TO_MAKER, TO_TAKER, PROTOCOL, ROYALTY, ORIGIN, PAYOUT, enc, id } = require("./assets");
const { chai, expect } = require('chai')
const ZERO = "0x0000000000000000000000000000000000000000";
const {
  expectRevert,
  ether
} = require('@openzeppelin/test-helpers');
const { TOKEN_NAME, TOKEN_SYMBOL, BASE_URI, METADATA_JSON, getLastTokenID, verifyBalanceChange, encDataV1JS } = require('./include_in_tesfiles.js')

const hardhat = require('hardhat')



describe('OriginFeeDataValidator', async function () {

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
  let erc721V1;
  let ghostERC1155

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
    console.log("accounts5: ", accounts4)
    console.log("accounts6: ", accounts4)
    console.log("accounts7: ", accounts4)
    console.log("protocol: ", protocol)
    console.log("community: ", community)
    let TransferProxyTest = await ethers.getContractFactory("TransferProxy");
    let ERC20TransferProxyTest = await ethers.getContractFactory("ERC20TransferProxy");

    let ExchangeV2 = await ethers.getContractFactory("TestExchangeV2")
    let GhostMarketTransferManagerTest = await ethers.getContractFactory("GhostMarketTransferManagerTest");
    let TestERC20 = await ethers.getContractFactory("TestERC20");
    let TestERC721V1 = await ethers.getContractFactory("GhostMarketERC721");
    let GhostERC1155contract = await ethers.getContractFactory("GhostMarketERC1155");
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
    } else if (hre.network.name == 'testnet_nodeploy' && do_not_deploy) {
      console.log("using existing", hre.network.name, "contracts")
      transferProxy = await TransferProxyTest.attach("0xc8a0b15AEcDFF7bc04D757ebE4d920E96C1E6DF6")
      erc20TransferProxy = await ERC20TransferProxyTest.attach("0x8f93a447BEaD86260A5D179cFC92c9655e2366F6")
      testing = await ExchangeV2.attach("0x2F7a0C955837D79E967693894DC2c6d06CCF6f86")
      transferManagerTest = await GhostMarketTransferManagerTest.attach("0xE1E656b7Ae62be77C457e429993f0caC126125Ee")
      t1 = await TestERC20.attach("0x71377d8Fc14240D17598c327507017e7dA6Af5B7")
      erc721V1 = await TestERC721V1.attach("0x08AD47305159d1b34323468e55892d58846b388E")
      ghostERC1155 = await GhostERC1155contract.attach("0x388f3bA3b5C55E7B2Df5868a255d050A54Eed6ea")
    } else {
      console.log("deploying contracts")
      addOperator = true

      transferProxy = await TransferProxyTest.deploy();
      await transferProxy.__TransferProxy_init();

      erc20TransferProxy = await ERC20TransferProxyTest.deploy();
      await erc20TransferProxy.__ERC20TransferProxy_init();

      royaltiesRegistryProxy = await RoyaltiesRegistry.deploy();
      await royaltiesRegistryProxy.__RoyaltiesRegistry_init();

      testing = await upgrades.deployProxy(ExchangeV2, [transferProxy.address, erc20TransferProxy.address, 300, protocol, royaltiesRegistryProxy.address], {
        initializer: "__ExchangeV2_init",
        unsafeAllowLinkedLibraries: true
      });
      transferManagerTest = await GhostMarketTransferManagerTest.deploy();
      t1 = await TestERC20.deploy();
      erc721V1 = await TestERC721V1.deploy();
      await erc721V1.initialize(TOKEN_NAME, TOKEN_SYMBOL, BASE_URI);

      ghostERC1155 = await GhostERC1155contract.deploy();
      await ghostERC1155.initialize(TOKEN_NAME, TOKEN_SYMBOL, BASE_URI);

      //fee receiver for ETH transfer is the protocol address
      await testing.setDefaultFeeReceiver(protocol);
      //fee receiver for Token t1 transfer is the protocol address
      //await testing.setFeeReceiver(t1.address, protocol);
      await transferProxy.addOperator(testing.address)
      await erc20TransferProxy.addOperator(testing.address)
    }
    if (addOperator) {
      await transferProxy.addOperator(testing.address)
      await erc20TransferProxy.addOperator(testing.address)
    }
  });

  it("From ETH(DataV1) to ERC721(RoyalytiV1, DataV1) Protocol, Origin fees only left, no Royalties", async () => {
    await erc721V1.mintGhost(accounts1, [], "ext_uri", "", "");
    const erc721TokenId1 = await erc721V1.getLastTokenID()
    let erc721V1AsSigner = await erc721V1.connect(wallet1);


    if (hre.network.name == 'testnet_nodeploy' || hre.network.name == 'testnet_nodeploy' || hre.network.name == 'hardhat') {
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
    let addrOriginRight = [[accounts1, 700]]; // same as addrOriginRight = [] because accounts1 is seller and buyer

    let encDataLeft = encDataV1JS([[[accounts0, 10000]], addrOriginLeft])
    let encDataRight = encDataV1JS([[[accounts1, 10000]], addrOriginRight])

    let matchOrdersSigner = await testing.connect(wallet0);

    //origin fee is only working if ORDER_DATA_V1 is passed
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

    if (hre.network.name == 'testnet_nodeploy' || hre.network.name == 'testnet_nodeploy' || hre.network.name == 'hardhat' || hre.network.name == 'hardhat') {
      console.log('matchAndTransfer on', hre.network.name);
      let tx = await matchOrdersSigner.matchOrders(left, "0x", right, signatureRight, { from: accounts0, value: 300 })
      tx.wait()
      console.log("tx: ", tx)
    }
    else {
      await verifyBalanceChange(accounts0, 228, async () =>			//200 + 6 buyerFee + (10+12 origin left) - (72 back payment)
        verifyBalanceChange(accounts1, -200, async () =>				//200 (-14 +14 origin fee from right => origin fee acount = seller/minter account )
          verifyBalanceChange(protocol, -6, () =>
            verifyBalanceChange(accounts6, -12, () =>
              verifyBalanceChange(accounts5, -10, () =>
                matchOrdersSigner.matchOrders(left, "0x", right, signatureRight, { from: accounts0, value: 300, gasPrice: 0 })
                //matchOrdersSigner.matchOrders(left, "0x", right, signatureRight, { from: accounts0, value: 300 })
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

  it("From ETH(DataV1) to ERC721(RoyalytiV1, DataV1) Protocol, Origin fees from left and right, no Royalties,", async () => {
    await erc721V1.mintGhost(accounts1, [], "ext_uri", "", "");
    const erc721TokenId1 = await erc721V1.getLastTokenID()
    let erc721V1AsSigner = await erc721V1.connect(wallet1);


    if (hre.network.name == 'testnet_nodeploy' || hre.network.name == 'testnet_nodeploy' || hre.network.name == 'hardhat') {
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
    let addrOriginRight = [[accounts2, 700]];

    let encDataLeft = encDataV1JS([[[accounts0, 10000]], addrOriginLeft])
    let encDataRight = encDataV1JS([[[accounts1, 10000]], addrOriginRight])

    let matchOrdersSigner = await testing.connect(wallet0);

    //origin fee is only working if ORDER_DATA_V1 is passed
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

    if (hre.network.name == 'testnet_nodeploy' || hre.network.name == 'testnet_nodeploy' || hre.network.name == 'hardhat' || hre.network.name == 'hardhat') {
      console.log('matchAndTransfer on', hre.network.name);
      let tx = await matchOrdersSigner.matchOrders(left, "0x", right, signatureRight, { from: accounts0, value: 300 })
      tx.wait()
      console.log("tx: ", tx)
    }
    else {
      await verifyBalanceChange(accounts0, 228, async () =>			//200 + 6 buyerFee + (10+12 origin left) - (72 back payment)
        verifyBalanceChange(accounts1, -186, async () =>				//200 (- 14 origin fee right)
          verifyBalanceChange(protocol, -6, () =>
            verifyBalanceChange(accounts6, -12, () =>
              verifyBalanceChange(accounts5, -10, () =>
                verifyBalanceChange(accounts2, -14, () =>
                  matchOrdersSigner.matchOrders(left, "0x", right, signatureRight, { from: accounts0, value: 300, gasPrice: 0 })
                  //matchOrdersSigner.matchOrders(left, "0x", right, signatureRight, { from: accounts0, value: 300 })
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

  })

  it("From ETH(DataV1) to ERC721(RoyalytiV1, DataV1) Protocol, Origin fees, with Royalties,", async () => {
    await erc721V1.mintGhost(accounts1, [[accounts2, 300], [accounts3, 400]], "ext_uri", "", "");
    const erc721TokenId1 = await erc721V1.getLastTokenID()
    let erc721V1AsSigner = await erc721V1.connect(wallet1);

    if (hre.network.name == 'testnet_nodeploy' || hre.network.name == 'testnet_nodeploy' || hre.network.name == 'hardhat') {
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
    let addrOriginRight = [];

    let encDataLeft = encDataV1JS([[[accounts0, 10000]], addrOriginLeft])
    let encDataRight = encDataV1JS([[[accounts1, 10000]], addrOriginRight])

    let matchOrdersSigner = await testing.connect(wallet0);

    //origin fee is only working if ORDER_DATA_V1 is passed
    const left = Order(accounts0, Asset(ETH, "0x", 200), ZERO, Asset(ERC721, enc(erc721V1.address, erc721TokenId1), 1), 1, 0, 0, ORDER_DATA_V1, encDataLeft);
    const right = Order(accounts1, Asset(ERC721, enc(erc721V1.address, erc721TokenId1), 1), ZERO, Asset(ETH, "0x", 200), 1, 0, 0, ORDER_DATA_V1, encDataRight);
    let signatureRight = await getSignature(right, accounts1);

    console.log("accounts2 royalty balance before: ", (await web3.eth.getBalance(accounts2)).toString())
    console.log("accounts3 royalty balance before: ", (await web3.eth.getBalance(accounts3)).toString())

    console.log("protocol balance before: ", (await web3.eth.getBalance(protocol)).toString())
    console.log("community balance before: ", (await web3.eth.getBalance(community)).toString())

    console.log("seller token balance: ", (await erc721V1.balanceOf(accounts1)).toString())
    console.log("buyer token balance: ", (await erc721V1.balanceOf(accounts0)).toString())

    if (hre.network.name == 'testnet_nodeploy' || hre.network.name == 'testnet_nodeploy' || hre.network.name == 'hardhat' || hre.network.name == 'hardhat') {
      console.log('matchAndTransfer on', hre.network.name);
      let tx = await matchOrdersSigner.matchOrders(left, "0x", right, signatureRight, { from: accounts0, value: 300 })
      tx.wait()
      console.log("tx: ", tx)
    }
    else {
      await verifyBalanceChange(accounts0, 228, async () =>			//200 + 6 buyerFee + (10+12 origin left) - (72 back payment)
        verifyBalanceChange(accounts1, -186, async () =>				//200 - (10+12 royalties
          verifyBalanceChange(protocol, -6, () =>
            verifyBalanceChange(accounts6, -12, () =>
              verifyBalanceChange(accounts5, -10, () =>
                verifyBalanceChange(accounts2, -6, () =>
                  verifyBalanceChange(accounts3, -8, () =>
                    matchOrdersSigner.matchOrders(left, "0x", right, signatureRight, { from: accounts0, value: 300, gasPrice: 0 })
                    //matchOrdersSigner.matchOrders(left, "0x", right, signatureRight, { from: accounts0, value: 300 })
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

  })

  it("From ETH(DataV1) to ERC721(RoyalytiV1, DataV1) Protocol fee, 1 Origin fee address, 1 Royalties address", async () => {
    //set protocol fee to 2%
    testing.setProtocolFee(200)

    await erc721V1.mintGhost(accounts1, [[accounts6, 1000]], "ext_uri", "", "");
    const erc721TokenId1 = await erc721V1.getLastTokenID()
    let erc721V1AsSigner = await erc721V1.connect(wallet1);


    if (hre.network.name == 'testnet_nodeploy' || hre.network.name == 'testnet_nodeploy' || hre.network.name == 'hardhat') {
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
    let addrOriginLeft = [[accounts5, 300]];
    let addrOriginRight = [];

    let encDataLeft = encDataV1JS([[[accounts0, 10000]], addrOriginLeft])
    let encDataRight = encDataV1JS([[], addrOriginRight])

    let matchOrdersSigner = await testing.connect(wallet0);

    //origin fee is only working if ORDER_DATA_V1 is passed
    const left = Order(accounts0, Asset(ETH, "0x", 100), ZERO, Asset(ERC721, enc(erc721V1.address, erc721TokenId1), 1), 1, 0, 0, ORDER_DATA_V1, encDataLeft);
    const right = Order(accounts1, Asset(ERC721, enc(erc721V1.address, erc721TokenId1), 1), ZERO, Asset(ETH, "0x", 100), 1, 0, 0, ORDER_DATA_V1, encDataRight);
    let signatureRight = await getSignature(right, accounts1);

    console.log("accounts2 royalty balance before: ", (await web3.eth.getBalance(accounts2)).toString())
    console.log("accounts3 royalty balance before: ", (await web3.eth.getBalance(accounts3)).toString())

    console.log("protocol balance before: ", (await web3.eth.getBalance(protocol)).toString())
    console.log("community balance before: ", (await web3.eth.getBalance(community)).toString())

    console.log("seller token balance: ", (await erc721V1.balanceOf(accounts1)).toString())
    console.log("buyer token balance: ", (await erc721V1.balanceOf(accounts0)).toString())

    if (hre.network.name == 'testnet_nodeploy' || hre.network.name == 'testnet_nodeploy' || hre.network.name == 'hardhat' || hre.network.name == 'hardhat') {
      console.log('matchAndTransfer on', hre.network.name);
      let tx = await matchOrdersSigner.matchOrders(left, "0x", right, signatureRight, { from: accounts0, value: 300 })
      tx.wait()
      console.log("tx: ", tx)
    }
    else {
      await verifyBalanceChange(accounts0, 105, async () =>			// 100 + (2 protocol fee) + (3 origin fee)
        verifyBalanceChange(accounts1, -90, async () =>				// 100 - (10 royalties)
          verifyBalanceChange(protocol, -2, () =>
            verifyBalanceChange(accounts6, -10, () =>
              verifyBalanceChange(accounts5, -3, () =>
                matchOrdersSigner.matchOrders(left, "0x", right, signatureRight, { from: accounts0, value: 105, gasPrice: 0 })
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

  function encDataV1(tuple) {
    return transferManagerTest.encode(tuple);
  }

  async function getSignature(order, signer) {
    return sign(order, signer, testing.address);
  }
})
