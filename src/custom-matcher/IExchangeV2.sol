// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

contract IExchangeV2{
  function setAssetMatcher(bytes4 assetType, address matcher) external;
}
