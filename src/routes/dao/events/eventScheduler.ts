import cron from "node-cron";
import { getConfig } from "../../../lib/config";
import { fetchExtensions, readDaoEvents } from "./dao_events_helper";
import { daoEventCollection } from "../../../lib/data/db_models";
import { readDaoExtensionEvents } from "./dao_events_extension_helper";

// 30 mins past every second hour: 30 */2 * * *'
export const initScanDaoEventsJob = cron.schedule(
  "30 */2 * * *",
  async (fireDate) => {
    console.log("Running: initScanDaoEventsJob at: " + fireDate);
    const distinctDaoContracts = await daoEventCollection.distinct(
      "daoContract"
    );

    for (const dao of distinctDaoContracts) {
      try {
        await readDaoEvents(true, `${dao}`);
        await readDaoExtensionEvents(true, dao);
      } catch (err) {
        console.log("Error running: ecosystem-dao: ", err);
      }
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
