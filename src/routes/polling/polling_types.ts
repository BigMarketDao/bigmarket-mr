import { ObjectId } from "mongodb";

export type OpinionPoll = {
  _id: ObjectId;
  hash?: string;
  createdAt: number;
  startBitcoinHeight: number;
  stopBitcoinHeight: number;
  name: string;
  description: string;
  admin: string;
  social: {
    twitter: {
      projectHandle?: string;
    };
    discord: {
      serverId?: string;
    };
    website: {
      url?: string;
    };
  };
};
