// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;
pragma abicoder v2;

import "../../contracts/IERC2981.sol";

contract Royalties2981Test {
    IERC2981 immutable royalties;

    constructor(IERC2981 _royalties) {
        royalties = _royalties;
    }

    event Test(address account, uint256 value);

    function royaltyInfoTest(uint256 _tokenId, uint256 _salePrice) public {
        (address account, uint256 value) = royalties.royaltyInfo(_tokenId, _salePrice);
        emit Test(account, value);
    }
}
