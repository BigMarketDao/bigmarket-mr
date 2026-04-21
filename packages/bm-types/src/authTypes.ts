import type { SignatureData } from "./signatureTypes.js";

export const ADMIN_MESSAGE =
  "please sign this message to authorise DAO management task.";
export type BaseAdminMessage = {
  message: string;
  timestamp: number;
  admin: string;
};
export type Auth = {
  message: BaseAdminMessage;
  signature: SignatureData;
};
export type Domain = {
  network: string;
  appName: string;
  appVersion: string;
};
