// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/utils/EnumerableSet.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./SmartCoin.sol";
import "./MasterChefJoeV2.sol";
import "./libraries/BoringERC20.sol";

// MasterChefJoe is a boss. He says "go f your blocks lego boy, I'm gonna use timestamp instead".
// And to top it off, it takes no risks. Because the biggest risk is operator error.
// So we make it virtually impossible for the operator of this contract to cause a bug with people's harvests.
//
// Note that it's ownable and the owner wields tremendous power. The ownership
// will be transferred to a governance smart contract once JOE is sufficiently
// distributed and the community can show to govern itself.
//
// With thanks to the Lydia Finance team.
//
// Godspeed and may the 10x be with you.
contract MasterChefSmarterCoinV2 is MasterChefJoeV2 {
    // Percentage on how much booster increases APR
    uint256 public boosterPercent;
    // Percentage fee charged to a dumb ass for transfering too soon
    uint256 public dumbFeePercent;
    // Dumb †reasury address
    address public dumbTreasuryAddr;

    constructor(
        SmartCoin _smartcoin,
        address _devAddr,
        address _treasuryAddr,
        address _investorAddr,
        uint256 _joePerSec,
        uint256 _startTimestamp,
        uint256 _devPercent,
        uint256 _treasuryPercent,
        uint256 _investorPercent,
        uint256 _boosterPercent,
        uint256 _dumbFeePercent,
        address _dumbTreasuryAddr
    ) MasterChefJoeV2(
        _smartcoin,
        _devAddr,
        _treasuryAddr,
        _investorAddr,
        _joePerSec,
        _startTimestamp,
        _devPercent,
        _treasuryPercent,
        _investorPercent
    ) public {
        require( 0 <= _dumbFeePercent && _dumbFeePercent <= 1000, "MasterChefSmarterV2: Invalid dumb fee percent value");

        boosterPercent = _boosterPercent;
        dumbFeePercent = _dumbFeePercent;
        dumbTreasuryAddr = _dumbTreasuryAddr;
    }

    // Withdraw LP tokens from MasterChef charging a dumb transfer fee
    function withdraw(uint256 _pid, uint256 _amount) public override {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];
        require(user.amount >= _amount, "MasterChefSmarterV2: withdraw not good");

        console.log(_pid);
        updatePool(_pid);

        // Harvest Smart
        uint256 pending = user.amount
            .mul(pool.accJoePerShare)
            .div(1e12).sub(user.rewardDebt);
        safeJoeTransfer(msg.sender, pending);
        emit Harvest(msg.sender, _pid, pending);

        user.amount = user.amount.sub(_amount);
        user.rewardDebt = user.amount.mul(pool.accJoePerShare).div(1e12);

        IRewarder rewarder = poolInfo[_pid].rewarder;
        if (address(rewarder) != address(0)) {
            rewarder.onJoeReward(msg.sender, user.amount);
        }

        uint256 treasuryFee = _amount.mul(devPercent).div(1000);
        // not my best of names so nomies don't get spooked but for this we will leave it like that
        uint256 dumbFee = _amount.mul(dumbFeePercent).div(1000);

        uint256 totalFee = treasuryFee.add(dumbFee);
        console.log("treasury fees %s, dumb fees %s, current amount %s", treasuryFee, dumbFee, _amount);
        _amount = _amount.sub(totalFee);

        console.log("amount to be transferred %s", _amount);

        // transfer funds to treasury
        pool.lpToken.safeTransfer(treasuryAddr, treasuryFee);
        pool.lpToken.safeTransfer(dumbTreasuryAddr, dumbFee);
        pool.lpToken.safeTransfer(address(msg.sender), _amount);

        emit Withdraw(msg.sender, _pid, _amount);
    }

    // Withdraw without caring about rewards. EMERGENCY and for dumb shit reasons
    function emergencyWithdraw(uint256 _pid) public override {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];

        // Dumb fee
        uint256 dumbFee = user.amount.mul(dumbFeePercent).div(1000);
        user.amount = user.amount.sub(dumbFee);

        pool.lpToken.safeTransfer(dumbTreasuryAddr, dumbFee);
        pool.lpToken.safeTransfer(address(msg.sender), user.amount);
        emit EmergencyWithdraw(msg.sender, _pid, user.amount);
        user.amount = 0;
        user.rewardDebt = 0;
    }

    // update dumbFee percent
    function setDumbFeePercent(uint256 _newDumbFeePercent) public onlyOwner {
        require(
        0 <= _newDumbFeePercent && _newDumbFeePercent <= 1000,
        "MasterCherSmarterCoinV2: invalid dumbfee percent value"
    );
        dumbFeePercent = _newDumbFeePercent;
    }

}