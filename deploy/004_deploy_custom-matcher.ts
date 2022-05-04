import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {deployments, getNamedAccounts} = hre;
  const {deploy, execute} = deployments;

  const {deployer} = await getNamedAccounts();

  await deploy('AssetMatcherCollection', {
    from: deployer,
    log: true,
  });

/*   await execute(
    'AssetMatcherCollection',
    {from: deployer, log: true},
    '__ERC20TransferProxy_init'
  ); */
};
export default func;
func.tags = ['AssetMatcherCollection'];
