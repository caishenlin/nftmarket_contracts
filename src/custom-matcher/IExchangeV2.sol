// SPDX-License-Identifier: MIT

pragma solidity >=0.6.2 <0.8.0;

abstract contract IExchangeV2 {
     function setAssetMatcher(bytes4 assetType, address matcher) virtual external ;
}
