# Bulk minting
A script allows user minting many nfts using CLI

## Guidelines
After installing [NodeJS](https://nodejs.org/en), perform the following steps to run script:
### 1. Environment setup
User MUST provide `mnemonic` of minter account by changing value at `line 7` of `bulk_minting.js`:
```javascript
const MNEMONIC = "add minter's mnemonic at here";
```

User MUST provide `address` of collection contract at `line 8` of `bulk_minting.js`:
```javascript
const COLLECTION_CONTRACT_ADDRESS = "aura1000000000000000000000000000000000CollectionContractAddress";
```

### 2. Import nfts data
Change the data of nfts in the `list.csv`

### 3. Run
Installing the requirement libs
```bash
npm install
```

Minting nfts
```bash
node bulk_minting.js
```