import { expect } from 'chai';

import { ethers } from 'hardhat';

describe('Token contract', function () {
  it('Deployment should assign the total supply of tokens to the owner', async function () {
    const TestERC20 = await ethers.getContractFactory("TestERC20");
    const Token = await TestERC20.deploy();

    const [tokenOwner] = await ethers.getSigners();
    const ownerBalance = await Token.balanceOf(tokenOwner.address);
    const supply = await Token.totalSupply();
    expect(ownerBalance).to.equal(supply);
  });
});
