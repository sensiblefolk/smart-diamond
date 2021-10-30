// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { ethers } from "hardhat";
import moment from "moment";

async function main() {
 const MasterChefSmarterCoinV2 = await ethers.getContractFactory("MasterChefSmarterCoinV2");
 const SmartCoin = await ethers.getContractFactory("SmartCoin");

 const [deployer, devAddr, treasuryAddr, investorAddr, dumbTreasuryAddress] = await ethers.getSigners();

 const startTimeStamp = Math.floor(moment().valueOf() / 1000);
 const joePerSec = 50;
 const devPercent = 100;
 const treasuryPercent = 500;
 const investorPercent = 200;
 const dumbFeePercent = 700;
 const boosterPercent = 500;

 console.log("Deploying the contract with the account: ", await deployer.getAddress());
 console.log("Deploying Smart Coin Contract...");

 const smartCoin = await SmartCoin.deploy("Smart Coin", "SMART");
 console.log('Smart Contract deployed to:', smartCoin.address);

 console.log("Deploying MasterChefSmarterCoinV2 Contract....");
 const masterChefSmarterCoinV2 = await MasterChefSmarterCoinV2.deploy(
     smartCoin.address,
     await devAddr.getAddress(),
     await treasuryAddr.getAddress(),
     await investorAddr.getAddress(),
     joePerSec,
     startTimeStamp,
     devPercent,
     treasuryPercent,
     investorPercent,
     boosterPercent,
     dumbFeePercent,
     await dumbTreasuryAddress.getAddress()
 )
  console.log("MasterChefSmarterCoinV2 deployed to: ", masterChefSmarterCoinV2.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
