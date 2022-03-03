import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';
import {ethers} from 'hardhat';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {deployments, getNamedAccounts} = hre;
  const {deploy} = deployments;
  const {deployer} = await getNamedAccounts();

  const transferProxyContract = await ethers.getContract('TransferProxy');
  const erc20TransferProxyContract = await ethers.getContract(
    'ERC20TransferProxy'
  );
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
          ],
        },
      },
    },
    log: true,
  });

  //add ExchangeV2 proxy address to the the allowed operators of transferProxy & erc20TransferProxy
  await transferProxyContract.addOperator(ExchangeV2_Proxy.address);
  await erc20TransferProxyContract.addOperator(ExchangeV2_Proxy.address);
  console.log('exchangeFeeWallet: ', deployer);
  console.log('fees value: ', feesBP / 100 + '%');
};
export default func;
func.tags = ['ExchangeV2'];
module.exports.dependencies = ['TransferProxy', 'ERC20TransferProxy'];
