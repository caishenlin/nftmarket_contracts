/* eslint-disable */
const { expect } = require('chai');
const { deployments, ethers } = require('hardhat');

const chai = require("chai");
const { solidity } = require("ethereum-waffle");
chai.use(solidity);
const { expect } = chai;

const _INTERFACE_ID_ERC165 = '0x01ffc9a7';
const _INTERFACE_ID_ROYALTIES_EIP2981 = '0x2a55205a';
const _INTERFACE_ID_ERC721 = '0x80ac58cd';

describe('ERC721WithRoyalties', () => {
    let ERC721WithRoyalties;
    let deployer;
    let royaltiesRecipient;
    let erc721WithRoyalties;

    const ADDRESS_ZERO = ethers.constants.AddressZero;

    beforeEach(async () => {
        [deployer, randomAccount, royaltiesRecipient] =
            await ethers.getSigners();

        ERC721WithRoyalties = await ethers.getContractFactory("ERC721WithRoyalties");
        erc721WithRoyalties = await ERC721WithRoyalties.deploy('ERC721WithRoyalties', '2981');
        console.log(erc721WithRoyalties.address)

    });

    describe('Royalties', async () => {
        it('has all the right interfaces', async function () {
            expect(
                await erc721WithRoyalties.supportsInterface(
                    _INTERFACE_ID_ERC165,
                ),
                'Error Royalties 165',
            ).to.be.true;

            expect(
                await erc721WithRoyalties.supportsInterface(
                    _INTERFACE_ID_ROYALTIES_EIP2981,
                ),
                'Error Royalties 2981',
            ).to.be.true;

            expect(
                await erc721WithRoyalties.supportsInterface(
                    _INTERFACE_ID_ERC721,
                ),
                'Error Royalties 721',
            ).to.be.true;
        });

        it('throws if royalties more than 100%', async function () {
            const tx = erc721WithRoyalties.mint(
                deployer.address,
                royaltiesRecipient.address,
                10001, // 100.01%
            );

            await expect(tx).to.be.revertedWith('ERC2981Royalties: Too high');
        });

        it('has the right royalties for tokenId', async function () {
            await erc721WithRoyalties.mint(
                deployer.address,
                royaltiesRecipient.address,
                250, // 2.50%
            );

            const info = await erc721WithRoyalties.royaltyInfo(1, 10000);
            expect(info[1].toNumber()).to.be.equal(250);
            expect(info[0]).to.be.equal(royaltiesRecipient.address);
        });

        it('can set address(0) as royalties recipient', async function () {
            // 0.01% royalties
            await erc721WithRoyalties.mint(deployer.address, ADDRESS_ZERO, 1);

            const info = await erc721WithRoyalties.royaltyInfo(1, 10000);
            expect(info[1].toNumber()).to.be.equal(1);
            expect(info[0]).to.be.equal(ADDRESS_ZERO);
        });

        it('has no royalties if not set', async function () {
            await erc721WithRoyalties.mint(
                deployer.address,
                royaltiesRecipient.address,
                0,
            );

            const info = await erc721WithRoyalties.royaltyInfo(1, 100);
            expect(info[1].toNumber()).to.be.equal(0);
            expect(info[0]).to.be.equal(ADDRESS_ZERO);
        });
    });
});
