# Setup Data

## Set Current Proposal

Nakamoto onwards voting addresses - note these are generic yes/no addresses and can
be reused for different ;

# devent

db.gatingCollection.insertOne( { gateType : 'create-market','merkleRootInput': ["ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"]})

# testnet

db.marketCategoriesCollection.insertMany([
{ name : 'crypto', information: '', displayName: 'Crypto', active: true},
{ name : 'Financial', information: '', displayName: 'Financial', active: true},
{ name : 'sports', information: '', displayName: 'Sports', active: true},
{ name : 'politics', information: '', displayName: 'Politics', active: true},
{ name : 'economy', information: '', displayName: 'Economy', active: true},
{ name : 'culture', information: '', displayName: 'Culture', active: true},
{ name : 'music', information: '', displayName: 'Music', active: true},
{ name : 'nsfw', information: '', displayName: 'NSFW', active: true},
{ name : 'banter', information: '', displayName: 'Banter', active: true}])

db.marketGatingCollection.insertOne( { gateType : 'create-market','merkleRootInput': ["ST31A25YBK50KFJ2QS0EQK9FNXEQJD4PR0828789R", "ST2ZGXYF58V9D2HXDTP3N02DC3F8G2251PPGRXDQD", "ST167Z6WFHMV0FZKFCRNWZ33WTB0DFBCW9M1FW3AY", "ST105HCS1RTR7D61EZET8CWNEF24ENEN3V6ARBYBJ"]})

db.marketGatingCollection.insertOne( { gateType : 'create-market','merkleRootInput': ["ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM", "ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5", "ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG", "ST2JHG361ZXG51QTKY2NQCVBPPRRE2KZB1HR05NNC"]})

db.marketGatingCollection.insertOne( { gateType : 'create-market','merkleRootInput': ["ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"]})

db.daoEventCollection.findAndModify({query: {\_id:new ObjectId('67978e5414ccb345904d2936')}, update: {$set: {resolutionState: 237 }}, upsert: false, new: true, fields: {}})

db.daoEventCollection.findAndModify({query: {\_id:new ObjectId('67978e5414ccb345904d2936')}, update: {$set: {marketType: 233 }}, upsert: false, new: true, fields: {}})

## Featured Markets

db.daoEventCollection.findAndModify({query: {marketId:0}, update: {$set: {featured: true }}, upsert: false, new: true, fields: {}})

db.daoEventCollection.findAndModify({query: {event : 'create-market', marketId:2, extension: 'ST31A25YBK50KFJ2QS0EQK9FNXEQJD4PR0828789R.bme023-2-market-scalar'}, update: {$set: {processed: true }}, upsert: false, new: true, fields: {}})

db.daoEventCollection.updateMany({event: 'create-market',extension: 'ST31A25YBK50KFJ2QS0EQK9FNXEQJD4PR0828789R.bme023-0-market-scalar'},{$set: {'unhashedData.processed': true}})

````
    gateType: string;
    merkleRootInput: Array<string>;

## Read DAO Events

1. Read Base DAO Events

```rest
/read-events-base-dao/:daoContractId
````

where dao contract is

- SP3JP0N1ZXGASRJ0F7QAHWFPGTVK9T2XNXDB908Z.bigmarket-dao (nakamoto)
- SP3JP0N1ZXGASRJ0F7QAHWFPGTVK9T2XNXDB908Z.ecosystem-dao (2.1 upgrade)
