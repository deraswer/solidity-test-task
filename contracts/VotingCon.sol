//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";

contract VotingCon {
    address public admin;
    uint candidatesCount;
    uint electionsCount;
    uint votersCount;

    constructor() {
        admin = msg.sender;
        candidatesCount = 0;
        electionsCount = 0;
        votersCount = 0;
    }

    modifier onlyAdmin() {
        require(msg.sender == admin);
        _;
    }

    struct Election {
        uint eid;
        uint creationTime;
        uint totalVoted;
        address[] currCandidates;
        address[] currVoters;
        uint[] currVotes;
    }

    Election[] elections;

    function createElection(address[] calldata _candidates) public onlyAdmin {

        elections.push(Election({
                eid: electionsCount,
                creationTime: block.timestamp,
                totalVoted: 0,
                currCandidates: _candidates,
                currVoters: new address[](0),
                currVotes: new uint[](_candidates.length)
            }));

        electionsCount += 1;
    }

    function endElection(uint _eid) public {
        if (block.timestamp - elections[_eid].creationTime >= 3 days) {
            uint maxi = 0;
            for (uint i = 0; i < elections[_eid].currVotes.length; i++) {
                if (elections[_eid].currVotes[maxi] < elections[_eid].currVotes[i]) maxi = i;
            }
            
            address payable winnerAddr =  payable(elections[_eid].currCandidates[maxi]);

            uint amount = address(this).balance * 90 / 100;

            winnerAddr.transfer(amount);

            delete elections[_eid];
        } else {
           console.log("This election can`t be deleted before the time is up.");
        }
    }

    function vote(uint _eid, address _candidateAddr) external payable {
        // 10000000000000000 wei = 0.01 ether
        if (msg.value == 10000000000000000 wei) {

            uint cid;
            for (uint i = 0; i < elections[_eid].currCandidates.length; i++) {
                if (elections[_eid].currCandidates[i] == _candidateAddr) {
                    cid = i;
                }
            }

            for (uint i = 0; i < elections[_eid].currVoters.length; i++) {
                if (elections[_eid].currVoters[i] == msg.sender) {
                    revert();
                }
            }

            elections[_eid].currVotes[cid] += 1;
            elections[_eid].currVoters.push(msg.sender);
            elections[_eid].totalVoted += 1;
            votersCount += 1;

        } else {
            console.log("You must send 0.01 ether to be eligible for voting.");
            revert();
        }
    }

    function withdrawTo(address payable _to) public onlyAdmin {
        _to.transfer(address(this).balance);
    }

    function getElections() public view returns (Election[] memory) {
        return elections;
    }

    function getTotalVoters() public view returns (uint) {
        return votersCount;
    }

    function getContractBalance() external view returns (uint) {
        return address(this).balance;
    }
}