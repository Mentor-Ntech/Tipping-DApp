import { ethers } from "hardhat";
import { CeloKudos } from "../typechain-types";

async function main() {
  console.log("Starting CeloKudos deployment...");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

  // Deploy the CeloKudos contract
  console.log("Deploying CeloKudos contract...");
  const CeloKudosFactory = await ethers.getContractFactory("CeloKudos");
  const celoKudos = await CeloKudosFactory.deploy(deployer.address);
  
  await celoKudos.waitForDeployment();
  const contractAddress = (celoKudos as any).address || (celoKudos as any).target;
  console.log("CeloKudos deployed to:", contractAddress);

  // Verify deployment
  console.log("Verifying deployment...");
  const owner = await celoKudos.owner();
  console.log("Contract owner:", owner);
  
  const cusdToken = await celoKudos.CUSD_TOKEN();
  console.log("cUSD token address:", cusdToken);

  // Log deployment information
  console.log("\nDeployment Summary:");
  console.log("========================");
  console.log("Contract: CeloKudos");
  console.log("Address:", contractAddress);
  console.log("Owner:", owner);
  console.log("cUSD Token:", cusdToken);
  console.log("Network:", (await ethers.provider.getNetwork()).name);
  console.log("Chain ID:", (await ethers.provider.getNetwork()).chainId);

  
  
  return celoKudos;
}

// Handle errors and exit
main()
  .then(() => {
    console.log("Deployment completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  }); 