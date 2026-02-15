// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {StablecoinERC20} from "./StablecoinERC20.sol";
import {MintingConsumerWithACE} from "./MintingConsumerWithACE.sol";

/**
 * @title BasketFactory
 * @notice Factory for deploying POR-backed stablecoins with ACE integration.
 * @dev Creates Stablecoin + Minting Consumer, wires roles, and sets up POR verification.
 */
contract BasketFactory {
    address public immutable policyEngine;
    address public porOracleAddress; // Oracle that provides POR proofs

    event BasketCreated(
        address indexed creator,
        address indexed admin,
        address indexed stablecoin,
        address mintingConsumer,
        string name,
        string symbol,
        address porVerifier
    );

    event POROracleUpdated(address indexed newOracle);

    error InvalidPOROracle();
    error InvalidAdmin();

    constructor(address _policyEngine, address _porOracle) {
        require(_policyEngine != address(0), "Invalid policy engine");
        require(_porOracle != address(0), "Invalid POR oracle");
        policyEngine = _policyEngine;
        porOracleAddress = _porOracle;
    }

    /**
     * @notice Update the POR Oracle address (for PoR verification).
     */
    function setPOROracleAddress(address _porOracle) external {
        require(_porOracle != address(0), "Invalid oracle");
        porOracleAddress = _porOracle;
        emit POROracleUpdated(_porOracle);
    }

    /**
     * @notice Create a new Basket stablecoin with POR-backed minting.
     * @param name Token name
     * @param symbol Token symbol
     * @param admin Who should own/admin the stablecoin after setup
     * @param creForwarder Address of the CRE Forwarder (for ACE integration)
     * @return stablecoin Address of deployed StablecoinERC20
     * @return mintingConsumer Address of deployed MintingConsumerWithACE
     */
    function createBasket(
        string memory name,
        string memory symbol,
        address admin,
        address creForwarder
    ) external returns (address stablecoin, address mintingConsumer) {
        require(admin != address(0), "admin=0");
        require(creForwarder != address(0), "forwarder=0");

        // 1) Deploy StablecoinERC20 with POR verification
        // Factory is temporary owner to wire roles
        StablecoinERC20 sc = new StablecoinERC20(
            name,
            symbol,
            address(this),
            porOracleAddress  // POR oracle address
        );

        // 2) Deploy MintingConsumerWithACE behind proxy
        MintingConsumerWithACE impl = new MintingConsumerWithACE();

        bytes memory initData = abi.encodeWithSelector(
            MintingConsumerWithACE.initialize.selector,
            admin,              // initialOwner
            address(sc),        // stablecoin
            policyEngine,       // policyEngine
            creForwarder,       // CRE Forwarder address
            address(0),         // expectedAuthor (use address(0) for testing)
            bytes10("dummy")    // expectedWorkflowName
        );

        ERC1967Proxy proxy = new ERC1967Proxy(address(impl), initData);
        MintingConsumerWithACE consumer = MintingConsumerWithACE(address(proxy));

        // 3) Wire mint/burn permissions to consumer
        sc.grantMintRole(address(consumer));
        sc.grantBurnRole(address(consumer));

        // 4) Grant reserve manager role to admin (to update reserves)
        sc.grantReserveManager(admin);

        // 5) Hand stablecoin ownership to admin (admin manages POR verifier and policies)
        sc.transferOwnership(admin);

        emit BasketCreated(msg.sender, admin, address(sc), address(consumer), name, symbol, porOracleAddress);

        return (address(sc), address(consumer));
    }

    /**
     * @notice Deploy a basket with initial asset composition.
     * @param name Token name
     * @param symbol Token symbol
     * @param admin Who should own/admin the stablecoin
     * @param creForwarder Address of the CRE Forwarder
     * @param compositionAssets Array of asset types to compose the basket
     * @param compositionWeights Array of weights for each asset
     * @param compositionBacking Array of backing contract addresses
     */
    function createBasketWithComposition(
        string memory name,
        string memory symbol,
        address admin,
        address creForwarder,
        string[] memory compositionAssets,
        uint256[] memory compositionWeights,
        address[] memory compositionBacking
    ) external returns (address stablecoin, address mintingConsumer) {
        require(
            compositionAssets.length == compositionWeights.length &&
            compositionWeights.length == compositionBacking.length,
            "Array length mismatch"
        );

        // Create basket first
        (stablecoin, mintingConsumer) = createBasket(name, symbol, admin, creForwarder);

        // Add composition
        StablecoinERC20 sc = StablecoinERC20(stablecoin);
        for (uint256 i = 0; i < compositionAssets.length; i++) {
            sc.addComposition(compositionAssets[i], compositionWeights[i], compositionBacking[i]);
        }

        return (stablecoin, mintingConsumer);
    }
}
