// SPDX-License-Identifier: MIT

pragma solidity >=0.6.2 <0.8.0;
pragma abicoder v2;

import "../ExchangeV2.sol";
import "../ExchangeV2Core.sol";
import "../GhostMarketTransferManager.sol";

contract TestExchangeV2 is ExchangeV2 {
    function matchAndTransferExternal(LibOrder.Order memory orderLeft, LibOrder.Order memory orderRight)
        public
        payable
    {
        matchAndTransfer(orderLeft, orderRight);
    }

    uint256[50] private __gap;
}
