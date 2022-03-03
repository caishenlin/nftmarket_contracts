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
const { exit } = require('process');

let cancelAbi = require("./cancelAbi.json")
let matchOrdersAbi = require("./matchOrdersAbi.json")

const web3Abi = require('web3-eth-abi');
const sigUtil = require('eth-sig-util');

const { Order, Asset, sign } = require("./order");
const { ETH, ERC20, ERC721, ERC1155, enc, id } = require("./assets");
const { getSystemErrorMap } = require('util');

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
  let t1;
  let t2;
  let erc721V1;
  let ghostERC1155
  let erc721WithRoyalties;
  let owner

  const data = '0x'
  const eth = "0x0000000000000000000000000000000000000000";


  let do_not_deploy = true
  let addOperator = false

  //hardhat account #3 (test accounts1)
  let publicKey = "0x90F79bf6EB2c4f870365E785982E1f101E93b906"
  let privateKey = "0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6";

  const domainType = [{
    name: "name",
    type: "string"
  },
  {
    name: "version",
    type: "string"
  },
  {
    name: "chainId",
    type: "uint256"
  },
  {
    name: "verifyingContract",
    type: "address"
  }
  ];

  const metaTransactionType = [{
    name: "nonce",
    type: "uint256"
  },
  {
    name: "from",
    type: "address"
  },
  {
    name: "functionSignature",
    type: "bytes"
  }
  ];


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
    wallet3 = accounts[5]

    // TODO how to use a generic private key without the predifned one?
    // const walletTest = new ethers.Wallet(privateKey).connect(wallet0.provider);
    // publicKey = walletTest.address


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
    let ExchangeMetaV2 = await ethers.getContractFactory("ExchangeMetaV2");
    let TestERC20 = await ethers.getContractFactory("TestERC20");
    let TestERC721V1 = await ethers.getContractFactory("GhostMarketERC721");
    let GhostERC1155contract = await ethers.getContractFactory("GhostMarketERC1155");
    let ERC721WithRoyalties = await ethers.getContractFactory("ERC721WithRoyalties");
    if (hre.network.name == 'testnet_nodeploy' && do_not_deploy) {
      console.log("using existing", hre.network.name, "contracts")
      transferProxy = await TransferProxyTest.attach("0x08a8c4804b4165E7DD52d909Eb14275CF3FB643C")
      erc20TransferProxy = await ERC20TransferProxyTest.attach("0xA280aAB41d2a9999B1190A0b4467043557f734c2")
      testing = await ExchangeV2.attach("0x51c66f7499a70a7875602fA0b01c2E80581C6CD0")
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

      testing = await upgrades.deployProxy(ExchangeMetaV2, [transferProxy.address, erc20TransferProxy.address, 300, protocol], { initializer: "__ExchangeV2_init" });
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
    }
    if (addOperator) {
      await transferProxy.addOperator(testing.address)
      await erc20TransferProxy.addOperator(testing.address)
    }

    console.log("chain id:", hre.network.config.chainId)
    domainData = {
      name: "GhostExchangeV2",
      version: "1",
      verifyingContract: testing.address,
      chainId: hre.network.config.chainId
    };

    owner = accounts2
    console.log("owner address:", owner)



    console.log('deployed transferProxy: ', transferProxy.address);
    console.log('deployed erc20TransferProxy: ', erc20TransferProxy.address);
    console.log('deployed Exchange proxy contract: ', testing.address);
    console.log('deployed t1: ', t1.address);
    console.log('deployed t2: ', t2.address);
    console.log('deployed erc721V1: ', erc721V1.address);
    console.log('deployed ghostERC1155: ', ghostERC1155.address);
    console.log('deployed erc721WithRoyalties', erc721WithRoyalties.address)

  });

  const getSignatureDataForMetaTransaction = async (nonce, abi, params, value = 0) => {
    const functionSignature = web3Abi.encodeFunctionCall(
      abi,
      params
    );

    let message = {};
    message.nonce = parseInt(nonce);
    message.from = publicKey;
    message.functionSignature = functionSignature;
    message.value = value // maybe not needed, added for matchOrders error
    //console.log("signature message:", message)
    const dataToSign = {
      types: {
        EIP712Domain: domainType,
        MetaTransaction: metaTransactionType
      },
      domain: domainData,
      primaryType: "MetaTransaction",
      message: message
    };
    const signature = sigUtil.signTypedData_v4(new Buffer.from(privateKey.substring(2, 66), 'hex'), {
      data: dataToSign
    });
    console.log("sigUtil.recoverTypedSignature_v4 matches publicKey:", sigUtil.recoverTypedSignature_v4({ sig: signature, data: dataToSign }).toString()); //for test only
    let r = signature.slice(0, 66);
    let s = "0x".concat(signature.slice(66, 130));
    let v = "0x".concat(signature.slice(130, 132));
    v = web3.utils.hexToNumber(v);
    if (![27, 28].includes(v)) v += 27;

    return { r, s, v, functionSignature };
  }

  async function getSignature(order, signer) {
    return sign(order, signer, testing.address);
  }

  async function mintERC20Token() {
    await t1.mint(owner, 100);
    let t1AsSigner = await t1.connect(wallet2);
    await t1AsSigner.approve(erc20TransferProxy.address, 10000000, { from: owner });
    let left = Order(publicKey, Asset(ERC20, enc(t1.address), 100), ZERO, Asset(ERC20, enc(t2.address), 200), 1, 0, 0, "0xffffffff", "0x");
    let right = Order(owner, Asset(ERC20, enc(t1.address), 100), ZERO, Asset(ERC20, enc(t2.address), 200), 1, 0, 0, "0xffffffff", "0x");
    return { left, right }
  }

  it("Should be able to send transaction successfully to cancel order, and check Event, that emit from method, execute as MetaTx", async () => {
    const { left, right } = await mintERC20Token()

    console.log("publicKey", publicKey)
    let nonce = await testing.getNonce(publicKey);

    let {
      r,
      s,
      v,
      functionSignature
    } = await getSignatureDataForMetaTransaction(nonce, cancelAbi, [left]);

    let ownerAsSigner = await testing.connect(wallet3);

    const { events } = await (
      await ownerAsSigner.executeMetaTransaction(publicKey, functionSignature, r, s, v, { from: accounts3 })
    ).wait()
    //test token approval status
    const [eventObject] = events;
    expect(eventObject.event).eq('Cancel');
    //check order maker address == _msgSender()
    expect(eventObject.args.maker).eq(publicKey);

    var newNonce = await testing.getNonce(publicKey);
    expect(newNonce.toNumber()).eq(nonce.toNumber() + 1, "Nonce not incremented");
  });

  //not functional at the moment with error message: 176e6f7420656e6f756768204261736543757272656e6379000000000000000000 = not enough BaseCurrency
  it.only("Should be able to send transaction successfully to matchOrders, execute as MetaTx", async () => {

    await t1.mint(owner, 100);
    let t1AsSigner = await t1.connect(wallet2);

    await t1AsSigner.approve(erc20TransferProxy.address, 10000000, { from: owner });

    const left = Order(publicKey, Asset(ETH, "0x", 200), ZERO, Asset(ERC20, enc(t1.address), 100), 1, 0, 0, "0xffffffff", "0x");
    const right = Order(owner, Asset(ERC20, enc(t1.address), 100), ZERO, Asset(ETH, "0x", 200), 1, 0, 0, "0xffffffff", "0x");

    let signatureRight = await getSignature(right, owner);

/*     ownerAsSigner = await testing.connect(wallet1)
    await verifyBalanceChange(owner, 206, async () =>
      verifyBalanceChange(publicKey, -200, async () =>
        verifyBalanceChange(protocol, -6, () =>
        ownerAsSigner.matchOrders(left, "0x", right, signatureRight, { from: publicKey, value: 300 })
        )
      )
    )
    console.log("publicKey token balance: ", (await t1.balanceOf(publicKey)).toString())
    console.log("owner token balance: ", (await t1.balanceOf(owner)).toString())
    exit(1) */

    let nonce = await testing.getNonce(publicKey);

    let {
      r,
      s,
      v,
      functionSignature
    } = await getSignatureDataForMetaTransaction(nonce, matchOrdersAbi, [left, "0x", right, signatureRight], 300);
    //} = await getSignatureDataForMetaTransaction(nonce, cancelAbi, [left]);

    let ownerAsSigner = await testing.connect(wallet3);


    await ownerAsSigner.executeMetaTransaction(publicKey, functionSignature, r, s, v, { from: accounts3, value: 300 })


    var newNonce = await testing.getNonce(publicKey);
    expect(newNonce.toNumber()).eq(nonce.toNumber() + 1, "Nonce not incremented");


  });

})
