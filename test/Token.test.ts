import { expect } from 'chai';

import { ethers, deployments, getNamedAccounts } from 'hardhat';

describe('Token contract', function () {
  it('Deployment should assign the total supply of tokens to the owner', async function () {
    await deployments.fixture(['TestERC20']);
    const { tokenOwner } = await getNamedAccounts();
    const Token = await ethers.getContract('TestERC20');
    const ownerBalance = await Token.balanceOf(tokenOwner);
    const supply = await Token.totalSupply();
    expect(ownerBalance).to.equal(supply);
  });
});
