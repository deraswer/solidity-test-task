//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";

contract VotingCon {

    struct User {
        bool voted;
        address votedFor;
        uint256 votes;
    }

    struct Voting {
        mapping(address => User) users;
        bool isEnded;
        bool isDraw;
        address payable winner;
        
        uint256 vBalance;
        uint256 endTime;
        uint256 winnerVotesCount;
        uint256 votersCount;
    }
    
    address payable public owner;

    mapping(uint256 => Voting) public votings;

    uint256 votingsCount;

    uint256 commission;

    event votingCreation(uint256 _vid);

    constructor() {
        owner = payable(msg.sender);
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "You're not the owner!");
        _;
    }

    function addVoting() public onlyOwner returns (uint256 _vid) {
        _vid = votingsCount;
        votingsCount++;

        Voting storage voting = votings[_vid];
        voting.endTime = block.timestamp + 3 days;
        
        emit votingCreation(_vid);
    }

    function vote(uint256 _vid, address payable candidateAddr) public payable {
        require(msg.value == 0.01 ether, "You must send 0.01 ether to be eligible for voting.");

        Voting storage voting = votings[_vid];

        require(!voting.isEnded, "Voting is ended");

        User storage voter = voting.users[msg.sender];
        User storage candidate = voting.users[candidateAddr];

        require(!voter.voted, "You can`t vote more than once!");

        voter.votedFor = candidateAddr;
        voter.voted = true;
        candidate.votes++;
        voting.vBalance += 0.009 ether;
        commission += 0.001 ether;
        voting.votersCount++;

        if (voting.winnerVotesCount == candidate.votes) {
            voting.isDraw = true;
        } else {
            voting.isDraw = false;
        }

        if (voting.winnerVotesCount < candidate.votes) {
            voting.winnerVotesCount = candidate.votes;
            voting.winner = candidateAddr;
        }
    }

    function finish(uint256 _vid) public {
        Voting storage voting = votings[_vid];
        
        require(block.timestamp >= voting.endTime, "This voting can`t be ended before the time is up.");
        require(!voting.isEnded, "Voting is ended"); 
        require(!voting.isDraw, "The voting result can`t be a draw");    

        voting.isEnded = true;
        voting.winner.transfer(voting.vBalance);
        
        voting.vBalance = 0;
    }

    function withdraw() public onlyOwner payable {
        owner.transfer(commission);
    }

    function getVotingsCount() public view returns (uint256) {
        return votingsCount;
    }

    function getVotingInfo(uint256 _vid) public view returns (
        bool, bool, address, 
        uint, uint, uint, uint
    ) {
        return (
            votings[_vid].isEnded,
            votings[_vid].isDraw,
            votings[_vid].winner,
        
            votings[_vid].vBalance,
            votings[_vid].endTime,
            votings[_vid].winnerVotesCount,
            votings[_vid].votersCount
        );
    }

    function getVotingEnd(uint256 _vid) public view returns (bool) {
        return votings[_vid].isEnded;
    }

    function getVotingEndtime(uint256 _vid) public view returns (uint) {
        return votings[_vid].endTime;
    }

    function getVotingWinner(uint256 _vid) public view returns (address) {
        return votings[_vid].winner;
    }

    function getVotersCount(uint256 _vid) public view returns (uint) {
        return votings[_vid].votersCount;
    }

    function getConBalance() external view returns (uint) {
        return address(this).balance;
    }
}