const { expect } = require("chai");
const { ethers } = require("hardhat");
 
describe("VotingCon", function () {

    let VotingCon;
    let votingCon;
    let vid;
    let owner;
    let candidate1;
    let candidate2;
    let users;

    beforeEach(async function () {
        [owner, candidate1, candidate2, ...users] = await ethers.getSigners();

        VotingCon = await ethers.getContractFactory("VotingCon");
        votingCon = await VotingCon.deploy();

        const votingTransaction = await votingCon.addVoting();
        const raw = await votingTransaction.wait();

        const votingCreatedEvent = raw.events.find(event => event.event === 'votingCreation');
        [vid] = votingCreatedEvent.args;
    });

    describe("Deploy", function () {
        it("Checks contract owner", async function () {
            expect(await votingCon.owner()).to.equal(owner.address);
        });

        it("Checks contract balance", async function () {
            expect(await votingCon.getConBalance()).to.equal(0);
        });

        it("Checks voting info getter", async function () {
            const vobj = await votingCon.getVotingInfo(0);

            expect(vobj[0]).to.equal(false);
            expect(vobj[1]).to.equal(false);
            expect(vobj[2]).to.equal("0x0000000000000000000000000000000000000000");
            expect(vobj[3].toNumber()).to.equal(0);
            expect(vobj[5].toNumber()).to.equal(0);
            expect(vobj[6].toNumber()).to.equal(0);
        });
    });

    describe("Voting", async function () {
        it("Checks unique voting id", async function () {
          const cpdVotingTransaction = await votingCon.addVoting();
          const cpdRaw = await cpdVotingTransaction.wait();
  
          const cpdVotingCreationEvent = cpdRaw.events.find(event => event.event === 'votingCreation');
          const [cpdVid] = cpdVotingCreationEvent.args;
  
          await expect(cpdVid).to.equal(1);
        });

        it("Checks genesis state", async function () {

          await expect(vid).to.equal(0);

          
          await expect(await votingCon.getVotersCount(vid)).to.equal(0);
          await expect(await votingCon.getVotingEnd(vid)).to.equal(false);
        });

        it("Checks payment", async function () {
            await expect(votingCon.connect(candidate1).vote(vid, candidate2.address)).to.be.revertedWith("You must send 0.01 ether to be eligible for voting.");
        })

        it("Checks addition of candidate", async function () {
            const addCandidateTransaction = await votingCon.addCandidate(0, users[5].address);
            const actRaw = await addCandidateTransaction.wait();
    
            const candidateAdditionEvent = actRaw.events.find(event => event.event === 'candidateAddition');
            const [candidateAddr] = candidateAdditionEvent.args;
    
            await expect(candidateAddr).to.equal(users[5].address);
        });

        it("Checks state after voting", async function () {

            await votingCon.connect(candidate1).vote(vid, candidate2.address, { value: ethers.utils.parseEther("0.01") });

            expect(await votingCon.getVotingsCount()).to.equal(1);
            expect(await votingCon.getVotersCount(vid)).to.equal(1);
            expect(await votingCon.getVotingWinner(vid)).to.equal(candidate2.address);
            expect(await votingCon.getVotingEnd(vid)).to.equal(false);
        });

        it("Checks that one can vote once", async function () {
            await votingCon.connect(candidate1).vote(vid, candidate2.address, { value: ethers.utils.parseEther("0.01") });
            await expect(votingCon.connect(candidate1).vote(vid, candidate2.address, { value: ethers.utils.parseEther("0.01") })).to.be.revertedWith("You can`t vote more than once!");
        });

        it("Checks winner choosing", async function () {

            for (let i = 0; i < 5; i++) {
                await votingCon.connect(users[i]).vote(vid, candidate1.address, { value: ethers.utils.parseEther("0.01") });
            }

            for (let i = 5; i < 15; i++) {
                await votingCon.connect(users[i]).vote(vid, candidate2.address, { value: ethers.utils.parseEther("0.01") });
            }

            expect(await votingCon.getVotingWinner(vid)).to.equal(candidate2.address);
            expect(await votingCon.getVotersCount(vid)).to.equal(15);
        });

        it("Checks end of voting before end time", async function () {
            await expect(votingCon.finish(vid)).to.be.revertedWith('This voting can`t be ended before the time is up.');
        });

        it("Checks voting after end time", async function () {
            await votingCon.connect(candidate1).vote(vid, candidate2.address, { value: ethers.utils.parseEther("0.01") });

            await network.provider.send("evm_increaseTime", [60 * 60 * 24 * 3]);

            await expect(votingCon.connect(users[5]).vote(vid, candidate1.address, { value: ethers.utils.parseEther("0.01") })).to.be.revertedWith("Voting is ended");

            await expect(await votingCon.getVotingEnd(vid)).to.equal(false);

            const winnerBalance = await candidate1.getBalance();

            await votingCon.finish(vid);

            await expect(await candidate1.getBalance() > winnerBalance);
            await expect(await votingCon.getVotingEnd(vid)).to.equal(true);
        });

        it("Checks voting result is draw", async function () {
            await votingCon.connect(candidate1).vote(vid, candidate2.address, { value: ethers.utils.parseEther("0.01") });
            await votingCon.connect(candidate2).vote(vid, candidate1.address, { value: ethers.utils.parseEther("0.01") });

            await network.provider.send("evm_increaseTime", [60 * 60 * 24 * 3]);

            await expect(votingCon.finish(vid)).to.be.revertedWith("The voting result can`t be a draw");
        });

        it("Checks withdrawals not by owner", async function () {
            await expect(votingCon.connect(candidate1).withdraw()).to.be.revertedWith("You're not the owner!");
            await expect(votingCon.connect(candidate2).withdraw()).to.be.revertedWith("You're not the owner!");
        });

        it("Checks voting end", async function () {
            const endDate = new Date(await votingCon.connect(candidate1).getVotingEndtime(vid) * 1000);
            await expect(endDate > Date.now());
        });

        it("Checks withdrawal by owner", async function () {
            const balance = await owner.getBalance();

            await votingCon.connect(candidate1).vote(vid, candidate2.address, { value: ethers.utils.parseEther("0.01") }); 

            await network.provider.send("evm_increaseTime", [60 * 60 * 24 * 3]);
            expect(await votingCon.getVotingEnd(vid)).to.equal(false);
            await votingCon.finish(vid);

            await votingCon.withdraw();

            await expect(await owner.getBalance() > balance);
        });

        it("Checks impossibility to vote after", async function () {
            await votingCon.connect(candidate1).vote(vid, candidate2.address, { value: ethers.utils.parseEther("0.01") });
            await network.provider.send("evm_increaseTime", [60 * 60 * 24 * 3]); 
            await votingCon.finish(vid);
            await expect(votingCon.connect(candidate2).vote(vid, candidate2.address, { value: ethers.utils.parseEther("0.01") })).to.be.revertedWith("Voting is ended");
            await expect(await votingCon.getVotingEnd(vid)).to.equal(true);
        });

        it("Checks double ending", async function () {
            await votingCon.connect(candidate1).vote(vid, candidate2.address, { value: ethers.utils.parseEther("0.01") }); 
            await network.provider.send("evm_increaseTime", [60 * 60 * 24 * 3]); 
            await votingCon.finish(vid);

            expect(votingCon.finish(vid)).to.be.revertedWith("Voting is ended");
        });
    });
});
