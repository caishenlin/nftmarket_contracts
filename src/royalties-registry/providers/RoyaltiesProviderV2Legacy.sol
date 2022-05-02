// SPDX-License-Identifier: MIT

pragma solidity >=0.6.2 <0.8.0;
pragma abicoder v2;

import "../../royalties/IRoyaltiesProvider.sol";
import "./RoyaltyV2Legacy.sol";

contract RoyaltiesProviderV2Legacy is IRoyaltiesProvider {
    function getRoyalties(address token, uint256 tokenId) external view override returns (LibPart.Part[] memory) {
        return RoyaltyV2Legacy(token).getRoyalties(tokenId);
    }
}
