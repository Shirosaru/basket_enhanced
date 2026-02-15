// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ERC165} from "@openzeppelin/contracts/utils/introspection/ERC165.sol";

/**
 * @title StablecoinERC20
 * @notice POR-backed stablecoin with role-gated mint/burn and basket composition tracking.
 * @dev Requires valid POR verification before minting. Tracks backing reserves and asset composition.
 */
contract StablecoinERC20 is ERC20, Ownable, ERC165 {
    // Backing reserve tracking
    uint256 public reserveBalance;
    uint256 public minReserveRatio = 1e18; // 100% (1e18 = 100%)
    
    // Role management
    mapping(address => bool) public isMinter;
    mapping(address => bool) public isBurner;
    mapping(address => bool) public isReserveManager;
    
    // Basket composition - track which assets make up this stablecoin
    struct AssetComposition {
        string assetType;      // e.g., "USD", "USDC", "commodity", "equity"
        uint256 weight;        // percentage (e.g., 5000 = 50%)
        address backing;       // address of backing asset/reserve
    }
    
    AssetComposition[] public composition;
    mapping(string => uint256) public assetTypeToComposition; // Track total weight per type
    
    // POR verification state
    bytes32 public lastPORHash;
    uint256 public lastPORTimestamp;
    address public porVerifier; // Address allowed to update POR proofs
    uint256 public constant POR_VALIDITY_WINDOW = 1 hours;

    event MintRoleGranted(address indexed account);
    event BurnRoleGranted(address indexed account);
    event ReserveManagerGranted(address indexed account);
    event MintRoleRevoked(address indexed account);
    event BurnRoleRevoked(address indexed account);
    event ReserveManagerRevoked(address indexed account);
    
    event MintExecuted(address indexed to, uint256 amount, bytes32 indexed porHash);
    event BurnExecuted(address indexed from, uint256 amount, bytes32 indexed porHash);
    event ReserveUpdated(uint256 newBalance, bytes32 indexed porHash);
    event CompositionUpdated(string assetType, uint256 weight);
    event PORVerified(bytes32 indexed porHash, uint256 timestamp, uint256 reserveBalance);

    error NotMinter();
    error NotBurner();
    error NotReserveManager();
    error NotPORVerifier();
    error InsufficientReserves();
    error InvalidComposition();
    error PORVerificationRequired();
    error PORExpired();

    constructor(
        string memory name_,
        string memory symbol_,
        address owner_,
        address _porVerifier
    ) ERC20(name_, symbol_) Ownable(owner_) {
        require(_porVerifier != address(0), "Invalid verifier");
        porVerifier = _porVerifier;
    }

    // --- POR Management ---
    function setPORVerifier(address _porVerifier) external onlyOwner {
        require(_porVerifier != address(0), "Invalid verifier");
        porVerifier = _porVerifier;
    }

    function verifyAndUpdatePOR(
        bytes32 porHash,
        uint256 newReserveBalance
    ) external {
        if (msg.sender != porVerifier) revert NotPORVerifier();
        require(porHash != bytes32(0), "Invalid hash");
        lastPORHash = porHash;
        lastPORTimestamp = block.timestamp;
        reserveBalance = newReserveBalance;
        emit PORVerified(porHash, block.timestamp, newReserveBalance);
    }

    function isPORValid() external view returns (bool) {
        return lastPORTimestamp > 0 && (block.timestamp - lastPORTimestamp <= POR_VALIDITY_WINDOW);
    }

    // --- Basket Composition Management ---
    function addComposition(
        string calldata assetType,
        uint256 weight,
        address backing
    ) external onlyOwner {
        require(weight > 0 && weight <= 1e18, "Invalid weight");
        require(backing != address(0), "Invalid backing");
        
        composition.push(AssetComposition({
            assetType: assetType,
            weight: weight,
            backing: backing
        }));
        assetTypeToComposition[assetType] = weight;
        emit CompositionUpdated(assetType, weight);
    }

    function getComposition() external view returns (AssetComposition[] memory) {
        return composition;
    }

    function getCompositionLength() external view returns (uint256) {
        return composition.length;
    }

    function setMinReserveRatio(uint256 ratio) external onlyOwner {
        require(ratio > 0 && ratio <= 1e18, "Invalid ratio");
        minReserveRatio = ratio;
    }

    // --- Reserve Management ---
    function updateReserveBalance(uint256 newBalance) external {
        if (!isReserveManager[msg.sender]) revert NotReserveManager();
        reserveBalance = newBalance;
        emit ReserveUpdated(newBalance, lastPORHash);
    }

    function checkReserveRatio() external view returns (bool, uint256) {
        uint256 totalSupply = totalSupply();
        if (totalSupply == 0) return (true, 1e18);
        
        uint256 ratio = (reserveBalance * 1e18) / totalSupply;
        return (ratio >= minReserveRatio, ratio);
    }

    // --- Admin role management ---
    function grantMintRole(address account) external onlyOwner {
        isMinter[account] = true;
        emit MintRoleGranted(account);
    }

    function revokeMintRole(address account) external onlyOwner {
        isMinter[account] = false;
        emit MintRoleRevoked(account);
    }

    function grantBurnRole(address account) external onlyOwner {
        isBurner[account] = true;
        emit BurnRoleGranted(account);
    }

    function revokeBurnRole(address account) external onlyOwner {
        isBurner[account] = false;
        emit BurnRoleRevoked(account);
    }

    function grantReserveManager(address account) external onlyOwner {
        isReserveManager[account] = true;
        emit ReserveManagerGranted(account);
    }

    function revokeReserveManager(address account) external onlyOwner {
        isReserveManager[account] = false;
        emit ReserveManagerRevoked(account);
    }

    // --- Mint/Burn (role gated with MANDATORY POR check) ---
    function mint(address to, uint256 amount) external {
        if (!isMinter[msg.sender]) revert NotMinter();
        
        // MANDATORY: Require valid POR before minting
        if (lastPORTimestamp == 0) revert PORVerificationRequired();
        if (block.timestamp - lastPORTimestamp > POR_VALIDITY_WINDOW) revert PORExpired();
        
        _mint(to, amount);
        emit MintExecuted(to, amount, lastPORHash);
    }

    function burn(address from, uint256 amount) external {
        if (!isBurner[msg.sender]) revert NotBurner();
        if (lastPORTimestamp == 0) revert PORVerificationRequired();
        if (block.timestamp - lastPORTimestamp > POR_VALIDITY_WINDOW) revert PORExpired();
        _burn(from, amount);
        emit BurnExecuted(from, amount, lastPORHash);
    }

    function burnFrom(address from, uint256 amount) external {
        if (!isBurner[msg.sender]) revert NotBurner();
        if (lastPORTimestamp == 0) revert PORVerificationRequired();
        if (block.timestamp - lastPORTimestamp > POR_VALIDITY_WINDOW) revert PORExpired();
        
        uint256 currentAllowance = allowance(from, msg.sender);
        if (currentAllowance != type(uint256).max) {
            _approve(from, msg.sender, currentAllowance - amount);
        }
        _burn(from, amount);
        emit BurnExecuted(from, amount, lastPORHash);
    }

    // --- Metadata ---
    function decimals() public view override returns (uint8) {
        return 6;
    }

    // ERC165 support
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC165)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
