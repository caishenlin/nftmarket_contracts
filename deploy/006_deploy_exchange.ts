import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';
import {ethers} from 'hardhat';

import {COLLECTION, CRYPTO_PUNKS} from '../test/assets.js';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {deployments, getNamedAccounts} = hre;
  const {deploy} = deployments;
  const {deployer} = await getNamedAccounts();

  const transferProxyContract = await ethers.getContract('TransferProxy');
  const erc20TransferProxyContract = await ethers.getContract(
    'ERC20TransferProxy'
  );
  const royaltiesRegistryContract = await ethers.getContract('RoyaltiesRegistry');
  const assetMatcherCollectionContract = await ethers.getContract('AssetMatcherCollection');
  const feesBP = 200;

  const ExchangeV2_Proxy = await deploy('ExchangeV2', {
    from: deployer,
    proxy: {
      owner: deployer,
      proxyContract: 'OpenZeppelinTransparentProxy',
      execute: {
        init: {
          methodName: '__ExchangeV2_init',
          args: [
            transferProxyContract.address,
            erc20TransferProxyContract.address,
            feesBP,
            deployer,
            royaltiesRegistryContract.address
          ],
        },
      },
    },
    log: true,
  });

  //add ExchangeV2 proxy address to the the allowed operators of transferProxy & erc20TransferProxy
  await transferProxyContract.addOperator(ExchangeV2_Proxy.address);
  await erc20TransferProxyContract.addOperator(ExchangeV2_Proxy.address);

  //set collection asset matcher
  const exchangeV2Contract = await ethers.getContract('ExchangeV2');
  await exchangeV2Contract.setAssetMatcher(COLLECTION, assetMatcherCollectionContract.address);

  //set punk transfer proxy
  const punkTransferProxyContract = await ethers.getContract('PunkTransferProxy');
  await exchangeV2Contract.setTransferProxy(CRYPTO_PUNKS, punkTransferProxyContract.address)

  console.log('deployer is: ', deployer);
  console.log('transferProxyContract deployed at: ', transferProxyContract.address);
  console.log('erc20TransferProxyContract deployed at: ', erc20TransferProxyContract.address);
  console.log('royaltiesRegistryContract deployed at: ', royaltiesRegistryContract.address);
  console.log('assetMatcherCollectionContract deployed at: ', assetMatcherCollectionContract.address);
  console.log('PunkTransferProxy deployed at: ', punkTransferProxyContract.address);
  console.log('exchangeV2Contract deployed at: ', exchangeV2Contract.address);
  console.log('exchangeFeeWallet is: ', deployer);
  console.log('fees value is: ', feesBP / 100 + '%');
};
export default func;
func.tags = ['ExchangeV2'];
module.exports.dependencies = ['TransferProxy', 'ERC20TransferProxy', 'RoyaltiesRegistry', 'AssetMatcherCollection', 'PunkTransferProxy'];
