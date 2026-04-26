// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

contract TipJarExtended {
    address public owner;
    uint256 public totalTipCount;
    uint256 public totalTipAmount;

    struct TipRecord {
        address tipper;
        uint256 amount;
        string  message;
        uint256 timestamp;
    }

    TipRecord[] public tipHistory;
    mapping(address => uint256) public tipperTotalAmount;
    mapping(address => uint256) public tipperCount;

    event TipReceived(address indexed tipper, uint256 amount, string message);
    event TipWithdrawn(address indexed owner, uint256 amount);

    constructor() { owner = msg.sender; }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    receive() external payable {
        _recordTip(msg.sender, msg.value, "");
    }

    function tip(string calldata message) public payable {
        require(msg.value > 0, "Must send ETH");
        _recordTip(msg.sender, msg.value, message);
    }

    function _recordTip(address tipper, uint256 amount, string memory message) internal {
        tipHistory.push(TipRecord(tipper, amount, message, block.timestamp));
        tipperTotalAmount[tipper] += amount;
        tipperCount[tipper]++;
        totalTipCount++;
        totalTipAmount += amount;
        emit TipReceived(tipper, amount, message);
    }

    function withdrawTips() public onlyOwner {
        uint256 bal = address(this).balance;
        require(bal > 0, "No tips");
        emit TipWithdrawn(owner, bal);
        (bool ok, ) = payable(owner).call{value: bal}("");
        require(ok, "Transfer failed");
    }

    function getTipHistory() external view returns (TipRecord[] memory) {
        return tipHistory;
    }

    function getTopTippers(uint256 n)
        external view returns (address[] memory addrs, uint256[] memory amounts)
    {
        uint256 len = tipHistory.length;
        address[] memory seen = new address[](len);
        uint256 uniqueCount = 0;
        for (uint256 i = 0; i < len; i++) {
            address a = tipHistory[i].tipper;
            bool found = false;
            for (uint256 j = 0; j < uniqueCount; j++) {
                if (seen[j] == a) { found = true; break; }
            }
            if (!found) seen[uniqueCount++] = a;
        }
        uint256 returnLen = n < uniqueCount ? n : uniqueCount;
        addrs   = new address[](returnLen);
        amounts = new uint256[](returnLen);
        address[] memory tmp = new address[](uniqueCount);
        uint256[] memory vals = new uint256[](uniqueCount);
        for (uint256 i = 0; i < uniqueCount; i++) {
            tmp[i] = seen[i]; vals[i] = tipperTotalAmount[seen[i]];
        }
        for (uint256 i = 0; i < returnLen; i++) {
            uint256 maxIdx = i;
            for (uint256 j = i+1; j < uniqueCount; j++)
                if (vals[j] > vals[maxIdx]) maxIdx = j;
            (tmp[i], tmp[maxIdx]) = (tmp[maxIdx], tmp[i]);
            (vals[i], vals[maxIdx]) = (vals[maxIdx], vals[i]);
            addrs[i] = tmp[i]; amounts[i] = vals[i];
        }
    }

    function getStats() external view returns (
        uint256 balance, uint256 count, uint256 total
    ) {
        return (address(this).balance, totalTipCount, totalTipAmount);
    }
}
