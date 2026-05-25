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

;; EIP-191 personal-sign prefix for a 256-byte payload:
;;   "\x19" || "Ethereum Signed Message:\n" || "256"
(define-constant EIP191_PREFIX_256
  0x19457468657265756d205369676e6564204d6573736167653a0a323536)

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
    (try! (verify-message-signature chain message signature pubkey controller))

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
;;
;; Only EVM (CHAIN_EVM) is implemented in this revision. The other arms are
;; placeholders so future revisions can drop in BTC/Stacks signed-message
;; digests and ed25519 / secp256r1 verifiers without breaking the public
;; entrypoint shape.
;; ============================================================

(define-private (verify-message-signature
    (chain      (buff 4))
    (message    (buff 256))
    (signature  (buff 65))
    (pubkey     (buff 64))
    (controller (buff 32)))
  (if (is-eq chain CHAIN_EVM)
    (verify-evm message signature pubkey controller)
    ERR_SIG_SCHEME))

;; EVM secp256k1 + EIP-191 personal_sign verification.
;;
;; Trust path:
;;   1. Compute digest = keccak256( "\x19Ethereum Signed Message:\n256" || msg )
;;   2. Recover the compressed pubkey from the signature
;;   3. Recompress the supplied uncompressed pubkey and compare -- this proves
;;      the caller-supplied uncompressed pubkey is the signer's
;;   4. Derive the standard EVM address keccak256(uncompressed)[12:32] and
;;      compare against the last 20 bytes of the controller address slot
(define-private (verify-evm
    (message    (buff 256))
    (signature  (buff 65))
    (pubkey     (buff 64))
    (controller (buff 32)))
  (let
    (
      (digest         (keccak256 (concat EIP191_PREFIX_256 message)))
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
