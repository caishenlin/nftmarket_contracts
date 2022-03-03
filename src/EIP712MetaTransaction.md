#### Features

`gasless` execution methods => metaTransaction.
contracts that want to use metaTransaction need to inherit EIP712MetaTransaction.

Method `__MetaTransaction_init_unchained` - detect uniq name (creae domain seperator) for signing all transactions, parameters:
- `string` name - contract name;
- `string` version - contract version.

Method `executeMetaTransaction` - for execute function, takes these parameters:
- `address` userAddress - address who execute and pay for transaction;
- `bytes` functionSignature - method signature;
- `bytes32` sigR - signature R;
- `bytes32` sigS - signature S;
- `bytes32` sigV - signature V;
- `bytes`  - return result of function, which `functionSignature` detect in parameter.


Method `getNonce` - return id transaction, for generating uniq signature
- `address` userAddress - address who execute and pay for transaction;
- `uint256` nonce.

 `_msgSender()` - Use this method insted of msg.sender.
 returns address of the metaTransaction caller

Check if contract supports metaTransaction, see example `areMetaTxSupported` in tests.

Method `areMetaTxSupported` - return `true` if contract supports metaTransaction, else return `false`
- `addressContract` - contract address;

See tests [here](../test/MetaTransaction.test.js) to make clear transfer metaTransactions
