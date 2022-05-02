// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "../../contracts/RoyaltiesV1.sol";

contract RoyaltiesV1Test {
    RoyaltiesV1 immutable royalties;

    constructor(RoyaltiesV1 _royalties) {
        royalties = _royalties;
    }

    event Test(address account, uint256 value);

    function royaltiesTest(uint256 id) public {
        address payable[] memory recipients = royalties.getFeeRecipients(id);
        uint256[] memory values = royalties.getFeeBps(id);

        require(recipients.length == values.length);
        for (uint256 i = 0; i < recipients.length; i++) {
            emit Test(recipients[i], values[i]);
        }
    }
}
