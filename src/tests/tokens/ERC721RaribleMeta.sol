// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;
pragma abicoder v2;

import "../../EIP712MetaTransaction.sol";
import "./GhostmarketERC721.sol";
import "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";


contract ERC721RaribleMeta is GhostMarketERC721, EIP712MetaTransaction {
    event CreateERC721RaribleMeta(address owner, string name, string symbol);
    event CreateERC721RaribleUserMeta(address owner, string name, string symbol);

    function __ERC721RaribleUserMeta_init(
        string memory _name,
        string memory _symbol,
        string memory baseURI,
        address[] memory operators
    ) external initializer {
        initialize(_name, _symbol, baseURI);

        for (uint256 i = 0; i < operators.length; i++) {
            setApprovalForAll(operators[i], true);
        }

        __MetaTransaction_init_unchained("ERC721RaribleUserMeta", "1");

        emit CreateERC721RaribleUserMeta(_msgSender(), _name, _symbol);
    }

    function __ERC721RaribleMeta_init(
        string memory _name,
        string memory _symbol,
        string memory baseURI
    ) external initializer {
        initialize(_name, _symbol, baseURI);

        __MetaTransaction_init_unchained("ERC721RaribleMeta", "1");

        emit CreateERC721RaribleMeta(_msgSender(), _name, _symbol);
    }

    function _msgSender()
        internal
        view
        virtual
        override(ContextUpgradeable, EIP712MetaTransaction)
        returns (address)
    {
        return super._msgSender();
    }
}
