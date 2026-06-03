;; Title: BME050 Cross-Chain User Funds Vault
;; Version: 0.4.0
;;
;; Synopsis:
;; Chain-agnostic vault holding user funds from any source chain.
;; User identity: (controller-chain buff 4, controller-address buff 32).
;; Funds are addressed by a 4-tuple key
;;   (controller-chain, controller-address, mapped-address, token)
;; where mapped-address is the Stacks principal that received the bridged
;; tokens (a relayer-derived ephemeral address for cross-chain users, or the
;; user's own STX principal for native Stacks deposits).
;;
;; The vault -- not tx-sender -- custodies the SIP-010 balance, so withdrawals
;; MUST transfer with `as-contract?` and MUST be authorised by a signature
;; produced by the controller key, not by whoever happens to be tx-sender.
;;
;; Authorisation uses the BigMarket Protocol Message v1 (BMP1) -- a 256-byte
;; fixed-length structured message that is signed off-chain by the user. The
;; same envelope covers withdraw / buy-shares / sell-shares / claim-winnings;
;; only the per-opcode body slots differ.
;;
;; Verification matrix:
;;   CHAIN_EVM    (0x00000001) secp256k1, keccak256(uncompressed-pubkey)[12:]
;;   CHAIN_BTC    (0x00000002) secp256k1, hash160(compressed-pubkey)        [future]
;;   CHAIN_STACKS (0x00000003) secp256k1, hash160(compressed-pubkey)        [future]
;;   CHAIN_SOLANA (0x00000004) ed25519,   raw pubkey                        [future, ed25519-verify?]
;;   CHAIN_P256   (0x00000005) secp256r1, WebAuthn-style                    [future, secp256r1-verify]

(impl-trait 'SP3JP0N1ZXGASRJ0F7QAHWFPGTVK9T2XNXDB908Z.extension-trait.extension-trait)
(use-trait sip010 'SP2AKWJYC7BNY18W1XXKPGP0YVEK63QJG4793Z2D4.sip-010-trait-ft-standard.sip-010-trait)
(use-trait prediction-market-trait .prediction-market-trait.prediction-market-trait)

;; ============================================================
;; Constants -- chains
;; ============================================================

(define-constant CHAIN_EVM    0x00000001)
(define-constant CHAIN_BTC    0x00000002)
(define-constant CHAIN_STACKS 0x00000003)
(define-constant CHAIN_SOLANA 0x00000004)
(define-constant CHAIN_P256   0x00000005)

;; ============================================================
;; Constants -- BigMarket Protocol Message v1 (BMP1)
;; ============================================================

;; 8-byte magic: ASCII "BMP1MSG\0"
(define-constant BMP1_MAGIC   0x424d50314d534700)
(define-constant BMP1_VERSION 0x01)

;; Opcodes
(define-constant OP_WITHDRAW       0x01)
(define-constant OP_BUY_SHARES     0x02)
(define-constant OP_SELL_SHARES    0x03)
(define-constant OP_CLAIM_WINNINGS 0x04)

;; Field offsets within the 256-byte message
(define-constant OFF_MAGIC        u0)    ;; 8
(define-constant OFF_OPCODE       u8)    ;; 1
(define-constant OFF_VERSION      u9)    ;; 1
(define-constant OFF_FLAGS        u10)   ;; 2
(define-constant OFF_CHAIN        u12)   ;; 4
(define-constant OFF_CONTROLLER   u16)   ;; 32
(define-constant OFF_NONCE        u48)   ;; 16
(define-constant OFF_SLOT0        u64)   ;; 32
(define-constant OFF_SLOT1        u96)   ;; 32
(define-constant OFF_SLOT2        u128)  ;; 32
(define-constant OFF_SLOT3        u160)  ;; 32
(define-constant OFF_SLOT4        u192)  ;; 32
(define-constant OFF_SLOT5        u224)  ;; 32

;; EIP-712 typed-data signing constants for EVM controller verification.
;;
;; Domain: { name: "BigMarket", version: "1.0.0" }  (no chainId -- replay
;; protection is provided by the per-controller nonce in the BMP1 message).
;;
;; Type:   BMP1Withdraw(bytes payload)
;;
;; Digest path:
;;   1. payload-hash = keccak256(bmp1_message)
;;   2. struct-hash  = keccak256(WITHDRAW_TYPEHASH || payload-hash)
;;   3. digest       = keccak256(0x1901 || DOMAIN_SEPARATOR || struct-hash)
;;
;; All constants are precomputed off-chain:
;;   DOMAIN_SEPARATOR  = keccak256(domainTypeHash || keccak256("BigMarket") || keccak256("1.0.0"))
;;   WITHDRAW_TYPEHASH = keccak256("BMP1Withdraw(bytes payload)")

;; 0x1901 -- EIP-712 two-byte prefix
(define-constant EIP712_PREFIX 0x1901)

;; keccak256( domainTypeHash || keccak256("BigMarket") || keccak256("1.0.0") )
;; domainTypeHash = keccak256("EIP712Domain(string name,string version)")
(define-constant EIP712_DOMAIN_SEPARATOR
  0x4e3c7155c429f36e33b8498ec258c659f393ec00d8434884b72472304c45681d)

;; keccak256("BMP1Withdraw(address controller,uint256 amount,uint256 nonce,bytes32 bmp1Hash)")
;;
;; MetaMask renders each field by name:
;;   controller --> recognisable 0x EVM address
;;   amount     --> raw micro-unit integer (e.g. 55000000 for 55 USDCx)
;;   nonce      --> replay-protection counter
;;   bmp1Hash   --> keccak256 of the full BMP1 payload (binds the signature)
;;
;; Encoding notes (all standard EIP-712 ABI encoding):
;;   controller: 32 bytes left-padded  <-- exactly the BMP1 controller-address field
;;   amount:     32-byte uint256       <-- exactly the BMP1 slot3 field (high 16 = 0)
;;   nonce:      32-byte uint256       <-- BMP1 nonce (buff 16) prepended with 16 zero bytes
;;   bmp1Hash:   bytes32 as-is
(define-constant EIP712_WITHDRAW_TYPEHASH
  0xf1ebe45c9252e59f16c9eaed223a770a5d40b6b8bc14507a83cc68a149d644ba)

;; Stacks / SIP-018 signing constants
;; SIP-018 structured-data prefix: "SIP018" (6 bytes)
(define-constant SIP018_PREFIX 0x534950303138)

;; sha256( serializeCV( tupleCV({ name: "BigMarket", version: "1.0.0", chain-id: 1 }) ) )
;; Mainnet BigMarket domain hash
(define-constant BMP1_DOMAIN_HASH_MAINNET
  0x3b14d8330f855c17c2eb445612876cb48d9e298755a180ca23de6f41402fad8c)

;; sha256( serializeCV( tupleCV({ name: "BigMarket", version: "1.0.0", chain-id: 2147483648 }) ) )
;; Testnet/devnet BigMarket domain hash (chain-id = 0x80000000)
(define-constant BMP1_DOMAIN_HASH_TESTNET
  0x450c6f4e56f5336cfeef9b235811015361f8c12a146e35e96783b94b3677f26e)

;; Stacks mainnet standard single-sig address version byte
(define-constant STACKS_MAINNET_VERSION 0x16)

(define-constant ZERO_32
  0x0000000000000000000000000000000000000000000000000000000000000000)

;; ============================================================
;; Errors
;; ============================================================

(define-constant ERR_UNAUTHORISED         (err u7100))
(define-constant ERR_INVALID_AMOUNT       (err u7101))
(define-constant ERR_TOKEN_NOT_ALLOWED    (err u7102))
(define-constant ERR_INSUFFICIENT_BALANCE (err u7103))
(define-constant ERR_INVALID_NONCE        (err u7104))
(define-constant ERR_ALREADY_SWEPT        (err u7105))
(define-constant ERR_SIG_VERIFICATION     (err u7106))
(define-constant ERR_ADDRESS_MISMATCH     (err u7107))
(define-constant ERR_UNSUPPORTED_CHAIN    (err u7108))
(define-constant ERR_INVALID_ADDRESS      (err u7109))
(define-constant ERR_MSG_MAGIC            (err u7110))
(define-constant ERR_MSG_VERSION          (err u7111))
(define-constant ERR_MSG_OPCODE           (err u7112))
(define-constant ERR_TOKEN_COMMIT         (err u7113))
(define-constant ERR_MAPPED_COMMIT        (err u7114))
(define-constant ERR_RECIPIENT_COMMIT     (err u7115))
(define-constant ERR_EXPIRED              (err u7116))
(define-constant ERR_PUBKEY_MISMATCH      (err u7117))
(define-constant ERR_SIG_SCHEME           (err u7118))
(define-constant ERR_MARKET_COMMIT        (err u7119))

;; ============================================================
;; Storage
;; ============================================================

;; Whitelisted SIP-010 tokens
(define-map allowed-tokens principal bool)

;; Cross-chain balances
;; controller-chain:   4-byte chain id
;; controller-address: 32-byte normalised address
;;   EVM/BTC/Stacks 12x 0x00 ++ 20-byte address
;;   Solana         32-byte ed25519 public key (raw)
(define-map balances
  { controller-chain: (buff 4), controller-address: (buff 32), mapped-address: principal, token: principal }
  uint)

;; Per-controller withdrawal nonces (prevents signed-message replay across all opcodes)
(define-map withdrawal-nonces
  { controller-chain: (buff 4), controller-address: (buff 32) }
  uint)

;; Consumed intent IDs (prevents double-sweep on deposit)
(define-map swept-intents { intent-id: (buff 32), token-contract: principal, controller-chain: (buff 4), controller-address: (buff 32), mapped-address: principal } bool)

;; ============================================================
;; Auth helpers
;; ============================================================

(define-public (is-dao-or-extension)
  (begin
    (asserts!
      (or
        (is-eq tx-sender .bigmarket-dao)
        (contract-call? .bigmarket-dao is-extension contract-caller))
      ERR_UNAUTHORISED)
    (ok true)))

;; ============================================================
;; Admin (DAO only)
;; ============================================================

(define-public (set-token-allowed (token <sip010>) (allowed bool))
  (begin
    (try! (is-dao-or-extension))
    (map-set allowed-tokens (contract-of token) allowed)
    (ok true)))

;; ============================================================
;; Extension trait
;; ============================================================

(define-public (callback (sender principal) (memo (buff 34)))
  (ok true))

;; ============================================================
;; Read-only
;; ============================================================

(define-read-only (get-balance
    (controller-chain   (buff 4))
    (controller-address (buff 32))
    (mapped-address principal)
    (token        principal))
  (default-to u0
    (map-get? balances
      { controller-chain: controller-chain, controller-address: controller-address, mapped-address: mapped-address, token: token })))

(define-read-only (get-nonce
    (controller-chain   (buff 4))
    (controller-address (buff 32)))
  (default-to u0
    (map-get? withdrawal-nonces
      { controller-chain: controller-chain, controller-address: controller-address })))

(define-read-only (is-intent-swept (intent-id (buff 32)) (token-contract principal) (controller-chain (buff 4)) (controller-address (buff 32)) (mapped-address principal))
  (default-to false (map-get? swept-intents { intent-id: intent-id, token-contract: token-contract, controller-chain: controller-chain, controller-address: controller-address, mapped-address: mapped-address })))

(define-read-only (is-token-allowed-read (token-contract principal))
  (default-to false (map-get? allowed-tokens token-contract)))

;; Convenience: get balance by raw EVM address (no padding needed by caller)
(define-read-only (get-evm-balance (eth-address (buff 20)) (mapped-address principal) (token principal))
  (get-balance CHAIN_EVM (pad-address-20 eth-address) mapped-address token))

;; Convenience: get balance by Stacks principal
(define-read-only (get-stacks-balance (stacks-address principal) (mapped-address principal) (token principal))
  (get-balance CHAIN_STACKS (pad-address-20 (principal-to-hash160 stacks-address)) mapped-address token))

(define-private (credit-balance (controller-chain (buff 4)) (controller-address (buff 32)) (mapped-address principal) (token-contract principal) (amount uint))
  (let ((prev (default-to u0 (map-get? balances { controller-chain: controller-chain, controller-address: controller-address, mapped-address: mapped-address, token: token-contract }))))
    (map-set balances { controller-chain: controller-chain, controller-address: controller-address, mapped-address: mapped-address, token: token-contract } (+ prev amount))))

;; ============================================================
;; Use Case 1: Direct deposit (any chain user, self-custodied)
;;
;; tx-sender holds the tokens on Stacks and calls this directly.
;; controller-chain + controller-address declare which source chain identity
;; this balance belongs to. For native Stacks users, pass
;; CHAIN_STACKS and their own hash160.
;; ============================================================

(define-public (deposit
    (token        <sip010>)
    (amount       uint))
  (let (
    (token-contract (contract-of token))
    (controller-address (pad-address-20 (principal-to-hash160 tx-sender)))
  )
    (asserts! (> amount u0)                              ERR_INVALID_AMOUNT)
    (asserts! (check-token token-contract)               ERR_TOKEN_NOT_ALLOWED)
    (asserts! (check-address CHAIN_STACKS controller-address)    ERR_INVALID_ADDRESS)
    (try! (contract-call? token transfer amount tx-sender current-contract none))

    (credit-balance CHAIN_STACKS controller-address tx-sender token-contract amount)
    (print {event: "deposit", token-contract : token-contract , amount: amount, controller-chain: CHAIN_STACKS, controller-address: controller-address, mapped-address: tx-sender})
    (ok amount)))

;; ============================================================
;; Use Case 2: Relayer sweeps bridge intent into vault
;;
;; Relayer holds the ephemeral mapped Stacks key, calls this
;; after tokens arrive at the mapped address.
;; Tokens: mapped-address -> vault contract
;; Credit: goes to (controller-chain, controller-address) the real user
;; ============================================================

(define-public (deposit-for
    (token        <sip010>)
    (amount       uint)
    (controller-chain   (buff 4))
    (controller-address (buff 32))
    (mapped-address principal)
    (intent-id    (buff 32)))
  (let ((token-contract (contract-of token)))
    (asserts! (> amount u0)                              ERR_INVALID_AMOUNT)
    (asserts! (check-token token-contract)               ERR_TOKEN_NOT_ALLOWED)
    (asserts! (check-chain controller-chain)                   ERR_UNSUPPORTED_CHAIN)
    (asserts! (check-address controller-chain controller-address)    ERR_INVALID_ADDRESS)
    (asserts! (not (is-intent-swept intent-id token-contract controller-chain controller-address mapped-address))          ERR_ALREADY_SWEPT)
    (try! (contract-call? token transfer amount tx-sender current-contract none))
    (credit-balance controller-chain controller-address mapped-address token-contract amount)
    (map-set swept-intents { intent-id: intent-id, token-contract: token-contract, controller-chain: controller-chain, controller-address: controller-address, mapped-address: mapped-address } true)
    (print {event: "deposit-for", token-contract : token-contract , amount: amount, controller-chain: controller-chain, controller-address: controller-address, mapped-address: mapped-address, intent-id: intent-id})
    (ok amount)))

;; ============================================================
;; Use Case 3: Withdrawal via signed BigMarket Protocol Message v1
;;
;; The user signs a 256-byte fixed-length BMP1 message off-chain. The
;; signed message commits to:
;;   - opcode = OP_WITHDRAW
;;   - the controller identity (chain + 32-byte address)
;;   - the per-controller nonce
;;   - keccak256-commitments to (token-principal, mapped-address-principal,
;;     recipient-principal)
;;   - the withdrawal amount and optional expiry block height
;;
;; The relayer submits (message, signature, pubkey, token, mapped, recipient)
;; on-chain. The vault recomputes the three principal commitments from the
;; principals it was passed, verifies the signature against the controller
;; address, debits the balance keyed by (chain, controller, mapped, token),
;; and transfers using as-contract.
;;
;; For EVM, `pubkey` must be the controller's UNCOMPRESSED secp256k1 public
;; key (64 bytes: X || Y). The contract recompresses it, compares against
;; the pubkey recovered from the signature, then derives the standard EVM
;; address keccak256(uncompressed)[12:32].
;; ============================================================

(define-public (withdraw
    (message        (buff 256))
    (signature      (buff 65))
    (pubkey         (buff 64))
    (token          <sip010>)
    (mapped-address principal)
    (recipient      principal))
  (let
    (
      (token-contract     (contract-of token))
      (parsed             (parse-message message))
      (chain              (get controller-chain parsed))
      (controller         (get controller-address parsed))
      (nonce              (buff-to-uint-be (get nonce parsed)))
      (amount             (slot-low-uint (get slot3 parsed)))
      (expiry             (slot-low-uint (get slot4 parsed)))
      (token-commit       (keccak256 (unwrap-panic (to-consensus-buff? token-contract))))
      (mapped-commit      (keccak256 (unwrap-panic (to-consensus-buff? mapped-address))))
      (recipient-commit   (keccak256 (unwrap-panic (to-consensus-buff? recipient))))
      (current-balance    (get-balance chain controller mapped-address token-contract))
      (current-nonce      (get-nonce chain controller))
    )
    ;; Envelope: magic / version / opcode
    (asserts! (is-eq (get magic   parsed) BMP1_MAGIC)         ERR_MSG_MAGIC)
    (asserts! (is-eq (get version parsed) BMP1_VERSION)       ERR_MSG_VERSION)
    (asserts! (is-eq (get opcode  parsed) OP_WITHDRAW)        ERR_MSG_OPCODE)

    ;; Field validation
    (asserts! (check-chain chain)                             ERR_UNSUPPORTED_CHAIN)
    (asserts! (check-address chain controller)                ERR_INVALID_ADDRESS)
    (asserts! (> amount u0)                                   ERR_INVALID_AMOUNT)
    (asserts! (check-token token-contract)                    ERR_TOKEN_NOT_ALLOWED)
    (asserts! (is-eq (get slot0 parsed) token-commit)         ERR_TOKEN_COMMIT)
    (asserts! (is-eq (get slot1 parsed) mapped-commit)        ERR_MAPPED_COMMIT)
    (asserts! (is-eq (get slot2 parsed) recipient-commit)     ERR_RECIPIENT_COMMIT)
    (asserts! (>= current-balance amount)                     ERR_INSUFFICIENT_BALANCE)
    (asserts! (is-eq nonce current-nonce)                     ERR_INVALID_NONCE)
    (asserts! (or (is-eq expiry u0)
                  (<= stacks-block-height expiry))            ERR_EXPIRED)

    ;; Signature: verify against the controller address
    (try! (verify-message-signature chain message signature pubkey controller mapped-address token-contract recipient))

    ;; Effects (before token transfer -- re-entrancy)
    (map-set balances
      { controller-chain: chain, controller-address: controller, mapped-address: mapped-address, token: token-contract }
      (- current-balance amount))
    (map-set withdrawal-nonces
      { controller-chain: chain, controller-address: controller }
      (+ current-nonce u1))

    ;; Interaction: vault transfers SIP-010 to recipient as the contract.
    ;; with-all-assets-unsafe matches the pattern used elsewhere for SIP-010
    ;; transfers driven by an externally-supplied trait reference (the asset
    ;; identifier isn't known at compile time so it can't be declared via
    ;; with-ft).
    (try! (as-contract? ((with-all-assets-unsafe))
            (try! (contract-call? token transfer amount tx-sender recipient none))
            true))

    (print {
      event: "withdraw",
      token-contract: token-contract,
      amount: amount,
      controller-chain: chain,
      controller-address: controller,
      mapped-address: mapped-address,
      recipient: recipient,
      nonce: nonce
    })
    (ok amount)))

;; ============================================================
;; Use Case 4: Buy shares via signed BMP1 + prediction-market-trait
;;
;; Relayer passes the market extension as <prediction-market-trait> so the
;; vault can call predict-vault on categorical OR scalar with one code path.
;; Both extensions use uint `index` (trait: predict-vault).
;;
;; BMP1 OP_BUY_SHARES body (v1.1 extends withdraw layout):
;;   slot0  keccak256(consensus(token))
;;   slot1  keccak256(consensus(mapped-address))
;;   slot2  outcome-index (u128 BE, high 16) || market-id (u128 BE, low 16)
;;   slot3  keccak256(consensus(market-extension-principal))
;;   slot4  max-cost (high 16) || min-shares (low 16)
;;   slot5  expiry (low 16); high 16 reserved zero
;;
;; Effects: debit vault ledger; market pulls max-cost from contract-caller
;; (this vault); positions + BIGR go to mapped-address (beneficiary).
;; ============================================================

(define-public (buy-shares
    (message        (buff 256))
    (signature      (buff 65))
    (pubkey         (buff 64))
    (token          <sip010>)
    (mapped-address principal)
    (market         <prediction-market-trait>))
  (let
    (
      (token-contract   (contract-of token))
      (market-contract  (contract-of market))
      (parsed           (parse-message message))
      (chain            (get controller-chain parsed))
      (controller       (get controller-address parsed))
      (nonce            (buff-to-uint-be (get nonce parsed)))
      (market-id        (slot-low-uint (get slot2 parsed)))
      (outcome-index    (slot-high-uint (get slot2 parsed)))
      (max-cost         (slot-high-uint (get slot4 parsed)))
      (min-shares       (slot-low-uint (get slot4 parsed)))
      (expiry           (slot-low-uint (get slot5 parsed)))
      (token-commit     (keccak256 (unwrap-panic (to-consensus-buff? token-contract))))
      (mapped-commit    (keccak256 (unwrap-panic (to-consensus-buff? mapped-address))))
      (market-commit    (keccak256 (unwrap-panic (to-consensus-buff? market-contract))))
      (current-balance  (get-balance chain controller mapped-address token-contract))
      (current-nonce    (get-nonce chain controller))
    )
    (asserts! (is-eq (get magic   parsed) BMP1_MAGIC)           ERR_MSG_MAGIC)
    (asserts! (is-eq (get version parsed) BMP1_VERSION)         ERR_MSG_VERSION)
    (asserts! (is-eq (get opcode  parsed) OP_BUY_SHARES)         ERR_MSG_OPCODE)
    (asserts! (check-chain chain)                               ERR_UNSUPPORTED_CHAIN)
    (asserts! (check-address chain controller)                  ERR_INVALID_ADDRESS)
    (asserts! (> max-cost u0)                                   ERR_INVALID_AMOUNT)
    (asserts! (check-token token-contract)                      ERR_TOKEN_NOT_ALLOWED)
    (asserts! (is-eq (get slot0 parsed) token-commit)          ERR_TOKEN_COMMIT)
    (asserts! (is-eq (get slot1 parsed) mapped-commit)           ERR_MAPPED_COMMIT)
    (asserts! (is-eq (get slot3 parsed) market-commit)          ERR_MARKET_COMMIT)
    (asserts! (>= current-balance max-cost)                     ERR_INSUFFICIENT_BALANCE)
    (asserts! (is-eq nonce current-nonce)                       ERR_INVALID_NONCE)
    (asserts! (or (is-eq expiry u0) (<= stacks-block-height expiry)) ERR_EXPIRED)
    ;; TODO: dedicated BMP1BuyShares EIP-712 / SIP-018 tuple (not withdraw tuple)
    (try! (verify-message-signature chain message signature pubkey controller mapped-address token-contract mapped-address))
    (map-set balances
      { controller-chain: chain, controller-address: controller, mapped-address: mapped-address, token: token-contract }
      (- current-balance max-cost))
    (map-set withdrawal-nonces { controller-chain: chain, controller-address: controller } (+ current-nonce u1))
    (try! (as-contract? ((with-all-assets-unsafe))
            (try! (contract-call? market predict-vault mapped-address market-id min-shares outcome-index token max-cost))
            true))
    (print {
      event: "buy-shares",
      market: market-contract,
      market-id: market-id,
      outcome-index: outcome-index,
      max-cost: max-cost,
      min-shares: min-shares,
      mapped-address: mapped-address,
      controller-chain: chain,
      controller-address: controller
    })
    (ok outcome-index)))

;; ============================================================
;; BMP1 message parsing
;; ============================================================

(define-private (parse-message (msg (buff 256))) 
  {
    magic:              (msg-slice-8  msg OFF_MAGIC),
    opcode:             (msg-slice-1  msg OFF_OPCODE),
    version:            (msg-slice-1  msg OFF_VERSION),
    flags:              (msg-slice-2  msg OFF_FLAGS),
    controller-chain:   (msg-slice-4  msg OFF_CHAIN),
    controller-address: (msg-slice-32 msg OFF_CONTROLLER),
    nonce:              (msg-slice-16 msg OFF_NONCE),
    slot0:              (msg-slice-32 msg OFF_SLOT0),
    slot1:              (msg-slice-32 msg OFF_SLOT1),
    slot2:              (msg-slice-32 msg OFF_SLOT2),
    slot3:              (msg-slice-32 msg OFF_SLOT3),
    slot4:              (msg-slice-32 msg OFF_SLOT4),
    slot5:              (msg-slice-32 msg OFF_SLOT5)
  })

;; Extract the low 16 bytes of a 32-byte slot and decode as u128 big-endian.
;; Used for amount / expiry / market-id / outcome fields.
(define-private (slot-low-uint (slot (buff 32)))
  (buff-to-uint-be
    (unwrap-panic (as-max-len? (unwrap-panic (slice? slot u16 u32)) u16))))

;; Extract the high 16 bytes of a 32-byte slot and decode as u128 big-endian.
;; Used by buy/sell opcodes to pack (amount-in, min-out) in a single slot.
(define-private (slot-high-uint (slot (buff 32)))
  (buff-to-uint-be
    (unwrap-panic (as-max-len? (unwrap-panic (slice? slot u0 u16)) u16))))

(define-private (msg-slice-1 (msg (buff 256)) (offset uint))
  (unwrap-panic (as-max-len? (unwrap-panic (slice? msg offset (+ offset u1))) u1)))

(define-private (msg-slice-2 (msg (buff 256)) (offset uint))
  (unwrap-panic (as-max-len? (unwrap-panic (slice? msg offset (+ offset u2))) u2)))

(define-private (msg-slice-4 (msg (buff 256)) (offset uint))
  (unwrap-panic (as-max-len? (unwrap-panic (slice? msg offset (+ offset u4))) u4)))

(define-private (msg-slice-8 (msg (buff 256)) (offset uint))
  (unwrap-panic (as-max-len? (unwrap-panic (slice? msg offset (+ offset u8))) u8)))

(define-private (msg-slice-16 (msg (buff 256)) (offset uint))
  (unwrap-panic (as-max-len? (unwrap-panic (slice? msg offset (+ offset u16))) u16)))

(define-private (msg-slice-32 (msg (buff 256)) (offset uint))
  (unwrap-panic (as-max-len? (unwrap-panic (slice? msg offset (+ offset u32))) u32)))

;; ============================================================
;; Signature verification -- chain dispatch
;; ============================================================

(define-private (verify-message-signature
    (chain          (buff 4))
    (message        (buff 256)) 
    (signature      (buff 65))
    (pubkey         (buff 64))
    (controller     (buff 32))
    (mapped-address principal)
    (token-contract principal)
    (recipient      principal))
  (if (is-eq chain CHAIN_EVM)
    (verify-evm message signature pubkey controller)
    (if (is-eq chain CHAIN_STACKS)
      (verify-stacks-sip18 message signature controller mapped-address token-contract recipient)
      ERR_SIG_SCHEME)))

;; SIP-018 structured-data verification for Stacks-native controllers.
;;
;; The wallet (Leather / Xverse) displays a human-readable tuple instead of
;; a raw binary blob.  The signed message is:
;;
;;   {
;;     amount:    uint           -- micro-units being withdrawn
;;     bmp1-hash: (buff 32)      -- sha256(message) binding to the full BMP1
;;     nonce:     uint           -- per-controller replay-protection counter
;;     operation: (string-ascii) -- always "withdraw"
;;     recipient: principal      -- destination Stacks address
;;     token:     principal      -- SIP-010 token contract
;;   }
;;
;; Clarity's to-consensus-buff? serialises tuple keys in lexicographic order,
;; which matches @stacks/transactions serializeCV on the TypeScript side.
;;
;; Trust path:
;;   1. Parse the BMP1 message to extract amount and nonce.
;;   2. Compute sha256(message) as the bmp1-hash binding.
;;   3. Serialise the human-readable tuple and sha256 it --> msg-cv-hash.
;;   4. SIP-018 digest: sha256("SIP018" || domain-hash || msg-cv-hash).
;;   5. Recover the compressed pubkey from the secp256k1 signature.
;;   6. Derive hash160(pubkey) and compare with the BMP1 controller field.
(define-private (verify-stacks-sip18
    (message        (buff 256))
    (signature      (buff 65))
    (controller     (buff 32))
    (mapped-address principal)
    (token-contract principal)
    (recipient      principal))
  (let
    (
      ;; Choose domain hash: mainnet if mapped-address is an SP address.
      (domain-hash
        (if (is-eq (get version (unwrap! (principal-destruct? mapped-address) ERR_INVALID_ADDRESS))
                   STACKS_MAINNET_VERSION)
          BMP1_DOMAIN_HASH_MAINNET
          BMP1_DOMAIN_HASH_TESTNET))
      (parsed  (parse-message message))
      (amount  (slot-low-uint (get slot3 parsed)))
      (nonce   (buff-to-uint-be (get nonce parsed)))
      ;; sha256 of the full BMP1 payload -- cryptographic binding
      (bmp1-hash (sha256 message))
      ;; Human-readable message tuple -- must exactly match the TypeScript SDK's
      ;; buildWithdrawMessageCv tuple (same keys, same value types, same order).
      ;; Clarity serialises tuple keys lexicographically (amount < bmp1-hash <
      ;; nonce < operation < recipient < token), which is the same order used
      ;; by @stacks/transactions serializeCV.
      (msg-cv-hash
        (sha256 (unwrap! (to-consensus-buff? {
          amount:    amount,
          bmp1-hash: bmp1-hash,
          nonce:     nonce,
          operation: "withdraw",
          recipient: recipient,
          token:     token-contract
        }) ERR_SIG_VERIFICATION)))
      ;; SIP-018 digest: sha256("SIP018" || domain_hash || msg_cv_hash)
      (digest
        (sha256 (concat SIP018_PREFIX (concat domain-hash msg-cv-hash))))
      ;; Recover the compressed public key (33 bytes) from the secp256k1 signature
      (recovered
        (unwrap! (secp256k1-recover? digest signature) ERR_SIG_VERIFICATION))
      ;; Stacks controller address = hash160(compressed-pubkey)
      (derived-addr  (hash160 recovered))
      (expected-addr (low-20-of-32 controller))
    )
    (asserts! (is-eq derived-addr expected-addr) ERR_ADDRESS_MISMATCH)
    (ok true)))

;; EVM secp256k1 + EIP-712 structured-data verification.
;;
;; MetaMask shows named fields (controller, amount, nonce, bmp1Hash) instead of
;; raw bytes.  The struct fields are lifted directly from the parsed BMP1 message
;; so no auxiliary helpers or extra caller-supplied data are needed:
;;
;;   controller  <-- BMP1 controller-address  (buff 32, already EIP-712 address-encoded)
;;   amount      <-- BMP1 slot3               (buff 32, already EIP-712 uint256-encoded)
;;   nonce       <-- BMP1 nonce prepended with 16 zero bytes  -->  (buff 32) uint256
;;   bmp1Hash    <-- keccak256(message)        (buff 32)
;;
;; Trust path:
;;   1. Parse the BMP1 message to extract nonce (buff 16) and slot3 (buff 32)
;;   2. nonce32  = 0x000...000 (16 bytes) || nonce (16 bytes)  -->  uint256 encoding
;;   3. bmp1Hash = keccak256(message)
;;   4. struct-encoded = WITHDRAW_TYPEHASH || controller || slot3 || nonce32 || bmp1Hash  (160 bytes)
;;   5. struct-hash  = keccak256(struct-encoded)
;;   6. digest       = keccak256(0x1901 || DOMAIN_SEPARATOR || struct-hash)
;;   7. Recover compressed pubkey from signature against digest
;;   8. Recompress supplied uncompressed pubkey and compare --> proves pubkey is signer's
;;   9. Derive EVM address keccak256(uncompressed)[12:32] and compare with controller
(define-private (verify-evm
    (message    (buff 256))
    (signature  (buff 65))
    (pubkey     (buff 64))
    (controller (buff 32)))
  (let
    (
      (parsed         (parse-message message))
      (bmp1-hash      (keccak256 message))
      ;; Zero-pad the 16-byte BMP1 nonce to 32 bytes for EIP-712 uint256 encoding
      (nonce32        (concat 0x00000000000000000000000000000000 (get nonce parsed)))
      ;; Build the 160-byte EIP-712 struct encoding
      (struct-encoded (concat EIP712_WITHDRAW_TYPEHASH
                       (concat controller
                         (concat (get slot3 parsed)
                           (concat nonce32 bmp1-hash)))))
      (struct-hash    (keccak256 struct-encoded))
      (digest         (keccak256 (concat EIP712_PREFIX (concat EIP712_DOMAIN_SEPARATOR struct-hash))))
      (recovered      (unwrap! (secp256k1-recover? digest signature) ERR_SIG_VERIFICATION))
      (recompressed   (compress-pubkey pubkey))
      (derived-addr   (evm-address-from-pubkey pubkey))
      (expected-addr  (low-20-of-32 controller))
    )
    (asserts! (is-eq recovered recompressed)      ERR_PUBKEY_MISMATCH)
    (asserts! (is-eq derived-addr expected-addr)  ERR_ADDRESS_MISMATCH)
    (ok true)))

;; Recompress an uncompressed secp256k1 pubkey (X || Y) to the 33-byte SEC
;; compressed form (prefix || X), where prefix is 0x02 if Y is even and 0x03
;; if odd.
(define-private (compress-pubkey (uncompressed (buff 64)))
  (let
    (
      (x (unwrap-panic (as-max-len? (unwrap-panic (slice? uncompressed u0 u32)) u32)))
      (y-last (unwrap-panic (element-at? uncompressed u63)))
      (prefix (if (is-eq (mod (buff-to-uint-be y-last) u2) u0) 0x02 0x03))
    )
    (unwrap-panic (as-max-len? (concat prefix x) u33))))

;; keccak256(uncompressed) and take the last 20 bytes -- the canonical EVM
;; address derivation.
(define-private (evm-address-from-pubkey (uncompressed (buff 64)))
  (unwrap-panic (as-max-len?
    (unwrap-panic (slice? (keccak256 uncompressed) u12 u32))
    u20)))

;; Take the last 20 bytes of a 32-byte normalised address (drops the
;; left-pad zeros used by EVM/BTC/Stacks identities).
(define-private (low-20-of-32 (addr (buff 32)))
  (unwrap-panic (as-max-len?
    (unwrap-panic (slice? addr u12 u32))
    u20)))

;; ============================================================
;; Private: address helpers
;; ============================================================

;; Pad a 20-byte address to 32 bytes (left-pad with 12 zero bytes)
(define-private (pad-address-20 (addr (buff 20)))
  (unwrap-panic (as-max-len?
    (concat 0x000000000000000000000000 addr)
    u32)))

;; Derive hash160 bytes from a Stacks principal
;; Used for get-stacks-balance convenience read
(define-private (principal-to-hash160 (addr principal))
  (get hash-bytes (unwrap-panic (principal-destruct? addr))))

;; ============================================================
;; Private: validation helpers
;; ============================================================

(define-private (check-token (token-contract principal))
  (default-to false (map-get? allowed-tokens token-contract)))

(define-private (check-chain (source-chain-id (buff 4)))
  (or
    (is-eq source-chain-id CHAIN_EVM)
    (is-eq source-chain-id CHAIN_BTC)
    (is-eq source-chain-id CHAIN_STACKS)
    (is-eq source-chain-id CHAIN_SOLANA)
    (is-eq source-chain-id CHAIN_P256)))

(define-private (is-secp256k1-chain (source-chain-id (buff 4)))
  (or
    (is-eq source-chain-id CHAIN_EVM)
    (is-eq source-chain-id CHAIN_BTC)
    (is-eq source-chain-id CHAIN_STACKS)))

;; Validate the controller address is non-zero. All chains use a 32-byte
;; normalised form (left-pad for 20-byte chains, raw 32-byte pubkey for
;; ed25519 chains).
(define-private (check-address (source-chain-id (buff 4)) (controller-address (buff 32)))
  (not (is-eq controller-address ZERO_32)))
