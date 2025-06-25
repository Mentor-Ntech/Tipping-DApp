// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title CeloKudos
 * @dev A social payment contract that allows users to send cUSD with personalized messages
 */
contract CeloKudos is ReentrancyGuard, Ownable, Pausable {
    using SafeERC20 for IERC20;

    // cUSD token address on Celo Alfajores testnet
    address public constant CUSD_TOKEN = 0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1;
    
    // Kudos data structure
    struct Kudos {
        address sender;
        address recipient;
        uint256 amount;
        string message;
        uint256 timestamp;
        bool isPublic;
    }

    // Storage
    Kudos[] public kudosList;
    mapping(address => uint256[]) public userReceivedKudos;
    mapping(address => uint256[]) public userSentKudos;
    mapping(address => uint256) public userReceivedCount;
    mapping(address => uint256) public userSentCount;
    mapping(address => uint256) public userTotalReceived;
    mapping(address => uint256) public userTotalSent;

    // Platform statistics
    uint256 public totalKudosSent;
    uint256 public totalAmountSent;
    uint256 public totalUsers;

    // Events
    event KudosSent(
        address indexed sender,
        address indexed recipient,
        uint256 amount,
        string message,
        uint256 timestamp,
        uint256 kudosId
    );

    event KudosReceived(
        address indexed recipient,
        address indexed sender,
        uint256 amount,
        string message,
        uint256 timestamp,
        uint256 kudosId
    );

    event UserRegistered(address indexed user, uint256 timestamp);

    // Modifiers
    modifier validAddress(address _address) {
        require(_address != address(0), "Invalid address");
        _;
    }

    modifier validAmount(uint256 _amount) {
        require(_amount > 0, "Amount must be greater than 0");
        _;
    }

    modifier validMessage(string memory _message) {
        require(bytes(_message).length > 0, "Message cannot be empty");
        require(bytes(_message).length <= 500, "Message too long");
        _;
    }

    constructor(address initialOwner) Ownable(initialOwner) {}

    /**
     * @dev Send kudos with cUSD and a message
     * @param recipient The address receiving the kudos
     * @param amount The amount of cUSD to send (in wei)
     * @param message The personalized message
     * @param isPublic Whether the kudos should be publicly visible
     */
    function sendKudos(
        address recipient,
        uint256 amount,
        string memory message,
        bool isPublic
    ) external nonReentrant whenNotPaused validAddress(recipient) validAmount(amount) validMessage(message) {
        require(recipient != msg.sender, "Cannot send kudos to yourself");
        
        // Transfer cUSD from sender to recipient
        IERC20 cUSD = IERC20(CUSD_TOKEN);
        require(cUSD.balanceOf(msg.sender) >= amount, "Insufficient cUSD balance");
        require(cUSD.allowance(msg.sender, address(this)) >= amount, "Insufficient allowance");
        
        cUSD.safeTransferFrom(msg.sender, recipient, amount);

        // Create kudos record
        Kudos memory newKudos = Kudos({
            sender: msg.sender,
            recipient: recipient,
            amount: amount,
            message: message,
            timestamp: block.timestamp,
            isPublic: isPublic
        });

        uint256 kudosId = kudosList.length;
        kudosList.push(newKudos);

        // Update user mappings
        userReceivedKudos[recipient].push(kudosId);
        userSentKudos[msg.sender].push(kudosId);
        userReceivedCount[recipient]++;
        userSentCount[msg.sender]++;
        userTotalReceived[recipient] += amount;
        userTotalSent[msg.sender] += amount;

        // Update platform statistics
        totalKudosSent++;
        totalAmountSent += amount;

        // Track unique users
        if (userReceivedCount[recipient] == 1) {
            totalUsers++;
            emit UserRegistered(recipient, block.timestamp);
        }
        if (userSentCount[msg.sender] == 1) {
            totalUsers++;
            emit UserRegistered(msg.sender, block.timestamp);
        }

        // Emit events
        emit KudosSent(msg.sender, recipient, amount, message, block.timestamp, kudosId);
        emit KudosReceived(recipient, msg.sender, amount, message, block.timestamp, kudosId);
    }

    /**
     * @dev Get kudos received by a user
     * @param user The user address
     * @param offset Starting index
     * @param limit Number of kudos to return
     * @return Array of kudos IDs
     */
    function getKudosReceived(
        address user,
        uint256 offset,
        uint256 limit
    ) external view validAddress(user) returns (uint256[] memory) {
        uint256[] memory userKudos = userReceivedKudos[user];
        uint256 totalKudos = userKudos.length;
        
        if (offset >= totalKudos) {
            return new uint256[](0);
        }

        uint256 endIndex = offset + limit;
        if (endIndex > totalKudos) {
            endIndex = totalKudos;
        }

        uint256 resultLength = endIndex - offset;
        uint256[] memory result = new uint256[](resultLength);

        for (uint256 i = 0; i < resultLength; i++) {
            result[i] = userKudos[offset + i];
        }

        return result;
    }

    /**
     * @dev Get kudos sent by a user
     * @param user The user address
     * @param offset Starting index
     * @param limit Number of kudos to return
     * @return Array of kudos IDs
     */
    function getKudosSent(
        address user,
        uint256 offset,
        uint256 limit
    ) external view validAddress(user) returns (uint256[] memory) {
        uint256[] memory userKudos = userSentKudos[user];
        uint256 totalKudos = userKudos.length;
        
        if (offset >= totalKudos) {
            return new uint256[](0);
        }

        uint256 endIndex = offset + limit;
        if (endIndex > totalKudos) {
            endIndex = totalKudos;
        }

        uint256 resultLength = endIndex - offset;
        uint256[] memory result = new uint256[](resultLength);

        for (uint256 i = 0; i < resultLength; i++) {
            result[i] = userKudos[offset + i];
        }

        return result;
    }

    /**
     * @dev Get kudos details by ID
     * @param kudosId The kudos ID
     * @return Kudos struct
     */
    function getKudosById(uint256 kudosId) external view returns (Kudos memory) {
        require(kudosId < kudosList.length, "Kudos does not exist");
        return kudosList[kudosId];
    }

    /**
     * @dev Get user statistics
     * @param user The user address
     * @return receivedCount Number of kudos received
     * @return sentCount Number of kudos sent
     * @return totalReceived Total amount received
     * @return totalSent Total amount sent
     */
    function getUserStats(address user) external view validAddress(user) returns (
        uint256 receivedCount,
        uint256 sentCount,
        uint256 totalReceived,
        uint256 totalSent
    ) {
        return (
            userReceivedCount[user],
            userSentCount[user],
            userTotalReceived[user],
            userTotalSent[user]
        );
    }

    /**
     * @dev Get platform statistics
     * @return totalKudos Total number of kudos sent
     * @return totalAmount Total amount sent
     * @return userCount Total number of users
     */
    function getPlatformStats() external view returns (
        uint256 totalKudos,
        uint256 totalAmount,
        uint256 userCount
    ) {
        return (totalKudosSent, totalAmountSent, totalUsers);
    }

    /**
     * @dev Get total number of kudos
     * @return Total kudos count
     */
    function getTotalKudos() external view returns (uint256) {
        return kudosList.length;
    }

    /**
     * @dev Get public kudos for leaderboards
     * @param offset Starting index
     * @param limit Number of kudos to return
     * @return Array of kudos IDs that are public
     */
    function getPublicKudos(
        uint256 offset,
        uint256 limit
    ) external view returns (uint256[] memory) {
        uint256 publicCount = 0;
        uint256 totalKudos = kudosList.length;

        // Count public kudos
        for (uint256 i = 0; i < totalKudos; i++) {
            if (kudosList[i].isPublic) {
                publicCount++;
            }
        }

        if (offset >= publicCount) {
            return new uint256[](0);
        }

        uint256 endIndex = offset + limit;
        if (endIndex > publicCount) {
            endIndex = publicCount;
        }

        uint256 resultLength = endIndex - offset;
        uint256[] memory result = new uint256[](resultLength);
        uint256 currentIndex = 0;
        uint256 resultIndex = 0;

        // Find public kudos
        for (uint256 i = 0; i < totalKudos && resultIndex < resultLength; i++) {
            if (kudosList[i].isPublic) {
                if (currentIndex >= offset) {
                    result[resultIndex] = i;
                    resultIndex++;
                }
                currentIndex++;
            }
        }

        return result;
    }

    // Admin functions
    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @dev Emergency function to recover stuck tokens
     * @param token The token address to recover
     * @param amount The amount to recover
     */
    function emergencyRecover(address token, uint256 amount) external onlyOwner {
        require(token != CUSD_TOKEN, "Cannot recover cUSD");
        IERC20(token).safeTransfer(owner(), amount);
    }
} 