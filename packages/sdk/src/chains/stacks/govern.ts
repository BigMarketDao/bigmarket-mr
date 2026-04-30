import { type DaoConfig } from "@bigmarket/bm-types";
import { callContract } from "./tx.js";
import {
  boolCV,
  bufferCV,
  Cl,
  type ClarityValue,
  contractPrincipalCV,
  listCV,
  noneCV,
  Pc,
  type PostCondition,
  principalCV,
  someCV,
  stringAsciiCV,
  tupleCV,
  uintCV,
} from "@stacks/transactions";
import { hexToBytes } from "@stacks/common";
import { StoredVoteMessage } from "@bigmarket/bm-types";

function votesToClarityValue(
  proposal: string,
  votes: StoredVoteMessage[],
  reclaimProposal?: string,
) {
  const proposalCV = contractPrincipalCV(
    proposal.split(".")[0],
    proposal.split(".")[1],
  );

  const votesCV = listCV(
    votes.map((vote) =>
      tupleCV({
        message: tupleCV({
          attestation: stringAsciiCV(vote.attestation),
          proposal: principalCV(proposal),
          timestamp: uintCV(vote.timestamp),
          vote: boolCV(vote.vote),
          voter: principalCV(vote.voter),
          amount: uintCV(vote.voting_power),
          "reclaim-proposal": reclaimProposal
            ? someCV(
                contractPrincipalCV(
                  reclaimProposal.split(".")[0],
                  reclaimProposal.split(".")[1],
                ),
              )
            : noneCV(),
        }),
        signature: bufferCV(hexToBytes(vote.signature)),
      }),
    ),
  );

  return votesCV;
}

export function createDaoGovernanceClient(daoConfig: DaoConfig) {
  const deployer = daoConfig.VITE_DAO_DEPLOYER;
  const call = (contract: string, fn: string, args: ClarityValue[]) =>
    callContract(deployer, contract, daoConfig.VITE_NETWORK, fn, args);

  return {
    construct() {
      const bootstrap = Cl.contractPrincipal(
        daoConfig.VITE_DAO_DEPLOYER,
        "bdp000-bootstrap",
      );

      return call(daoConfig.VITE_DAO, "construct", [bootstrap]);
    },

    conclude(votingContractName: string, proposalContract: string) {
      const [addr, name] = proposalContract.split(".");
      return callContract(
        deployer,
        votingContractName,
        daoConfig.VITE_NETWORK,
        "conclude",
        [Cl.contractPrincipal(addr, name)],
        [],
        "allow",
      );
    },

    async reclaimVotes(
      extensionContract: string,
      proposalContract: string,
      senderAddress: string,
      microAmount: number,
      extraPostConditions: PostCondition[] = [],
      isDeployer = false,
    ) {
      const [extAddr, extName] = extensionContract.split(".");
      const [propAddr, propName] = proposalContract.split(".");
      const formattedToken =
        `${deployer}.${daoConfig.VITE_DAO_GOVERNANCE_TOKEN}` as `${string}.${string}`;
      const postConditions: PostCondition[] = isDeployer
        ? []
        : [
            Pc.principal(`${deployer}.${daoConfig.VITE_DAO_GOVERNANCE_TOKEN}`)
              .willSendEq(microAmount)
              .ft(formattedToken, "bmg-token"),
            Pc.principal(senderAddress)
              .willSendEq(microAmount)
              .ft(formattedToken, "bmg-token-locked"),
            ...extraPostConditions,
          ];
      return callContract(
        extAddr,
        extName,
        daoConfig.VITE_NETWORK,
        "reclaim-votes",
        [Cl.some(Cl.contractPrincipal(propAddr, propName))],
        postConditions,
        isDeployer ? "allow" : "deny",
      );
    },

    reclaimMarketVotes(marketContract: string, marketId: number) {
      const [addr, name] = marketContract.split(".");
      return call(daoConfig.VITE_DAO_MARKET_VOTING, "reclaim-votes", [
        Cl.contractPrincipal(addr, name),
        Cl.some(Cl.uint(marketId)),
      ]);
    },

    batchVote(
      extensionContract: string,
      proposal: string,
      votes: StoredVoteMessage[],
      reclaimProposal?: string,
    ) {
      const [addr, name] = extensionContract.split(".");
      const votesCV = votesToClarityValue(proposal, votes, reclaimProposal);
      return callContract(
        addr,
        name,
        daoConfig.VITE_NETWORK,
        "batch-vote",
        [votesCV],
        [],
        "deny",
      );
    },

    initializeIdo() {
      return call(daoConfig.VITE_DAO_TOKEN_SALE, "initialize-ido", []);
    },

    buyIdoTokens(senderAddress: string, microStxAmount: number) {
      return callContract(
        deployer,
        daoConfig.VITE_DAO_TOKEN_SALE,
        daoConfig.VITE_NETWORK,
        "buy-ido-tokens",
        [Cl.uint(microStxAmount)],
        [Pc.principal(senderAddress).willSendEq(microStxAmount).ustx()],
        "deny",
      );
    },

    contributeLiquidity(
      senderAddress: string,
      microStxAmount: number,
      extraPostConditions: PostCondition[] = [],
    ) {
      return callContract(
        deployer,
        daoConfig.VITE_DAO_LIQUIDITY_CONTRIBUTION,
        daoConfig.VITE_NETWORK,
        "contribute-stx",
        [Cl.uint(microStxAmount)],
        [
          Pc.principal(senderAddress).willSendEq(microStxAmount).ustx(),
          ...extraPostConditions,
        ],
        "deny",
      );
    },

    /** 3-arg fund (fixed legacy submission contract) */
    fundProposalSimple(
      submissionContract: string,
      proposalContract: string,
      amount: number,
      customMajority: number,
      senderAddress: string,
    ) {
      const [subAddr, subName] = submissionContract.split(".");
      const [propAddr, propName] = proposalContract.split(".");
      return callContract(
        subAddr,
        subName,
        daoConfig.VITE_NETWORK,
        "fund",
        [
          Cl.contractPrincipal(propAddr, propName),
          Cl.uint(amount),
          Cl.some(Cl.uint(customMajority)),
        ],
        [Pc.principal(senderAddress).willSendLte(amount).ustx()],
        "deny",
      );
    },

    /** 5-arg fund (flexible submission contract) */
    fundProposal(
      submissionContract: string,
      proposalContract: string,
      amount: number,
      startDelay: number,
      duration: number,
      customMajority: number,
      senderAddress: string,
    ) {
      const [subAddr, subName] = submissionContract.split(".");
      const [propAddr, propName] = proposalContract.split(".");
      return callContract(
        subAddr,
        subName,
        daoConfig.VITE_NETWORK,
        "fund",
        [
          Cl.contractPrincipal(propAddr, propName),
          Cl.uint(startDelay),
          Cl.uint(duration),
          Cl.uint(amount),
          Cl.some(Cl.uint(customMajority)),
        ],
        [Pc.principal(senderAddress).willSendLte(amount).ustx()],
        "deny",
      );
    },

    corePropose(
      submissionContract: string,
      proposalContract: string,
      proposalStart: number,
      duration: number,
      customMajority: number,
    ) {
      const [subAddr, subName] = submissionContract.split(".");
      const [propAddr, propName] = proposalContract.split(".");
      return callContract(
        subAddr,
        subName,
        daoConfig.VITE_NETWORK,
        "core-propose",
        [
          Cl.contractPrincipal(propAddr, propName),
          Cl.uint(proposalStart),
          Cl.uint(duration),
          Cl.some(Cl.uint(customMajority)),
        ],
        [],
        "deny",
      );
    },

    vote(
      votingContractName: string,
      proposalContract: string,
      microAmount: number,
      vfor: boolean,
      senderAddress: string,
    ) {
      const [propAddr, propName] = proposalContract.split(".");
      const proposalCV = Cl.contractPrincipal(propAddr, propName);
      const amountCV = Cl.uint(microAmount);
      const forCV = Cl.bool(vfor);
      const isStandardVoting =
        votingContractName === "bme001-0-proposal-voting";
      const functionArgs = isStandardVoting
        ? [amountCV, forCV, proposalCV, Cl.none()]
        : [amountCV, forCV, proposalCV];
      const formattedToken =
        `${deployer}.${daoConfig.VITE_DAO_GOVERNANCE_TOKEN}` as `${string}.${string}`;
      return callContract(
        deployer,
        votingContractName,
        daoConfig.VITE_NETWORK,
        "vote",
        functionArgs,
        [
          Pc.principal(senderAddress)
            .willSendEq(microAmount)
            .ft(formattedToken, "bmg-token"),
        ],
        "deny",
      );
    },
  };
}
