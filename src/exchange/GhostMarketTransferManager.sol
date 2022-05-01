// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;
pragma abicoder v2;

import "./LibFeeSide.sol";
import "./exchange/ITransferManager.sol";
import "./exchange/LibOrderData.sol";
import "./exchange/lib/BpLibrary.sol";
import "./GhostMarketRoyalties.sol";
import "./interfaces/IERC2981Royalties.sol";

abstract contract GhostMarketTransferManager is OwnableUpgradeable, ITransferManager, GhostMarketRoyalties {
    using BpLibrary for uint;
    using SafeMathUpgradeable for uint;

    uint public protocolFee;

    address public defaultFeeReceiver;
    mapping(address => address) public feeReceivers;

    function __GhostMarketTransferManager_init_unchained(
        uint newProtocolFee,
        address newDefaultFeeReceiver
    ) internal initializer {
        protocolFee = newProtocolFee;
        defaultFeeReceiver = newDefaultFeeReceiver;
    }

    function setProtocolFee(uint newProtocolFee) external onlyOwner {
        protocolFee = newProtocolFee;
    }

    function setDefaultFeeReceiver(address payable newDefaultFeeReceiver) external onlyOwner {
        defaultFeeReceiver = newDefaultFeeReceiver;
    }
    /**
     * set fee for different tokens types
     *
     * @param token token contract address
     * @param wallet fee receiver address
     */
    function setFeeReceiver(address token, address wallet) external onlyOwner {
        feeReceivers[token] = wallet;
    }

    /**
     * fee and their receiver can be set for different tokens types
     * if the wallet address is empty the defaultFeeReceiver address gets the fees
     *
     * @param token token contract address
     */
    function getFeeReceiver(address token) internal view returns (address) {
        address wallet = feeReceivers[token];
        if (wallet != address(0)) {
            return wallet;
        }
        return defaultFeeReceiver;
    }

    /**
     * LibFill [1, 100] makeValue: 1 takeValue: 100
     */
    function doTransfers(
        LibAsset.AssetType memory makeMatch,
        LibAsset.AssetType memory takeMatch,
        LibFill.FillResult memory fill,
        LibOrder.Order memory leftOrder,
        LibOrder.Order memory rightOrder
    ) override internal returns (uint totalMakeValue, uint totalTakeValue) {
        LibFeeSide.FeeSide feeSide = LibFeeSide.getFeeSide(makeMatch.assetClass, takeMatch.assetClass);
        totalMakeValue = fill.makeValue;
        totalTakeValue = fill.takeValue;
        LibOrderDataV1.DataV1 memory leftOrderData = LibOrderData.parse(leftOrder);
        LibOrderDataV1.DataV1 memory rightOrderData = LibOrderData.parse(rightOrder);
        if (feeSide == LibFeeSide.FeeSide.MAKE) {
            totalMakeValue = doTransfersWithFees(fill.makeValue, leftOrder.maker, leftOrderData, rightOrderData, makeMatch, takeMatch,  TO_TAKER);
            transferPayouts(takeMatch, fill.takeValue, rightOrder.maker, leftOrderData.payouts, TO_MAKER);
        } else if (feeSide == LibFeeSide.FeeSide.TAKE) {
            totalTakeValue = doTransfersWithFees(fill.takeValue, rightOrder.maker, rightOrderData, leftOrderData, takeMatch, makeMatch, TO_MAKER);
            transferPayouts(makeMatch, fill.makeValue, leftOrder.maker, rightOrderData.payouts, TO_TAKER);
        }
    }

    function doTransfersWithFees(
        uint amount,
        address from,
        LibOrderDataV1.DataV1 memory dataCalculate,
        LibOrderDataV1.DataV1 memory dataNft,
        LibAsset.AssetType memory matchCalculate,
        LibAsset.AssetType memory matchNft,
        bytes4 transferDirection
    ) internal returns (uint totalAmount) {
        // calculate the total transfer amount with all fees
        totalAmount = calculateTotalAmount(amount, protocolFee, dataCalculate.originFees);
        //transfer the protocol fee and get the rest amount
        uint rest = transferProtocolFee(totalAmount, amount, from, matchCalculate, transferDirection);
        //transfer the royalty fee and get the rest amount
        rest = transferRoyalties(matchCalculate, matchNft, rest, amount, from, transferDirection);
        rest = transferOrigins(matchCalculate, rest, amount, dataCalculate.originFees, from, transferDirection);
        rest = transferOrigins(matchCalculate, rest, amount, dataNft.originFees, from, transferDirection);
        //transfer the payment for the asset to the beneficiaries (maker)
        transferPayouts(matchCalculate, rest, from, dataNft.payouts, transferDirection);
    }
    /**
     * @dev if the assetClass is ERC20_ASSET_CLASS or ERC1155_ASSET_CLASS
     * fees are transfered
     */
    function transferProtocolFee(
        uint totalAmount,
        uint amount,
        address from,
        LibAsset.AssetType memory matchCalculate,
        bytes4 transferDirection
    ) internal returns (uint) {
        /// only taker payes protocol fee
        (uint rest, uint fee) = subFeeInBp(totalAmount, amount, protocolFee);
        if (fee > 0) {
            address tokenAddress = address(0);
            if (matchCalculate.assetClass == LibAsset.ERC20_ASSET_CLASS) {
                tokenAddress = abi.decode(matchCalculate.data, (address));
            } else if (matchCalculate.assetClass == LibAsset.ERC1155_ASSET_CLASS) {
                uint tokenId;
                (tokenAddress, tokenId) = abi.decode(matchCalculate.data, (address, uint));
            }
            transfer(LibAsset.Asset(matchCalculate, fee), from, getFeeReceiver(tokenAddress), transferDirection, PROTOCOL);
        }
        return rest;
    }

    function transferRoyalties(
        LibAsset.AssetType memory matchCalculate,
        LibAsset.AssetType memory matchNft,
        uint rest,
        uint amount,
        address from,
        bytes4 transferDirection
    ) internal returns (uint restValue){
        restValue = rest;
        if (matchNft.assetClass != LibAsset.ERC1155_ASSET_CLASS && matchNft.assetClass != LibAsset.ERC721_ASSET_CLASS) {
            return restValue;
        }
        //does not like token ids with 0 value
        (address token, uint tokenId) = abi.decode(matchNft.data, (address, uint));
        Royalty[] memory fees = getRoyalties(token, tokenId);
        for (uint256 i = 0; i < fees.length; i++) {
            (uint newRestValue, uint feeValue) = subFeeInBp(restValue, amount, fees[i].value);
            restValue = newRestValue;
            if (feeValue > 0) {
                transfer(LibAsset.Asset(matchCalculate, feeValue), from, fees[i].recipient, transferDirection, ROYALTY);
            }
        }
        return restValue;
    }


    function getRoyalties(address token, uint tokenId) internal view returns (Royalty[] memory royaltyArray) {

		if (IERC165Upgradeable(token).supportsInterface(GhostMarketRoyalties._GHOSTMARKET_NFT_ROYALTIES)) {
			GhostMarketRoyalties royalities = GhostMarketRoyalties(token);
            return royalities.getRoyalties(tokenId);
	    }
        if(checkRoyaltiesStandardImplemented(token)){
            return getRoyaltiesEIP2981(token, tokenId);
        }

    }

    function getRoyaltiesEIP2981(address token, uint tokenId) internal view returns (Royalty[] memory royaltyArray) {
        try IERC2981Royalties(token).royaltyInfo(tokenId, GhostMarketRoyalties._WEIGHT_VALUE) returns (address receiver, uint256 royaltyAmount) {
            return GhostMarketRoyalties.calculateRoyalties(receiver, royaltyAmount);
        } catch {
            return new Royalty[](0);
        }
    }

    function checkRoyaltiesStandardImplemented(address _contract) internal view returns (bool) {
        (bool success) = IERC165Upgradeable(_contract).supportsInterface(GhostMarketRoyalties._INTERFACE_ID_ROYALTIES);
        return success;
    }

    function transferOrigins(
        LibAsset.AssetType memory matchCalculate,
        uint rest,
        uint amount,
        LibPart.Part[] memory originFees,
        address from,
        bytes4 transferDirection
    ) internal returns (uint restValue) {
        restValue = rest;
        for (uint256 i = 0; i < originFees.length; i++) {
            (uint newRestValue, uint feeValue) = subFeeInBp(restValue, amount,  originFees[i].value);
            restValue = newRestValue;
            if (feeValue > 0) {
                transfer(LibAsset.Asset(matchCalculate, feeValue), from,  originFees[i].account, transferDirection, ORIGIN);
            }
        }
    }

    function transferPayouts(
        LibAsset.AssetType memory matchCalculate,
        uint amount,
        address from,
        LibPart.Part[] memory payouts,
        bytes4 transferDirection
    ) internal {
        uint sumBps = 0;
        for (uint256 i = 0; i < payouts.length; i++) {
            uint currentAmount = amount.bp(payouts[i].value);
            sumBps = sumBps.add(payouts[i].value);
            if (currentAmount > 0) {
                transfer(LibAsset.Asset(matchCalculate, currentAmount), from, payouts[i].account, transferDirection, PAYOUT);
            }
        }
        require(sumBps == 10000, "Sum payouts Bps not equal 100%");
    }

    function calculateTotalAmount(
        uint amount,
        uint feeOnTopBp,
        LibPart.Part[] memory orderOriginFees
    ) internal pure returns (uint total){
        total = amount.add(amount.bp(feeOnTopBp));
        for (uint256 i = 0; i < orderOriginFees.length; i++) {
            total = total.add(amount.bp(orderOriginFees[i].value));
        }
    }

    function subFeeInBp(uint value, uint total, uint feeInBp) internal pure returns (uint newValue, uint realFee) {
        return subFee(value, total.bp(feeInBp));
    }

    function subFee(uint value, uint fee) internal pure returns (uint newValue, uint realFee) {
        if (value > fee) {
            newValue = value.sub(fee);
            realFee = fee;
        } else {
            newValue = 0;
            realFee = value;
        }
    }


    uint256[46] private __gap;
}
