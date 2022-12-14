const ethUtil = require('ethereumjs-util');

function id(str) {
	const hex = `0x${ethUtil.keccak256(str).toString("hex").substring(0, 8)}`
	// console.log("id: "+ str + ": ",hex)
	return hex;

}

function enc(token, tokenId) {
	if (tokenId) {
		return web3.eth.abi.encodeParameters(["address", "uint256"], [token, tokenId]);
	} else {
		return web3.eth.abi.encodeParameter("address", token);
	}
}

//asset types that can be transfered
const ETH = id("ETH");
const ERC20 = id("ERC20");
const ERC721 = id("ERC721");
const ERC1155 = id("ERC1155");
/**
 * see contracts/LibOrderData.sol
 * Order data can be set either empty = 0xffffffff
 * or ORDER_DATA_V1
 * if its set to ORDER_DATA_V1
 * it can handle payouts and origin fees
 * see also contracts/LibOrderDataV1.sol
 */
const ORDER_DATA_V1 = id("V1");
const ORDER_DATA_V2 = id("V2");

//for transferDirection and transferType see contracts/SimpleTransferManager.sol
// used as a variable for emitting event, transferDirection
const TO_MAKER = id("TO_MAKER");
// used as varibale for emitting event, transferDirection
const TO_TAKER = id("TO_TAKER");
// used as varibale for emitting event, transferType
const PROTOCOL = id("PROTOCOL");
// used as varibale for emitting event, transferType
const ROYALTY = id("ROYALTY");
// used as varibale for emitting event, transferType
const ORIGIN = id("ORIGIN");
// used as varibale for emitting event, transferType
const PAYOUT = id("PAYOUT");

const COLLECTION = id("COLLECTION");
const CRYPTO_PUNKS = id("CRYPTO_PUNKS");



module.exports = { id, ETH, ERC20, ERC721, ERC1155, ORDER_DATA_V1, ORDER_DATA_V2, TO_MAKER, TO_TAKER, PROTOCOL, ROYALTY, ORIGIN, PAYOUT, COLLECTION, CRYPTO_PUNKS, enc }
