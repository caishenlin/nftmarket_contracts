# GhostMarket Exchange smart contracts

## Deployed Contracts:

#### ERC20TransferProxy

#### TransferProxy

#### RoyaltiesRegistry

#### ExchangeV2

#### ProxyAdmin

#### TransparentUpgradeableProxy

## Architecture

Smart contracts are built using openzeppelin's upgradeable smart contracts library.

Tests are provided in the test folder.

Functionality is divided into parts (each responsible for the part of algorithm).

GhostMarket Exchange is a smart contract decentralized exchange.

### Compiling contracts
```
hardhat compile
```
### Deploying

Using hardhat-deploy plugin to deploy proxy contracts

Contracts can be deployed with the following commands

#### locally

```
hardhat deploy

```

#### to network
```
hardhat --network <network_name> deploy
```

deploy individually to testnet:

```
hardhat --network testnet deploy
```

For local deployment ganache-cli can be optionally used with the keys from:

```
.secrets.json
```
or

hardhat default keys; like this:

```
yarn ganache-cli --chainId 1   --gasPrice 2000 --account="0x40c97c291f591bbf9e9555d2407aeafbabac30741a95a875c1370dab3eb5e0dd, 100000000000000000000" \
--account="0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d, 100000000000000000000" \
--account="0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a, 100000000000000000000" \
--account="0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6, 100000000000000000000" \
--account="0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a, 100000000000000000000" \
--account="0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba, 100000000000000000000" \
--account="0x92db14e403b83dfe3df233f83dfa3a0d7096f21ca9b0d6d6b8d88b2b4ec1564e, 100000000000000000000" \
--account="0x4bbbf85ce3377467afe5d46f804f221813b2bb87f24d81f60f1fcdbf7cbf4356, 100000000000000000000" \
--account="0xdbda1821b80551c9d65939329250298aa3472ba22feea921c0cf5d620ea67b97, 100000000000000000000"
```

### Troubleshooting deploy errors

if contracts can not be deployed because of errors, try to remove the cache && artifacts && .openzeppelin && deployments folders

`rm -rf cache/* && rm -rf artifacts/* && rm -rf .openzeppelin/* && rm -rf deployments/*`

## Verifying contracts

https://github.com/wighawag/hardhat-deploy#4-hardhat-etherscan-verify

```
hardhat --network <network> etherscan-verify
```

## Tests

tests can be run with:

```
hardhat test
```

### running individual tests

choose a test file
```
hardhat test test/<testname>.js
```

with the .only flag individual test can be run
```
it.only("should run this test") async function () {
  ...
}
```

Chain ID needs to be set for ganache-cli:
ganache-cli --chainId 1

if the chain id does not match `block.chainid` the `src/OrderValidator.sol validate()` function will revert.

ganache-cli sets the chain id to 1337 as default, that somehow does not match the `block.chainid`
from `@openzeppelin/contracts-upgradeable/utils/cryptography/draft-EIP712Upgradeable.sol`


## Algorithms

Main function in the Exchange is matchOrders. It takes two orders (left and right), tries to match them and then fills if there is a match.

Logically, whole process can be divided into stages:

- order validation (check order parameters are valid and caller is authorized to execute the order)
- asset mathing (check if assets from left and right order match, extract matching assets)
- calculating fill (finding out what exact values should be filled. orders can be matched partly if one of the sides doesn't want to fill other order fully)
- order execution (execute transfers, save fill of the orders if needed)

### Domain model

#### Order:

- `address` maker
- `Asset` leftAsset (see [LibAsset](src/lib/LibAsset.md))
- `address` taker (can be zero address)
- `Asset` rightAsset (see [LibAsset](src/lib/LibAsset.md))
- `uint` salt - random number to distinguish different maker's Orders
- `uint` start - Order can't be matched before this date (optional)
- `uint` end - Order can't be matched after this date (optional)
- `bytes4` dataType - type of data, usually hash of some string, e.g.: "0xffffffff"
(see more [here](./src/LibOrderData.md))
- `bytes` data - generic data, can be anything, extendable part of the order (see more [here](./src/LibOrderData.md))

#### Order validation

- check start/end date of the orders
- check if taker of the order is blank or taker = order.taker
- check if order is signed by its maker or maker of the order is executing the transaction
- if maker of the order is a contract, then ERC-1271 check is performed

Only off-chain orders are supported

#### Asset matching

Purpose of this is to validate that **make asset** of the **left** order matches **take asset** from the **right** order and vice versa.
New types of assets can be added without smart contract upgrade. This is done using custom IAssetMatcher.

#### Order execution

Order execution is done by TransferManager

#### Royalties

Royalties percentage and receiver is extracted from the RoyaltiesRegistry and can be of many forms, GhostMarketRoyalties, RaribleRoyalties, EIP2981, or others.

#### Fees

`protocolFee` set currently to 2%

##### Fees calculation, fee side

To take a fee we need to calculate, what side of the deal can be used as money.
There is a simple algorithm to do it:

- if Base Currency is from any side of the deal, it's used
- if not, then if ERC-20 is in the deal, it's used
- if not, then if ERC-1155 is in the deal, it's used
- otherwise, fee is not taken (for example, two ERC-721 are involved in the deal)

When we established, what part of the deal can be treated as money, then we can establish, that

- buyer is side of the deal who owns money
- seller is other side of the deal

Then total amount of the asset (money side) should be calculated

- protocol fee is added on top of the filled amount
- origin fee of the buyer's order is added on top too

If buyer is using ERC-20 token for payment, then he must approve at least this calculated amount of tokens.

If buyer is using Base Currency, then he must send this calculated amount of Base Currency with the tx.

More on fee calculation can be found here src/GhostMarketTransferManager.sol
