// check total BIG claim per epoch - must equal reward-per-epoch
db.daoEventCollection.aggregate([
{
$match: {
      event: "big-claim"
    }
  },
  {
    $addFields: {
      startEpoch: {
        $add: [
          { $subtract: ["$claimEpoch", "$epochsPaid"] },
          1
        ]
      },
      sharePerEpoch: {
        $divide: ["$share", "$epochsPaid"]
      }
    }
  },
  {
    $addFields: {
      paidEpochs: {
        $range: [
          "$startEpoch",
{ $add: ["$claimEpoch", 1] }
]
}
}
},
{ $unwind: "$paidEpochs" },
{
$group: {
      _id: "$paidEpochs",
totalClaimed: { $sum: "$sharePerEpoch" },
claimCount: { $sum: 1 },
      users: { $addToSet: "$user" },
txs: { $addToSet: "$txId" }
}
},
{
$project: {
      _id: 0,
      epoch: "$\_id",
totalClaimed: 1,
totalClaimedBIG: {
$divide: ["$totalClaimed", 1000000]
},
claimCount: 1,
userCount: { $size: "$users" },
txCount: { $size: "$txs" }
}
},
{ $sort: { epoch: 1 } }
])

// check total BIG claim per epoch - must equal reward-per-epoch
db.daoEventCollection.aggregate([
{ $match: { event: "big-claim" } },
  {
    $group: {
      _id: "$claimEpoch",
totalClaimed: { $sum: "$share" },
claimCount: { $sum: 1 },
      users: { $addToSet: "$user" }
}
},
{
$project: {
      _id: 0,
      epoch: "$\_id",
totalClaimed: 1,
totalClaimedBIG: { $divide: ["$totalClaimed", 1000000] },
claimCount: 1,
userCount: { $size: "$users" }
}
},
{ $sort: { epoch: 1 } }
])
