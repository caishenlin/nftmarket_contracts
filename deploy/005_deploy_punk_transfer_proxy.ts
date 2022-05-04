import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {deployments, getNamedAccounts} = hre;
  const {deploy, execute} = deployments;

  const {deployer} = await getNamedAccounts();

  await deploy('PunkTransferProxy', {
    from: deployer,
    log: true,
  });

  await execute(
    'PunkTransferProxy',
    {from: deployer, log: true},
    '__OperatorRole_init'
  );
};
export default func;
func.tags = ['PunkTransferProxy'];
