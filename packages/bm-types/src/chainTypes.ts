export type ChainInfo = {
  stacks: StacksInfo;
};

export type StacksInfo = {
  burn_block_height: number;
  stacks_tip_height?: number;
  server_version?: string;
  network_id?: number;
};
