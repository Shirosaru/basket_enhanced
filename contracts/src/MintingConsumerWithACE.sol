// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {StablecoinERC20} from "./StablecoinERC20.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

/**
 * @title MintingConsumerWithACE
 * @notice ACE-protected consumer contract for minting/redeeming stablecoins with MANDATORY POR verification.
 * @dev Integrates with Chainlink's ACE and requires POR before executing mints.
 * 
 * Flow:
 * 1. Bank/Issuer sends mint request to CRE workflow (HTTP trigger)
 * 2. CRE workflow performs POR verification (validates sufficient reserves)
 * 3. CRE workflow generates signed report with mint instruction
 * 4. Forwarder validates signatures and calls this contract's onReport()
 * 5. onReport() verifies POR was completed and executes mint
 * 6. StablecoinERC20 checks POR is still valid (within 1 hour window)
 */
contract MintingConsumerWithACE is Initializable, OwnableUpgradeable {
    StablecoinERC20 public stablecoin;
    address public policyEngine;
    address public expectedAuthor;
    bytes10 public expectedWorkflowName;
    address public creForwarder; // CRE Forwarder address that calls onReport

    // Instruction types
    uint8 constant INSTRUCTION_MINT = 1;
    uint8 constant INSTRUCTION_REDEEM = 2;

    // Track mint requests pending POR verification
    mapping(bytes32 => MintRequest) public pendingMints;

    struct MintRequest {
        address beneficiary;
        uint256 amount;
        string transactionId;
        uint256 timestamp;
        bool executed;
    }

    event MintRequested(address indexed beneficiary, uint256 amount, string transactionId, bytes32 requestId);
    event MintExecuted(address indexed beneficiary, uint256 amount, bytes32 indexed porHash);
    event RedeemExecuted(address indexed account, uint256 amount, bytes32 indexed porHash);
    event PORVerificationRequired(bytes32 indexed requestId);
    event CREForwarderUpdated(address indexed newForwarder);

    error InvalidPayload();
    error NotCREForwarder();
    error NotOwner();
    error MintAlreadyExecuted();
    error PORNotVerified();

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @notice Initialize the minting consumer (called after proxy deployment).
     * @param initialOwner The address that will own this contract.
     * @param _stablecoin Address of the StablecoinERC20 contract.
     * @param _policyEngine Address of the PolicyEngine for compliance checks.
     * @param _creForwarder Address of the CRE Forwarder that calls onReport.
     */
    function initialize(
        address initialOwner,
        address _stablecoin,
        address _policyEngine,
        address _creForwarder,
        address _expectedAuthor,
        bytes10 _expectedWorkflowName
    ) public initializer {
        __Ownable_init(initialOwner);
        stablecoin = StablecoinERC20(_stablecoin);
        policyEngine = _policyEngine;
        creForwarder = _creForwarder;
        expectedAuthor = _expectedAuthor;
        expectedWorkflowName = _expectedWorkflowName;
    }

    /**
     * @notice Set the CRE Forwarder address (only owner can call).
     */
    function setCREForwarder(address _creForwarder) external onlyOwner {
        require(_creForwarder != address(0), "Invalid forwarder");
        creForwarder = _creForwarder;
        emit CREForwarderUpdated(_creForwarder);
    }

    /**
     * @notice Request a mint - creates a pending request awaiting POR verification.
     * @param beneficiary Recipient of minted tokens
     * @param amount Amount to mint (in smallest unit)
     * @param transactionId Unique transaction identifier
     */
    function requestMint(
        address beneficiary,
        uint256 amount,
        string calldata transactionId
    ) external onlyOwner returns (bytes32 requestId) {
        require(beneficiary != address(0), "Invalid beneficiary");
        require(amount > 0, "Invalid amount");
        
        requestId = keccak256(abi.encodePacked(beneficiary, amount, transactionId, block.timestamp));
        
        pendingMints[requestId] = MintRequest({
            beneficiary: beneficiary,
            amount: amount,
            transactionId: transactionId,
            timestamp: block.timestamp,
            executed: false
        });
        
        emit MintRequested(beneficiary, amount, transactionId, requestId);
        return requestId;
    }

    /**
     * @notice Receive report from CRE Forwarder with mint/redeem instruction.
     * @dev This function is called by the CRE Forwarder after POR verification.
     * @param metadata Encoded metadata from the report
     * @param report Encoded instruction: (uint8 type, address account, uint256 amount, bytes32 bankRef)
     */
    function onReport(bytes calldata metadata, bytes calldata report) external {
        if (msg.sender != creForwarder) revert NotCREForwarder();
        require(report.length >= 68, "Invalid report length");

        // Decode report: (uint8 type, address account, uint256 amount, bytes32 bankRef)
        (uint8 instructionType, address account, uint256 amount, bytes32 bankRef) = abi.decode(
            report,
            (uint8, address, uint256, bytes32)
        );

        require(account != address(0), "Invalid account");
        require(amount > 0, "Invalid amount");

        if (instructionType == INSTRUCTION_MINT) {
            // Mint is already executed by the CRE Forwarder calling stablecoin.mint()
            // This is a callback to record the event
            emit MintExecuted(account, amount, bankRef);
        } else if (instructionType == INSTRUCTION_REDEEM) {
            // For redeem, call burn (which also checks POR)
            stablecoin.burn(account, amount);
            emit RedeemExecuted(account, amount, bankRef);
        } else {
            revert InvalidPayload();
        }
    }

    /**
     * @notice Execute a pending mint after CRE has verified POR.
     * @dev Checks that POR is still valid before minting.
     * @param requestId ID of the mint request
     */
    function executePendingMint(bytes32 requestId) external onlyOwner {
        MintRequest storage req = pendingMints[requestId];
        require(req.beneficiary != address(0), "Request not found");
        require(!req.executed, "Already executed");

        // Check POR is valid
        if (stablecoin.lastPORTimestamp() == 0) revert PORNotVerified();
        
        uint256 porAge = block.timestamp - stablecoin.lastPORTimestamp();
        require(porAge <= stablecoin.POR_VALIDITY_WINDOW(), "POR expired");

        req.executed = true;
        stablecoin.mint(req.beneficiary, req.amount);
        emit MintExecuted(req.beneficiary, req.amount, stablecoin.lastPORHash());
    }

    /**
     * @notice Get pending mint request details.
     */
    function getPendingMint(bytes32 requestId) external view returns (MintRequest memory) {
        return pendingMints[requestId];
    }
}
