import express from "express";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import morgan from "morgan";
import cors from "cors";
import { getConfig, printConfig, setConfigOnStart } from "./lib/config";
import { WebSocketServer } from "ws";
import { jwtRoutes } from "./routes/jwt/jwtRoutes";
import { pollingRoutes } from "./routes/polling/pollingRoutes";
import { connect } from "./lib/data/db_models";
import { daoEventRoutes } from "./routes/dao/events/daoEventsRoutes";
import { daoProposalRoutes } from "./routes/dao/proposals/daoProposalRoutes";
import { daoSip18VotingRoutes } from "./routes/dao/sip18-voting/daoSip18VotingRoutes";
import { initScanDaoEventsJob } from "./routes/dao/events/eventScheduler";
import { setDaoConfigOnStart } from "./lib/config_dao";

if (process.env.NODE_ENV === "development") {
  dotenv.config();
}

const app = express();
const port = process.env.PORT || 3020;
app.use(bodyParser.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "10mb" }));
app.use(express.json());
app.use(
  cors({
    origin: [
      "http://localhost:8060",
      "http://localhost:8080",
      "https://brightblock.org",
    ],
  })
);

app.use(morgan("tiny"));
app.use(express.static("public"));
app.use(cors());
setConfigOnStart();
setDaoConfigOnStart();

app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.use(bodyParser.json());
app.use((req, res, next) => {
  if (
    req.method === "POST" ||
    req.method === "PUT" ||
    req.method === "DELETE"
  ) {
    next();
  } else {
    next();
  }
});

app.use("/bigmarket-api/jwt", jwtRoutes);
app.use("/bigmarket-api/polling", pollingRoutes);
app.use("/bigmarket-api/dao/events", daoEventRoutes);
app.use("/bigmarket-api/dao/proposals", daoProposalRoutes);
app.use("/bigmarket-api/dao/sip18-voting", daoSip18VotingRoutes);

console.log(`\n\nExpress is listening at http://localhost:${getConfig().port}`);
console.log("Startup Environment: ", process.env.NODE_ENV);
console.log("using local db = " + getConfig().mongoDbName);
console.log("publicAppName = " + getConfig().publicAppName);
console.log("publicAppVersion = " + getConfig().publicAppVersion);

async function connectToMongoCloud() {
  printConfig();
  await connect();
  console.log("Connected to MongoDB!");
  initScanDaoEventsJob.start();
  const server = app.listen(getConfig().port, () => {
    console.log("Server listening!");
    return;
  });

  const wss = new WebSocketServer({ server });
  // initScanVotingEventsJob.start();

  wss.on("connection", function connection(ws: any) {
    ws.on("message", function incoming(message: any) {
      ws.send("Got your new rates : " + message);
    });
  });
}

connectToMongoCloud();
