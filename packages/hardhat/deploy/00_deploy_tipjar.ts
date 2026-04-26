import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const deployTipJar: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  await deploy("TipJarExtended", {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
  });
};

export default deployTipJar;
deployTipJar.tags = ["TipJarExtended"];
