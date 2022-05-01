require("@nomiclabs/hardhat-waffle");
require("solidity-coverage");
require('dotenv').config()
require('./tasks/VotingConTasks')

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: "0.8.0",
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {},
    rinkeby: {
      url: process.env.INFURA_URL,
      accounts: [process.env.CONTRACT_OWNER_PK]
    }
  }
};
