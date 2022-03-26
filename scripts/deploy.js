const { ethers } = require("hardhat");
const hre = require("hardhat");

async function main() {
    const [signer] = await hre.ethers.getSigners()

    const contractName = await ethers.getContractFactory('VotingCon', signer);
    const Contract = await contractName.deploy()

    await Contract.deployed()

    console.log(`deployed to: ${Contract.address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });