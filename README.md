# Solidity test task - Voting System

## To deploy this contract to rinkeby you need to:

### Create .env file with this structure:
```
INFURA_URL="https://rinkeby.infura.io/v3/{projectID}}"
CONTRACT_OWNER_PK="private key here"
```

### Compile contract:
```shell
npx hardhat compile
```

### Deploy:
```shell
npx hardhat run scripts/deploy.js --network rinkeby
```

### Note that you should have testnet ETH to push transactions, here you can get some:
```
https://rinkebyfaucet.com/
```