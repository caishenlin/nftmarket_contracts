// SPDX-License-Identifier: MIT

pragma solidity >=0.6.2 <0.8.0;
pragma abicoder v2;

import "../../src/LibOrder.sol";

contract LibOrderTest {
    function calculateRemaining(LibOrder.Order calldata order, uint256 fill)
        external
        pure
        returns (uint256 makeAmount, uint256 takeAmount)
    {
        return LibOrder.calculateRemaining(order, fill);
    }

    function hashKey(LibOrder.Order calldata order) external pure returns (bytes32) {
        return LibOrder.hashKey(order);
    }

    function validate(LibOrder.Order calldata order) external view {
        LibOrder.validate(order);
    }
}
