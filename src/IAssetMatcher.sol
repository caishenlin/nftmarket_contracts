// SPDX-License-Identifier: MIT

pragma solidity >=0.6.2 <0.8.0;
pragma abicoder v2;

import "./lib/LibAsset.sol";

interface IAssetMatcher {
    function matchAssets(LibAsset.AssetType memory leftAssetType, LibAsset.AssetType memory rightAssetType)
        external
        view
        returns (LibAsset.AssetType memory);
}
