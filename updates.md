# Setup Data

## Set Current Proposal

Nakamoto onwards voting addresses - note these are generic yes/no addresses and can
be reused for different ;

db.gatingCollection.insertOne( { gateType : 'create-market','merkleRootInput': ["ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"]})

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
