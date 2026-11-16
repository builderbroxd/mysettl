// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title DemoUSDC
 * @notice SETTL USD (sUSD): the demo settlement stablecoin for SETTL. on QDay Aevum Testnet (chainId 44005)
 * @dev Anyone can mint on the testnet or a local chain, so a demo needs only gas from the faucet.
 *      The contract keeps its original name so existing ABIs and scripts continue to work.
 */
contract DemoUSDC is ERC20, Ownable {
    uint8 private constant DECIMALS = 6;
    
    constructor(address initialOwner) ERC20("SETTL USD", "sUSD") Ownable(initialOwner) {
        // Initial supply: 0 (mint as needed for demo)
    }
    
    function decimals() public pure override returns (uint8) {
        return DECIMALS;
    }
    
    /**
     * @notice Mint tokens to an address (public, testnet only)
     * @param to Address to mint tokens to
     * @param amount Amount to mint (6 decimals)
     * @dev Anyone can mint on testnet for demo purposes
     */
    function mint(address to, uint256 amount) external {
        require(_isTestChain(), "DemoUSDC: Testnet only");
        _mint(to, amount);
    }
    
    /**
     * @notice Batch mint to multiple addresses
     * @param recipients Array of recipient addresses
     * @param amounts Array of amounts to mint (must match recipients length)
     * @dev Anyone can mint on testnet for demo purposes
     */
    function batchMint(address[] calldata recipients, uint256[] calldata amounts) external {
        require(_isTestChain(), "DemoUSDC: Testnet only");
        require(recipients.length == amounts.length, "DemoUSDC: Length mismatch");
        
        for (uint256 i = 0; i < recipients.length; i++) {
            _mint(recipients[i], amounts[i]);
        }
    }

    /// @dev QDay Aevum Testnet or a local Hardhat chain.
    function _isTestChain() private view returns (bool) {
        return block.chainid == 44005 || block.chainid == 31337;
    }
}
