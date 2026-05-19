#!/usr/bin/env node
/**
 * Compute merkle root for BigMarket market-creation gating (testnet allowlist).
 *
 * Usage:
 *   node scripts/generate-market-gating-root.mjs [extra-st-address ...]
 *
 * Default list matches testnet bootstrap (bdp000-bootstrap.clar) plus any extras.
 */
import { c32addressDecode } from 'c32check';
import { hexToBytes } from '@stacks/common';
import { sha256 } from '@noble/hashes/sha256';
import { MerkleTree } from 'merkletreejs';

const DEFAULT_ALLOWLIST = [
  'ST30Q4WJYHGMYEE1CTGQ334R9M7KQ8ETVQ9NB134T',
  'ST2T1JM78TXGP1PNMEGMPARAA91MKYJPNETFERNAN',
  'ST167Z6WFHMV0FZKFCRNWZ33WTB0DFBCW9M1FW3AY',
  'ST105HCS1RTR7D61EZET8CWNEF24ENEN3V6ARBYBJ',
  'ST3SJD6KV86N90W0MREGRTM1GWXN8Z91PF6W0BQKM',
  'STEZD95XQ194X67C1QJW4PHKDG8F5D66ZCYFX27A',
];

function leafForAddress(address) {
  const [, hash160] = c32addressDecode(address);
  return sha256(hexToBytes(hash160));
}

function merkleRoot(addresses) {
  const leaves = addresses.map(leafForAddress);
  const tree = new MerkleTree(leaves, sha256);
  return tree.getRoot().toString('hex');
}

const extras = process.argv.slice(2);
const allowlist = [...new Set([...DEFAULT_ALLOWLIST, ...extras])];
const root = merkleRoot(allowlist);

console.log('Allowlist:');
for (const a of allowlist) console.log(`  ${a}`);
console.log('');
console.log(`Merkle root: 0x${root}`);
console.log('');
console.log('Clarity buffer for proposal:');
console.log(`0x${root}`);
