// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract RegularPoints is ERC20 {
    // 映射存储用户指定的积分名称
    mapping(address => string) public customNames;

    constructor(string memory name, string memory symbol) ERC20(name, symbol) {}

    // 用户可以自由铸造普通积分
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}