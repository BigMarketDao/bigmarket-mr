import express from "express";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import morgan from "morgan";
import cors from "cors";
import { getConfig, printConfig, setConfigOnStart } from "./lib/config";
import { WebSocketServer } from "ws";
import { jwtRoutes } from "./routes/jwt/jwtRoutes";
import { connect } from "./lib/data/db_models";

if (process.env.NODE_ENV === "development") {
  dotenv.config();
}

const app = express();
const port = process.env.PORT || 3020;
app.use(bodyParser.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "10mb" }));
app.use(express.json());

app.use(morgan("tiny"));
app.use(express.static("public"));
app.use(cors());
setConfigOnStart();
printConfig();

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

app.use("/bigmarket-api/jwt/v1", jwtRoutes);

console.log(`\n\nExpress is listening at http://localhost:${getConfig().port}`);
console.log("Startup Environment: ", process.env.NODE_ENV);
console.log("using local db = " + getConfig().mongoDbName);

async function connectToMongoCloud() {
  printConfig();
  await connect();
  console.log("Connected to MongoDB!");
  const server = app.listen(getConfig().port, () => {
    console.log("Server listening!");
    return;
  });

  const wss = new WebSocketServer({ server });

  wss.on("connection", function connection(ws: any) {
    ws.on("message", function incoming(message: any) {
      ws.send("Got your new rates : " + message);
    });
  });
}

connectToMongoCloud();
