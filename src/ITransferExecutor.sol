// SPDX-License-Identifier: MIT

pragma solidity >=0.6.2 <0.8.0;
pragma abicoder v2;

import "./lib/LibAsset.sol";

abstract contract ITransferExecutor {
    //events
    event Transfer(LibAsset.Asset asset, address from, address to, bytes4 transferDirection, bytes4 transferType);

    function transfer(
        LibAsset.Asset memory asset,
        address from,
        address to,
        bytes4 transferDirection,
        bytes4 transferType
    ) internal virtual;
}
