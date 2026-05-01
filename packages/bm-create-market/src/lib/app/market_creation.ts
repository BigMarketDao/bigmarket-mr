import { Profanity } from "@2toad/profanity";
import {
  getStxAddress,
  showTxModal,
  watchTransaction,
} from "@bigmarket/bm-common";
import type {
  AppConfig,
  DaoConfig,
  DaoOverview,
  Domain,
  MarketCategoricalOption,
  StoredOpinionPoll,
  TokenPermissionEvent,
  TxResult,
} from "@bigmarket/bm-types";
import {
  CREATE_MARKET_TIER,
  getBnsNameFromAddress,
  getGateKeeper,
  getMarketToken,
  getTierBalance,
  MESSAGE_BOARD_ID,
  postCreatePollMessage,
} from "@bigmarket/bm-utilities";
import { createThread } from "@bigmarket/sip18-forum";
import type {
  AuthenticatedForumContent,
  ForumMessage,
  LinkedAccount,
} from "@bigmarket/sip18-forum-types";
import { isContiguous } from "./validation";
import { stacks } from "@bigmarket/sdk";
import { requestForumSignature } from "@bigmarket/sdk/src/chains/stacks/utils/signatures";

export function getDefaultStacksLinkedAccount(
  stxAddress: string,
  bnsName: string,
): LinkedAccount {
  const linkedAccount: LinkedAccount = {
    source: "stacks",
    identifier: stxAddress,
    verified: true,
    preferred: true,
    displayName: bnsName,
  };
  return linkedAccount;
}

export async function getSignature(
  appConfig: AppConfig,
  daoConfig: DaoConfig,
  template: StoredOpinionPoll,
  daoOverview: DaoOverview,
): Promise<{ dataHash: string; poll: StoredOpinionPoll }> {
  // Check if sessionStore is loaded before proceeding with transaction submission
  if (!daoOverview.contractData) {
    console.error("SessionStore not loaded");
    throw new Error(
      "Application data not loaded. Please refresh the page and try again.",
    );
  }

  // Sync template data to examplePoll before validation
  const profanity = new Profanity();
  template.description = profanity.censor(template.description);
  template.criterionSources.criteria = profanity.censor(
    template.criterionSources.criteria,
  );
  template.name = profanity.censor(template.name);
  template.logo = profanity.censor(template.logo);

  if (!template.token) {
    throw new Error(
      "Application data not loaded. Please refresh the page and try again.",
    );
  }

  const maxFee = daoOverview.contractData.marketFeeBipsMax || 1000;
  if (template.marketFee > maxFee) {
    throw new Error("Market fee cannot exceed " + maxFee / 100 + "% ");
  }

  if (!template.criterionSources) {
    throw new Error("Please enter a criteria for resolution");
  }
  if (template.criterionDays) {
    if (!template.criterionSources.criteria) {
      throw new Error("Please enter a criteria for end times");
    }
    if (
      !template.criterionSources.sources ||
      template.criterionSources.sources.length === 0
    ) {
      throw new Error("Please enter web references for market resolution");
    }
  }
  const bnsName =
    (await getBnsNameFromAddress(appConfig.VITE_STACKS_API, getStxAddress())) ||
    "";
  const forumContent: ForumMessage = {
    messageBoardId: MESSAGE_BOARD_ID,
    parentId: MESSAGE_BOARD_ID,
    level: 1,
    messageId: crypto.randomUUID(),
    title: template.name,
    content: template.description,
    linkedAccounts: [getDefaultStacksLinkedAccount(getStxAddress(), bnsName)],
    created: template.createdAt,
  };

  // const chainId =
  //   appConfig.VITE_NETWORK === "mainnet" ? ChainId.Mainnet : ChainId.Testnet;
  // const domain = tupleCV({
  //   name: stringAsciiCV(appConfig.VITE_PUBLIC_APP_NAME),
  //   version: stringAsciiCV(appConfig.VITE_PUBLIC_APP_VERSION),
  //   "chain-id": uintCV(chainId),
  // });
  // console.log("forumContent: domain: " + domain);

  // const pollMessage = forumMessageToTupleCV(forumContent);
  const domain: Domain = {
    network: appConfig.VITE_NETWORK,
    appName: appConfig.VITE_PUBLIC_APP_NAME,
    appVersion: appConfig.VITE_PUBLIC_APP_VERSION,
  };
  const dataHash = stacks.dataHashSip18Forum(domain, forumContent);
  // console.log("forumContent: ", forumContent);
  // console.log("forumContent: pollMessage: ", pollMessage);
  // console.log("forumContent: dataHash: " + dataHash);
  // const response = await requestSignature(getConfig(), pollMessage);

  const response = await requestForumSignature(domain, forumContent);
  if (!response) {
    throw new Error("Failed to request forum signature");
  }
  const { signature, publicKey } = response;
  let poll: StoredOpinionPoll = {
    ...template,
    objectHash: dataHash,
    processed: false,
    signature: signature,
    publicKey: publicKey,
    merkelRoot: undefined,
    contractIds: [],
    featured: true,
    forumMessageId: forumContent.messageId,
  };
  console.log("forumContent: poll: ", poll);
  console.log(
    "forumContent: appConfig.VITE_FORUM_API: " + appConfig.VITE_FORUM_API,
  );
  console.log(
    "forumContent: forumContent.messageId: " + forumContent.messageId,
  );
  console.log("forumContent: response!.signature: " + response!.signature);
  console.log("forumContent: response!.publicKey: " + response!.publicKey);
  console.log("forumContent: dataHash: " + dataHash);
  let valid = stacks.verifyForumSignature(
    domain,
    forumContent,
    publicKey,
    signature,
  );

  try {
    const threads = (await createThread(
      appConfig.VITE_FORUM_API,
      forumContent.messageId,
      {
        forumContent,
        auth: {
          signature: response!.signature,
          publicKey: response!.publicKey,
        },
      },
    )) as unknown as Array<AuthenticatedForumContent>;
  } catch (err: any) {
    console.log(err);
    if (!valid) {
      console.warn("Signature verification did not pass");
      throw new Error("invlaid sig");
    }
    throw new Error(err);
  }

  const result = await postCreatePollMessage(
    appConfig.VITE_BIGMARKET_API,
    poll,
  );

  if (typeof result === "string") {
    console.error("Error from postCreatePollMessage:", result);
    throw new Error(result);
  }
  return { dataHash, poll };
}

export async function confirmPoll(
  appConfig: AppConfig,
  daoConfig: DaoConfig,
  dataHash: string,
  template: StoredOpinionPoll,
  daoOverview: DaoOverview,
  tokenEvent: TokenPermissionEvent,
): Promise<TxResult | null> {
  if (!daoOverview.contractData) {
    throw new Error(
      "Application data not loaded. Please refresh the page and try again.",
    );
  }
  // Set waiting state for transaction
  let contractName = daoConfig.VITE_DAO_MARKET_PREDICTING;
  if (template.marketType === 1) {
    if (
      !template.marketTypeDataCategorical ||
      template.marketTypeDataCategorical.length < 1 ||
      template.marketTypeDataCategorical.length > 9
    ) {
      throw new Error("Categorical markets must have at least three options");
    }
  } else if (template.marketType === 2) {
    if (!template.priceFeedId) {
      throw new Error("Price feed required");
    }
    if (
      !template.marketTypeDataScalar ||
      !isContiguous(template.marketTypeDataScalar!)
    ) {
      throw new Error(
        "Contiguous values only - the min must be the max of the previous",
      );
    }
    contractName = daoConfig.VITE_DAO_MARKET_SCALAR;
  }
  const sender = getStxAddress();
  const tierBalance = await getTierBalance(
    appConfig.VITE_BIGMARKET_API,
    CREATE_MARKET_TIER,
    sender,
  );

  const creationGated = await stacks.canCreateMarket(
    appConfig.VITE_BIGMARKET_API,
    getStxAddress(),
  );
  const gateKeeper = await getGateKeeper(appConfig.VITE_BIGMARKET_API);
  const marketTypeData =
    template.marketType === 2
      ? template.priceFeedId!
      : template.marketTypeDataCategorical!;

  const response = await stacks
    .createMarketsClient(daoConfig)
    .createMarket(
      contractName,
      gateKeeper,
      creationGated,
      tokenEvent,
      template.treasury,
      sender,
      template.marketFee,
      dataHash,
      template.liquidity,
      marketTypeData,
      template.criterionDays.duration,
      template.criterionDays.coolDown,
      tierBalance || 0,
    );

  if (response.success && response?.txid) {
    showTxModal(response.txid);
    watchTransaction(
      appConfig.VITE_BIGMARKET_API,
      appConfig.VITE_STACKS_API,
      `${daoConfig.VITE_DAO_DEPLOYER}.${contractName}`,
      response.txid,
    );
  } else {
    showTxModal("Unable to process right now");
  }
  return response;
}

// f93c079d487c2e16a4579114f7665e03198f12d82539383707bf7bf8f2ab34a6
