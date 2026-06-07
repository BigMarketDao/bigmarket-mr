#!/usr/bin/env bash
# Unstick a frozen Clarinet devnet (Nakamoto relayer / bitcoin-miner deadlock).
# Mines regtest BTC blocks via RPC so Stacks can confirm pending block-commits.
#
# Prereq: clarinet devnet start is already running.
# Usage:  ./scripts/unstick-devnet.sh [blocks]
#         ./scripts/unstick-devnet.sh 3

set -euo pipefail

BLOCKS="${1:-2}"
BTC_RPC="http://127.0.0.1:18443"
BTC_USER="devnet"
BTC_PASS="devnet"
STACKS_RPC="http://localhost:20443"
# deployer btc_address from contracts/stacks/bigmarket-dao/settings/Devnet.toml
BTC_MINE_ADDR="${BTC_MINE_ADDR:-mqVnk6NPRdhntvfm4hh9vvjiRkFDUuSYsH}"

btc_rpc() {
  curl -sf --user "${BTC_USER}:${BTC_PASS}" \
    -H 'content-type: text/plain;' \
    -d "$1" \
    "${BTC_RPC}/"
}

stacks_heights() {
  curl -sf "${STACKS_RPC}/v2/info" \
    | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['burn_block_height'], d['stacks_tip_height'])"
}

echo "==> Devnet unstick: mining ${BLOCKS} bitcoin block(s)"
echo "    BTC RPC:    ${BTC_RPC}"
echo "    Stacks RPC: ${STACKS_RPC}"
echo "    Mine addr:  ${BTC_MINE_ADDR}"
echo

if ! curl -sf "${STACKS_RPC}/v2/info" >/dev/null 2>&1; then
  echo "ERROR: Stacks node not reachable at ${STACKS_RPC}" >&2
  echo "Start devnet first: cd contracts/stacks/bigmarket-dao && clarinet devnet start" >&2
  exit 1
fi

if ! btc_rpc '{"jsonrpc":"1.0","id":"1","method":"getblockcount","params":[]}' >/dev/null 2>&1; then
  echo "ERROR: Bitcoin node not reachable at ${BTC_RPC}" >&2
  exit 1
fi

read -r BURN_BEFORE STACKS_BEFORE < <(stacks_heights)
BTC_BEFORE="$(btc_rpc '{"jsonrpc":"1.0","id":"1","method":"getblockcount","params":[]}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['result'])")"

echo "Before: bitcoin=${BTC_BEFORE}  burn=${BURN_BEFORE}  stacks=${STACKS_BEFORE}"

RESULT="$(btc_rpc "{\"jsonrpc\":\"1.0\",\"id\":\"1\",\"method\":\"generatetoaddress\",\"params\":[${BLOCKS},\"${BTC_MINE_ADDR}\"]}")"
if echo "${RESULT}" | python3 -c "import sys,json; d=json.load(sys.stdin); sys.exit(0 if d.get('result') else 1)" 2>/dev/null; then
  HASHES="$(echo "${RESULT}" | python3 -c "import sys,json; print(len(json.load(sys.stdin)['result']))")"
  echo "Mined ${HASHES} block(s)."
else
  echo "ERROR: generatetoaddress failed: ${RESULT}" >&2
  exit 1
fi

# Give the relayer a moment to process new burn blocks.
sleep 5

read -r BURN_AFTER STACKS_AFTER < <(stacks_heights)
BTC_AFTER="$(btc_rpc '{"jsonrpc":"1.0","id":"1","method":"getblockcount","params":[]}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['result'])")"

echo "After:  bitcoin=${BTC_AFTER}  burn=${BURN_AFTER}  stacks=${STACKS_AFTER}"

if [[ "${BURN_AFTER}" -le "${BURN_BEFORE}" && "${STACKS_AFTER}" -le "${STACKS_BEFORE}" ]]; then
  echo
  echo "Heights did not advance. Try more blocks:"
  echo "  ./scripts/unstick-devnet.sh 5"
  echo "Or restart devnet:"
  echo "  cd contracts/stacks/bigmarket-dao && clarinet devnet start --from-genesis"
  exit 1
fi

echo
echo "Chain is moving again. Auto-mining should resume within a few seconds."
echo "Watch: curl -s ${STACKS_RPC}/v2/info | python3 -m json.tool"
