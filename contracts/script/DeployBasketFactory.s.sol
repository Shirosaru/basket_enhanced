// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import "forge-std/Script.sol";
import "../src/BasketFactory.sol";
import "../src/StablecoinERC20.sol";

/**
 * @title DeployBasketFactory
 * @notice Script to deploy BasketFactory and create a sample basket
 */
contract DeployBasketFactory is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        // Get configuration from environment
        address policyEngine = vm.envAddress("POLICY_ENGINE");
        address porOracle = vm.envAddress("POR_ORACLE");
        address admin = vm.envAddress("ADMIN_ADDRESS");
        address creForwarder = vm.envAddress("CRE_FORWARDER");

        // Deploy BasketFactory with POR oracle
        BasketFactory factory = new BasketFactory(policyEngine, porOracle);
        console.log("BasketFactory deployed at:", address(factory));

        // Create a sample basket with POR integration
        (address stablecoin, address consumer) = factory.createBasket(
            "Basket USD",
            "bUSD",
            admin,
            creForwarder
        );

        console.log("Stablecoin deployed at:", stablecoin);
        console.log("Minting Consumer deployed at:", consumer);

        // Optional: Add composition to sample basket
        // StablecoinERC20 sc = StablecoinERC20(stablecoin);
        // sc.addComposition("USD", 100 * 1e16, porOracle); // 100% USD weight

        vm.stopBroadcast();
    }
}
