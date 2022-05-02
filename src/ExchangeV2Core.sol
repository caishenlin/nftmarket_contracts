// SPDX-License-Identifier: MIT

pragma solidity >=0.6.2 <0.8.0;
pragma abicoder v2;

import "./OrderValidator.sol";
import "./AssetMatcher.sol";

import "./ITransferManager.sol";
import "./lib/LibTransfer.sol";

abstract contract ExchangeV2Core is
    Initializable,
    OwnableUpgradeable,
    AssetMatcher,
    TransferExecutor,
    OrderValidator,
    ITransferManager
{
    using SafeMathUpgradeable for uint256;
    using LibTransfer for address;

    uint256 private constant UINT256_MAX = 2**256 - 1;

    address public matchAndTransferAdmin;

    //state of the orders
    mapping(bytes32 => uint256) public fills;

    //events
    event OrderFilled(
        bytes32 leftHash,
        bytes32 rightHash,
        address leftMaker,
        address rightMaker,
        uint256 newLeftFill,
        uint256 newRightFill
    );
    event Cancel(bytes32 hash, address maker, LibAsset.AssetType makeAssetType, LibAsset.AssetType takeAssetType);

    /**
     * @dev cancel the the given order by adding the biggest possible number to fills mapping
     */
    function cancel(LibOrder.Order memory order) external {
        require(_msgSender() == order.maker, "not a maker");
        require(order.salt != 0, "0 salt can't be used");
        bytes32 orderKeyHash = LibOrder.hashKey(order);
        fills[orderKeyHash] = UINT256_MAX;
        emit Cancel(orderKeyHash, order.maker, order.makeAsset.assetType, order.takeAsset.assetType);
    }

    /**
     * @dev call the cancel fucntion in a loop canceling multiple orders
     */
    function bulkCancelOrders(LibOrder.Order[] memory orders) external {
        for (uint256 i = 0; i < orders.length; i++) {
            // we can't call this.cancel function as the _msgSender() is changed to the contract address
            // and the _msgSender() == order.maker check fails
            require(_msgSender() == orders[i].maker, "not a maker");
            require(orders[i].salt != 0, "0 salt can't be used");
            bytes32 orderKeyHash = LibOrder.hashKey(orders[i]);
            fills[orderKeyHash] = UINT256_MAX;
            emit Cancel(orderKeyHash, orders[i].maker, orders[i].makeAsset.assetType, orders[i].takeAsset.assetType);
        }
    }

    function matchOrders(
        LibOrder.Order memory orderLeft,
        bytes memory signatureLeft,
        LibOrder.Order memory orderRight,
        bytes memory signatureRight
    ) external payable {
        validateFull(orderLeft, signatureLeft);
        validateFull(orderRight, signatureRight);
        if (orderLeft.taker != address(0)) {
            require(orderRight.maker == orderLeft.taker, "leftOrder.taker verification failed");
        }
        if (orderRight.taker != address(0)) {
            require(orderRight.taker == orderLeft.maker, "rightOrder.taker verification failed");
        }

        matchAndTransfer(orderLeft, orderRight);
    }

    /**
     * @dev set admin address that can use the matchAndTransferWithoutSignature function
     */
    function setMatchTransferAdminAccount(address mata) external onlyOwner {
        matchAndTransferAdmin = mata;
    }

    /**
     * @dev match orders without a signature, only admin
     */
    function matchAndTransferWithoutSignature(LibOrder.Order memory orderLeft, LibOrder.Order memory orderRight)
        external
        payable
    {
        require(msg.sender == matchAndTransferAdmin, "not allowed to matchAndTransfer without a signature");
        matchAndTransfer(orderLeft, orderRight);
    }

    function matchAndTransfer(LibOrder.Order memory orderLeft, LibOrder.Order memory orderRight) internal {
        (LibAsset.AssetType memory makeMatch, LibAsset.AssetType memory takeMatch) = matchAssets(orderLeft, orderRight);
        bytes32 leftOrderKeyHash = LibOrder.hashKey(orderLeft);
        bytes32 rightOrderKeyHash = LibOrder.hashKey(orderRight);
        uint256 leftOrderFill = fills[leftOrderKeyHash];
        uint256 rightOrderFill = fills[rightOrderKeyHash];
        LibFill.FillResult memory fill = LibFill.fillOrder(orderLeft, orderRight, leftOrderFill, rightOrderFill);
        require(fill.takeValue > 0, "nothing to fill");
        (uint256 totalMakeValue, uint256 totalTakeValue) = doTransfers(
            makeMatch,
            takeMatch,
            fill,
            orderLeft,
            orderRight
        );
        if (makeMatch.assetClass == LibAsset.ETH_ASSET_CLASS) {
            require(msg.value >= totalMakeValue, "not enough BaseCurrency");
            if (msg.value > totalMakeValue) {
                address(msg.sender).transferEth(msg.value - totalMakeValue);
            }
        } else if (takeMatch.assetClass == LibAsset.ETH_ASSET_CLASS) {
            require(msg.value >= totalTakeValue, "not enough BaseCurrency");
            if (msg.value > totalTakeValue) {
                address(msg.sender).transferEth(msg.value - totalTakeValue);
            }
        }

        address msgSender = _msgSender();
        if (msgSender != orderLeft.maker) {
            fills[leftOrderKeyHash] = leftOrderFill + fill.takeValue;
        }
        if (msgSender != orderRight.maker) {
            fills[rightOrderKeyHash] = rightOrderFill + fill.makeValue;
        }
        emit OrderFilled(
            leftOrderKeyHash,
            rightOrderKeyHash,
            orderLeft.maker,
            orderRight.maker,
            fill.takeValue,
            fill.makeValue
        );
    }

    function matchAssets(LibOrder.Order memory orderLeft, LibOrder.Order memory orderRight)
        internal
        view
        returns (LibAsset.AssetType memory makeMatch, LibAsset.AssetType memory takeMatch)
    {
        makeMatch = matchAssets(orderLeft.makeAsset.assetType, orderRight.takeAsset.assetType);
        require(makeMatch.assetClass != 0, "assets don't match");
        takeMatch = matchAssets(orderLeft.takeAsset.assetType, orderRight.makeAsset.assetType);
        require(takeMatch.assetClass != 0, "assets don't match");
    }

    function validateFull(LibOrder.Order memory order, bytes memory signature) internal view {
        LibOrder.validate(order);
        validate(order, signature);
    }

    uint256[49] private __gap;
}
