# Setup Data

## Set Current Proposal

Nakamoto onwards voting addresses - note these are generic yes/no addresses and can
be reused for different ;

# devent

db.gatingCollection.insertOne( { gateType : 'create-market','merkleRootInput': ["ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"]})

# testnet

db.marketCategoriesCollection.insertMany([
{ name : 'crypto', information: '', displayName: 'Crypto', active: false},
{ name : 'bitcoin', information: '', displayName: 'Bitcoin', active: false},
{ name : 'stacks', information: '', displayName: 'Stacks', active: true},
{ name : 'solana', information: '', displayName: 'Solana', active: false},
{ name : 'sui', information: '', displayName: 'Sui', active: false},
{ name : 'ethereum', information: '', displayName: 'Ethereum', active: false},
{ name : 'memes', information: '', displayName: 'Memes', active: true},
{ name : 'politics', information: '', displayName: 'Politics', active: false},
{ name : 'sports', information: '', displayName: 'Sports', active: false},
{ name : 'e-sports', information: '', displayName: 'E Sports', active: true},
{ name : 'culture', information: '', displayName: 'Pop Culture', active: true},
{ name : 'business', information: '', displayName: 'Business', active: false}])

db.gatingCollection.insertOne( { gateType : 'create-market','merkleRootInput': ["ST3RR3HF25CQ9A5DEWS4R1WKJSBCFKQXFBYPJK3WV", "ST2RPDWF6N939Y32C4ZEVC74SCRTGSJBFBPJP05H5", "ST167Z6WFHMV0FZKFCRNWZ33WTB0DFBCW9M1FW3AY", "ST105HCS1RTR7D61EZET8CWNEF24ENEN3V6ARBYBJ"]})

db.daoEventCollection.findAndModify({query: {\_id:new ObjectId('67978e5414ccb345904d2936')}, update: {$set: {resolutionState: 237 }}, upsert: false, new: true, fields: {}})

db.daoEventCollection.findAndModify({query: {\_id:new ObjectId('67978e5414ccb345904d2936')}, update: {$set: {marketType: 233 }}, upsert: false, new: true, fields: {}})

## Featured Markets

db.daoEventCollection.findAndModify({query: {marketId:0}, update: {$set: {featured: true }}, upsert: false, new: true, fields: {}})

````
    gateType: string;
    merkleRootInput: Array<string>;

## Read DAO Events

1. Read Base DAO Events

```rest
/read-events-base-dao/:daoContractId
````

where dao contract is

- SP3JP0N1ZXGASRJ0F7QAHWFPGTVK9T2XNXDB908Z.bitcoin-dao (nakamoto)
- SP3JP0N1ZXGASRJ0F7QAHWFPGTVK9T2XNXDB908Z.ecosystem-dao (2.1 upgrade)
