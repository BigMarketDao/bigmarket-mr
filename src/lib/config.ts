import { ConfigI } from "../types/local_types";
import process from "process";

let CONFIG = {} as ConfigI;
export let BASE_URL: string;

export function printConfig() {
  console.log(
    "== " +
      process.env.NODE_ENV +
      " =========================================================="
  );
  console.log("mongoDbUrl = " + CONFIG.mongoDbUrl);
  console.log("mongoDbName = " + CONFIG.mongoDbName);
  console.log("mongoUser = " + CONFIG.mongoUser);
  console.log("mongoPwd = " + CONFIG.mongoPwd);
  console.log("host = " + CONFIG.host + ":" + CONFIG.port);
  console.log("suiApi = " + CONFIG.suiApi);
  console.log("network = " + CONFIG.network);
  console.log("publicAppName = " + CONFIG.publicAppName);
  console.log("publicAppVersion = " + CONFIG.publicAppVersion);
}

export function setConfigOnStart() {
  const network = process.env.NODE_ENV;

  CONFIG.host = process.env[network + "_sui_host"] || "";
  CONFIG.port = Number(process.env[network + "_sui_port"]) || 6060;
  CONFIG.host = process.env[network + "_sui_host"] || "";

  CONFIG.mongoDbUrl = process.env[network + "_sui_mongoDbUrl"] || "";
  CONFIG.mongoDbName = process.env[network + "_sui_mongoDbName"] || "";
  CONFIG.mongoUser = process.env[network + "_sui_mongoUser"] || "";
  CONFIG.mongoPwd = process.env[network + "_sui_mongoPwd"] || "";

  CONFIG.network = process.env[network + "_sui_network"] || "";
  CONFIG.suiApi = process.env[network + "_sui_suiApi"] || "";
  CONFIG.publicAppName = process.env[network + "_sui_publicAppName"] || "";
  CONFIG.publicAppVersion =
    process.env[network + "_sui_publicAppVersion"] || "";
}

export function getConfig() {
  return CONFIG;
}

export function isDev() {
  const environ = process.env.NODE_ENV;
  return (
    !environ ||
    environ === "test" ||
    environ === "development" ||
    environ === "dev"
  );
}
