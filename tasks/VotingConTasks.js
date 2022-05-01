const deployedContractAddr = "0x56c3fA66584C3DA817D1012a1C613540ED1F8e10";
 
task("deploy", "Deploys contract to network").setAction(async () => {
    const [deployer] = await ethers.getSigners();

    console.log("Deployer:", deployer.address);
    console.log("Deployer balance:", (await deployer.getBalance()).toString());

    const VotingCon = await ethers.getContractFactory("VotingCon");
    const votingCon = await VotingCon.deploy();

    console.log(`Voting contract address: ${votingCon.address}`,);
});

task("createVoting", "Creates a new voting").setAction(async () => {
    const dVotingCon = await ethers.getContractFactory("VotingCon");
    const votingCon = await dVotingCon.attach(deployedContractAddr);

    const votingTransaction = await votingCon.addVoting();
    const raw = await votingTransaction.wait();
    console.log(raw)
    const votingCreationEvent = raw.events.find(event => event.event === 'votingCreation');
    
    const [vid] = votingCreationEvent.args;

    console.log(`Created voting with id: ${vid}`);
});

task("withdrawComission", "Withdraws comission").setAction(async () => {
    const dVotingCon = await ethers.getContractFactory("VotingCon");
    const votingCon = await dVotingCon.attach(deployedContractAddr);

    const transaction = await votingCon.withdraw();
    await transaction.wait();

    console.log('Comission successfully withdrawed');
});

task("vote", "Vote to a specific voting")
    .addParam("vid", "Voting to vote id")
    .addParam("addr", "Address of candidate to vote")
    .setAction(async (args) => {
        const dVotingCon = await ethers.getContractFactory("VotingCon");
        const votingCon = await dVotingCon.attach(deployedContractAddr);

        const transaction = await votingCon.vote(args['vid'], args['addr'], { value: ethers.utils.parseEther("0.01") });
        await transaction.wait();

        console.log(`Successfully voted`);
    });


task("finish", "Vote to the specific voting")
    .addParam("vid", "voting id")
    .setAction(async (args) => {
        const dVotingCon = await ethers.getContractFactory("VotingCon");
        const votingCon = await dVotingCon.attach(deployedContractAddr);
        const transaction = await votingCon.finish(args['vid']);
        await transaction.wait();
        console.log('Successfully finished');
    });

task("votingStats", "Shows the statistics of a specific voting")
    .addParam("vid", "voting id")
    .setAction(async (args) => {
        const dVotingCon = await ethers.getContractFactory("VotingCon");
        const votingCon = await dVotingCon.attach(deployedContractAddr);

        const vInfo = await votingCon.getVotingInfo(args['vid']);

        const isEnded = vInfo[0];
        const isDraw = vInfo[1];
        const winner = vInfo[2];
        const vBalance = vInfo[3];
        const endsAtDate = new Date(vInfo[4] * 1000);
        const winnerVotersCount = vInfo[5];
        const votersCount = vInfo[6];

        console.log([vInfo]);

        console.log(`Voting info:\n
        Is ended: ${isEnded}\n
        Is draw: ${isDraw}\n
        Winner: ${winner}\n
        Prize: ${vBalance}\n
        End time: ${endsAtDate}\n
        Votes for winner count: ${winnerVotersCount}\n
        Voters count: ${votersCount}`);
    });