import { expect } from "chai";
import {ethers} from "hardhat";
import moment from "moment";
import { MasterChefSmarterCoinV2 } from "../typechain";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";

import { ADDRESS_ZERO} from "./utilities";

describe("MasterChefSmarterV2 contract", () => {
    let deployer: SignerWithAddress;
    let devAddr ;
    let treasuryAddr: any;
    let investorAddr;
    let dumbTreasuryAddr: string;
    let SmartCoin;
    let MasterChefSmarterCoinV2;
    let smartCoin: any;
    let masterChefSmarterCoinV2: MasterChefSmarterCoinV2;
    let provider;
    let lpToken: any;
    let john: SignerWithAddress;
    let doe: SignerWithAddress;

    before(async () => {
        provider = new ethers.providers.JsonRpcProvider();

        SmartCoin = await ethers.getContractFactory("SmartCoin");
        MasterChefSmarterCoinV2 = await  ethers.getContractFactory("MasterChefSmarterCoinV2");

        const [_deployer, _devAddr, _treasuryAddr, _investorAddr, _dumbTreasuryAddress, _john, _doe] = await ethers.getSigners();

        deployer = _deployer;
        john = _john;
        doe = _doe;
        devAddr = await _devAddr.getAddress();
         treasuryAddr =  await _treasuryAddr.getAddress();
         investorAddr =  await _investorAddr.getAddress();
         dumbTreasuryAddr = await _dumbTreasuryAddress.getAddress();

        const startTimeStamp = Math.floor(moment().valueOf() / 1000);
        const joePerSec = 50;
        const devPercent = 100;
        const treasuryPercent = 500;
        const investorPercent = 200;
        const dumbFeePercent = 700;
        const boosterPercent = 500;

        console.log("Deploying the contract with the account: ", await deployer.getAddress());
        console.log("Deploying Smart Coin Contract...");

        smartCoin = await SmartCoin.deploy("Smart Coin", "SMART");
        lpToken = await SmartCoin.deploy("Smart LP Token", "SMART/AVAX");

        masterChefSmarterCoinV2 = await MasterChefSmarterCoinV2.deploy(
            smartCoin.address,
            devAddr,
            treasuryAddr,
            investorAddr,
            joePerSec,
            startTimeStamp,
            devPercent,
            treasuryPercent,
            investorPercent,
            boosterPercent,
            dumbFeePercent,
            dumbTreasuryAddr
        )

    })

    describe("MasterChefContractV2", () => {
        // Add lptoken to masterChefSmartCoinV2 Contract
        before(async () => {
            // const smartSigner = await smartCoin.connect(deployer);
            // const lpSigner = await lpToken.connect(deployer);

            // mint new tokens to deployer
            await smartCoin.mint(deployer.address, await ethers.utils.parseEther("1000000"));
            await lpToken.mint(deployer.address, await ethers.utils.parseEther("4000000"));

            // transfer smart tokens to john
            await smartCoin.approve(deployer.address, ethers.utils.parseEther('50000'))
            await smartCoin.transferFrom(deployer.address, john.address, ethers.utils.parseEther('50000'));

            // transfer lptokens to john
            await lpToken.approve(deployer.address, ethers.utils.parseEther('2000'))
            await lpToken.transferFrom(deployer.address, john.address, ethers.utils.parseEther('2000'));

            await masterChefSmarterCoinV2.add(1000, await lpToken.address, ADDRESS_ZERO)
        })

        it("Sets dumb fee correctly", async () => {
            expect(await masterChefSmarterCoinV2.dumbFeePercent()).equal(700)
        });
        it("Sets dumb fee treasury address", async () => {
            expect(await masterChefSmarterCoinV2.dumbTreasuryAddr()).equal(dumbTreasuryAddr)
        });
        it("Sets booster fee correctly", async () => {
            expect(await masterChefSmarterCoinV2.boosterPercent()).equal(500)
        });
        it('Should charge the dumb fee percent after emergency withdrawal', async () => {
            // deposit token to liquidity pool
            const amountToDeposit = 1000;

            await lpToken.connect(john).approve(masterChefSmarterCoinV2.address, ethers.utils.parseEther(String(amountToDeposit)))

            await masterChefSmarterCoinV2.connect(john).deposit(0, ethers.utils.parseEther(String(amountToDeposit)))

            expect(await lpToken.balanceOf(john.address)).to.equal(ethers.utils.parseEther(String(amountToDeposit)));

            await masterChefSmarterCoinV2.connect(john).emergencyWithdraw(0)

            const dumbFee = amountToDeposit * 0.7;

            expect(await lpToken.balanceOf(dumbTreasuryAddr)).to.equal(ethers.utils.parseEther(String(dumbFee)))
        })
    })
})