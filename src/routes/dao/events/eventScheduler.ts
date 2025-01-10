import cron from "node-cron";
import { readDaoEvents } from "./dao_events_helper";
import { daoEventCollection } from "../../../lib/data/db_models";
import { readDaoExtensionEvents } from "./dao_events_extension_helper";

// 30 mins past every second hour: 30 */2 * * *'
export const initScanDaoEventsJob = cron.schedule(
  "1 * * * *",
  async (fireDate) => {
    console.log("Running: initScanDaoEventsJob at: " + fireDate);
    try {
      const distinctDaoContracts = await daoEventCollection
        .aggregate([
          { $group: { _id: "$daoContract" } }, // Group by `daoContract`
          { $project: { _id: 0, daoContract: "$_id" } }, // Extract `daoContract`
        ])
        .toArray();
      console.log("Running: distinctDaoContracts: ", distinctDaoContracts);

      for (const dao of distinctDaoContracts) {
        const docContract = dao.daoContract;
        console.log("Running: dao: " + docContract);
        try {
          await readDaoEvents(false, docContract);
        } catch (err) {
          console.log("Error running: ecosystem-dao: ", err);
        }
        await readDaoExtensionEvents(false, docContract);
      }
    } catch (err: any) {
      console.log("initScanDaoEventsJob: ", err);
    }
  }
);

// // runs at 01:01 AM every Sunday'
// export const initScanVotingEventsJob = cron.schedule(
//   "1 1 * * 0",
//   async (fireDate) => {
//     console.log("Running: initScanVotingEventsJob at: " + fireDate);
//     try {
//       await scanVoting(true);
//     } catch (err) {
//       console.log("Error running: ede007-snapshot-proposal-voting: ", err);
//     }
//   }
// );
