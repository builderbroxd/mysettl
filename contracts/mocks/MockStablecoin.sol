// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @notice Test-only 6-decimal stablecoin standing in for tUSD8. Anyone can mint. Never deployed.
contract MockStablecoin is ERC20 {
    constructor() ERC20("Mock tUSD8", "mtUSD8") {}

    function decimals() public pure override returns (uint8) {
        return 6;
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
