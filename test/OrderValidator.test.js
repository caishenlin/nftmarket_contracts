/* eslint-disable */
const order = require("./order");
const sign = order.sign;
const ZERO = "0x0000000000000000000000000000000000000000";

const {
	expectRevert, // Assertions for transactions that should fail
} = require('@openzeppelin/test-helpers');

describe('OrderValidator', async function () {
  let orderValidatorContract;

  let accounts0
  let accounts1
  let accounts2
  let wallet1
  let wallet1

  beforeEach(async function () {
    let accounts = await ethers.getSigners()
    accounts0 = accounts[0].address
    accounts1 = accounts[1].address
    accounts2 = accounts[2].address
    wallet1 = accounts[1]
    wallet2 = accounts[2]
    const orderValidatorTestFactory = await ethers.getContractFactory("OrderValidatorTest");
    orderValidatorContract = await orderValidatorTestFactory.deploy();
    await orderValidatorContract.__OrderValidatorTest_init();

    //orderValidatorTest = await ethers.getContract("OrderValidatorTest");
    console.log("testing address", await orderValidatorContract.address)
    /* 		await testing.__OrderValidatorTest_init(); */
  });

  it("should validate if signer is correct", async () => {
    const testOrder = order.Order(accounts0, order.Asset("0xffffffff", "0x", 100), ZERO, order.Asset("0xffffffff", "0x", 200), 1, 0, 0, "0xffffffff", "0x");
    const signature = await getSignature(testOrder, accounts0);
    await orderValidatorContract.validateOrderTest(testOrder, signature);
  });

  it("should fail validate if signer is incorrect", async () => {
    const testOrder = order.Order(accounts0, order.Asset("0xffffffff", "0x", 100), ZERO, order.Asset("0xffffffff", "0x", 200), 1, 0, 0, "0xffffffff", "0x");
    const signature = await getSignature(testOrder, accounts1);
    const wallet1Signer = await orderValidatorContract.connect(wallet1);

    await expectRevert(
      wallet1Signer.validateOrderTest(testOrder, signature),
      "User: signature verification error"
    )
  });

  it("should bypass signature if maker is msg.sender", async () => {
    const testOrder = order.Order(accounts2, order.Asset("0xffffffff", "0x", 100), ZERO, order.Asset("0xffffffff", "0x", 200), 1, 0, 0, "0xffffffff", "0x");
    const wallet2Signer = await orderValidatorContract.connect(wallet2);
    await wallet2Signer.validateOrderTest(testOrder, "0x", { from: accounts2 });
  });

  async function getSignature(order, signer) {
    return sign(order, signer, orderValidatorContract.address);
  }

});
