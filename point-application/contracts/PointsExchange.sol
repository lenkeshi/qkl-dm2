// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./UniversalPoints.sol";
import "./RegularPoints.sol";

contract PointsExchange {
    UniversalPoints public universalPoints;
    
    // 兑换比例映射: key是普通积分的合约地址，value是该普通积分和通用积分之间的兑换比例
    mapping(address => uint256) public exchangeRates;

    // 构造函数：传入通用积分（UPT）的合约地址
    constructor(address _universalPoints) {
        universalPoints = UniversalPoints(_universalPoints);
    }

    function getRegularPointsBalance(address regularPointsAddress) public  view returns (uint256){
        RegularPoints regularPoints = RegularPoints(regularPointsAddress);
        return regularPoints.balanceOf(msg.sender);
    }

    // 兑换普通积分为通用积分
    function exchangeRPTToUPT(address regularPointsAddress, uint256 amount) external {
        RegularPoints regularPoints = RegularPoints(regularPointsAddress);

        uint256 rate = exchangeRates[regularPointsAddress];
        require(rate > 0, "Exchange rate not set for this token");
        uint256 amountToMint = amount * rate;
        // 检查用户普通积分余额
        require(regularPoints.balanceOf(msg.sender) >= amount, "Insufficient RPT balance");
        // 检查用户授权
        require(regularPoints.allowance(msg.sender, address(this)) >= amount, "Insufficient allowance");
        // 转移普通积分（RPT）
        regularPoints.transferFrom(msg.sender, address(this), amount);
        // 由兑换合约铸造通用积分
        universalPoints.mintByAuthorizedMinter(msg.sender, amountToMint);
    }

    // 设置不同积分的兑换比例（例如：1 RPT = 0.5 UPT）
    function setExchangeRate(address regularPointsAddress, uint256 newRate) external {
        exchangeRates[regularPointsAddress] = newRate;
    }
}