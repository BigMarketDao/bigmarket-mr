# Setup Data

## Set Current Proposal

Nakamoto onwards voting addresses - note these are generic yes/no addresses and can
be reused for different ;

# devent

db.gatingCollection.insertOne( { gateType : 'create-market','merkleRootInput': ["ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"]})

# testnet

db.daoEventCollection.findAndModify({query: {\_id:new ObjectId('67978e5414ccb345904d2936')}, update: {$set: {resolutionState: 237 }}, upsert: false, new: true, fields: {}})

db.daoEventCollection.findAndModify({query: {\_id:new ObjectId('67978e5414ccb345904d2936')}, update: {$set: {marketType: 233 }}, upsert: false, new: true, fields: {}})

## Featured Markets

db.daoEventCollection.findAndModify({query: {marketId:0}, update: {$set: {featured: true }}, upsert: false, new: true, fields: {}})

db.daoEventCollection.findAndModify({query: {event : 'create-market', marketId:2, extension: 'ST3Y12HJYP2NMNAFHWBPM2CMYDHYXME1F46VC5SPJ.bme023-2-market-scalar'}, update: {$set: {processed: true }}, upsert: false, new: true, fields: {}})

db.daoEventCollection.updateMany({event: 'create-market',extension: 'ST3Y12HJYP2NMNAFHWBPM2CMYDHYXME1F46VC5SPJ.bme023-0-market-scalar'},{$set: {'unhashedData.processed': true}})

db.daoEventCollection.updateMany({event: 'create-market','unhashedData.name':'Will Paul Biya officially announce his candidacy for the October 2025 Cameroon presidential election by August 20, 2025?'},{$set: {'unhashedData.forumMessageId': '66b40856-470c-4ed6-8925-8047b08c782b'}})

db.daoEventCollection.updateMany({event: 'create-market','unhashedData.name':'Will South Africa announce a new solar power subsidy program by August 21, 2025?'},{$set: {'unhashedData.processed': true}})

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

If you want maximum performance:
db.events.createIndex({ voter: 1, event: 1, marketId: 1, extension: 1 })
db.events.createIndex({ claimer: 1, event: 1, marketId: 1, extension: 1 })
db.events.createIndex({ event: 1, marketId: 1, extension: 1 })

## Backups

mongodump --uri "mongodb://dockerdev1:OLrs4ve3wT3ypQSK@clusterbm0-shard-00-00.ci36c.mongodb.net:27017,clusterbm0-shard-00-01.ci36c.mongodb.net:27017,clusterbm0-shard-00-02.ci36c.mongodb.net:27017/?replicaSet=atlas-no3ycr-shard-0&ssl=true&authSource=admin&retryWrites=true&w=majority&appName=ClusterBM0" --out ~/hubgit/backup

## Rollover

```
# Testnet

db.marketCollection.deleteMany()
db.daoEventCollection.deleteMany({})
db.marketGatingCollection.deleteMany({})

# Testnet

db.marketGatingCollection.insertOne( { gateType : 'create-market','merkleRootInput': ["ST3Y12HJYP2NMNAFHWBPM2CMYDHYXME1F46VC5SPJ", "ST31WZCAZB0B1Q6WGC6ZYCWRGCBRP3KC7HJQ2QQ1K", "ST167Z6WFHMV0FZKFCRNWZ33WTB0DFBCW9M1FW3AY", "ST105HCS1RTR7D61EZET8CWNEF24ENEN3V6ARBYBJ","ST3SJD6KV86N90W0MREGRTM1GWXN8Z91PF6W0BQKM", "STEZD95XQ194X67C1QJW4PHKDG8F5D66ZCYFX27A"]})

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



```

# mainnet

```
db.marketCategoriesCollection.insertMany([
{ name : 'crypto', information: '', displayName: 'Crypto', active: true},
{ name : 'Financial', information: '', displayName: 'Financial', active: false},
{ name : 'sports', information: '', displayName: 'Sports', active: false},
{ name : 'politics', information: '', displayName: 'Politics', active: false},
{ name : 'economy', information: '', displayName: 'Economy', active: false},
{ name : 'culture', information: '', displayName: 'Culture', active: false},
{ name : 'music', information: '', displayName: 'Music', active: false},
{ name : 'nsfw', information: '', displayName: 'NSFW', active: false},
{ name : 'banter', information: '', displayName: 'Banter', active: false}])



db.marketGatingCollection.insertOne( { gateType : 'create-market','merkleRootInput': ["SP3Y12HJYP2NMNAFHWBPM2CMYDHYXME1F45GASVBG", "SP31WZCAZB0B1Q6WGC6ZYCWRGCBRP3KC7HG8A0XWC", "SP2PT3VET633B5JR9KM8SS7JD0F089M9AAX5KFEP7", "SPEZD95XQ194X67C1QJW4PHKDG8F5D66ZCT8BY29"]})

```
