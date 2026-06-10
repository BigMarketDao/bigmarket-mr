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
;; Opcode-specific structs mirror Stacks SIP-018 tuples (see SDK evmSip18.ts).
;; MetaMask renders each field by name; bmp1Hash binds the full 256-byte BMP1.
;;
;; Digest path (per opcode):
;;   struct-hash = keccak256(TYPEHASH || ABI-encoded fields)
;;   digest      = keccak256(0x1901 || DOMAIN_SEPARATOR || struct-hash)
;;
;; EIP-712 string fields use keccak256(utf8(display-string)) in the wallet.
;; Clarity cannot derive principal display strings at runtime. Mitigations:
;;   - token: DAO registry (token-eip712-display) - on-chain keccak256 of the
;;     canonical UTF-8 bytes must match eip712-token-hash (closes token binding).
;;   - mappedAddress / recipient: relayer-supplied hashes; BMP1 slot commitments
;;     still bind execution - documented relayer trust (see crit_eip-hashes.md).

;; 0x1901 -- EIP-712 two-byte prefix
(define-constant EIP712_PREFIX 0x1901)

;; keccak256( domainTypeHash || keccak256("BigMarket") || keccak256("1.0.0") )
(define-constant EIP712_DOMAIN_SEPARATOR
  0x4e3c7155c429f36e33b8498ec258c659f393ec00d8434884b72472304c45681d)

;; keccak256("BMP1Withdraw(address controller,uint256 amount,bytes32 bmp1Hash,uint256 nonce,string operation,string recipient,string token)")
(define-constant EIP712_WITHDRAW_TYPEHASH
  0x7ddd25b313d8b4710b8f87bee912e0a43a14b97f44a9098b71ce2e1bee319c9d)

;; keccak256("BMP1BuyShares(address controller,bytes32 bmp1Hash,uint256 expiry,string mappedAddress,uint256 marketId,uint256 maxCost,uint256 minShares,uint256 nonce,string operation,uint256 outcomeIndex,string token)")
(define-constant EIP712_BUY_SHARES_TYPEHASH
  0x2075f387905a08b438d1a903792130d970c0b52709ab9f4c9d7ecb07ce2e4324)

;; keccak256("BMP1SellShares(address controller,bytes32 bmp1Hash,uint256 expiry,string mappedAddress,uint256 marketId,uint256 minRefund,uint256 nonce,string operation,uint256 outcomeIndex,uint256 sharesIn,string token)")
(define-constant EIP712_SELL_SHARES_TYPEHASH
  0xeca6ba45fa57685ad84c00f5e8b471235a345b20461c63e4b30cdbf7da3c7083)

;; keccak256("BMP1ClaimWinnings(address controller,bytes32 bmp1Hash,uint256 expiry,string mappedAddress,uint256 marketId,uint256 nonce,string operation,string token)")
(define-constant EIP712_CLAIM_WINNINGS_TYPEHASH
  0x015e0b7da094f5a74b7810b287175317b3da28d96b771ea63a6a071d18b4264c)

;; keccak256(operation string literals)
(define-constant EIP712_OP_WITHDRAW       0x855511cc3694f64379908437d6d64458dc76d02482052bfb8a5b33a72c054c77)
(define-constant EIP712_OP_BUY_SHARES     0x2ea4fe602c386ea6abea89f8e3d9fd5031470742d29bb30716e05448895b45c5)
(define-constant EIP712_OP_SELL_SHARES    0xa373bcd1e40adb888ac2ff66c24227816d3f9d57d7dde63974309fd3e1a64ce5)
(define-constant EIP712_OP_CLAIM_WINNINGS  0x4e430ce44038df5064ee69251aef2f20c95a8746d609c94838ad478b505aa6f2)

(define-constant ZERO_16 0x00000000000000000000000000000000)

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
(define-constant ERR_MARKET_NOT_ALLOWED   (err u7120))
(define-constant ERR_TOKEN_EIP712_BINDING (err u7121))
(define-constant ERR_TOKEN_DISPLAY_LEN    (err u7122))
(define-constant MAX_TOKEN_DISPLAY_LEN    u128)

;; ============================================================
;; Storage
;; ============================================================

;; Whitelisted SIP-010 tokens
(define-map allowed-tokens principal bool)

;; Canonical EIP-712 UTF-8 display strings for whitelisted tokens.
;; { display: raw utf8 bytes (left-aligned), len: exact byte count to hash }
(define-map token-eip712-display principal { display: (buff 128), len: uint })

;; Whitelisted market contracts the vault may interact with
(define-map authorized-markets principal bool)

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
;; white list market contracts
;; ============================================================
(define-public (set-market-allowed (market-contract principal) (enabled bool))
  (begin
    (try! (is-dao-or-extension))
    (map-set authorized-markets market-contract enabled)
    (print {event: "authorized-market", market: market-contract, enabled: enabled})
    (ok true)))
(define-read-only (get-market-allowed (market-contract principal))
  (ok (map-get? authorized-markets market-contract))
)
(define-private (check-market (market-contract principal))
  (default-to false (map-get? authorized-markets market-contract)))

(define-public (set-token-allowed (token <sip010>) (allowed bool))
  (begin
    (try! (is-dao-or-extension))
    (map-set allowed-tokens (contract-of token) allowed)
    (ok true)))

;; Register the canonical UTF-8 principal display string for a whitelisted token.
;; Must match the string the SDK passes to MetaMask / eip712HashDisplayString.
(define-public (set-token-eip712-display
    (token <sip010>)
    (display-utf8 (buff 128))
    (display-len uint))
  (let ((token-contract (contract-of token)))
    (try! (is-dao-or-extension))
    (asserts! (check-token token-contract) ERR_TOKEN_NOT_ALLOWED)
    (asserts! (and (> display-len u0) (<= display-len MAX_TOKEN_DISPLAY_LEN)) ERR_TOKEN_DISPLAY_LEN)
    (map-set token-eip712-display token-contract { display: display-utf8, len: display-len })
    (print { event: "token-eip712-display", token: token-contract, len: display-len })
    (ok true)))

(define-read-only (get-token-eip712-display-hash (token-contract principal))
  (match (map-get? token-eip712-display token-contract)
    entry
      (let ((display-slice
              (unwrap-panic
                (as-max-len?
                  (unwrap-panic (slice? (get display entry) u0 (get len entry)))
                  u128))))
        (ok (some (keccak256 display-slice))))
    (ok none)))

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
    (asserts! (> amount u0)                     ERR_INVALID_AMOUNT)
    (asserts! (check-token token-contract)      ERR_TOKEN_NOT_ALLOWED)
    (asserts! (check-chain controller-chain)    ERR_UNSUPPORTED_CHAIN)
    (asserts! (check-address controller-chain controller-address) ERR_INVALID_ADDRESS)
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
    (message          (buff 256))
    (signature        (buff 65))
    (pubkey           (buff 64))
    (token            <sip010>)
    (mapped-address   principal)
    (recipient        principal)
    (eip712-token-hash     (buff 32))
    (eip712-mapped-hash    (buff 32))
    (eip712-recipient-hash (buff 32)))
  (let
    (
      (token-contract     (contract-of token))
      (parsed             (parse-message message))
      (chain              (get controller-chain parsed))
      (controller         (get controller-address parsed))
      (nonce              (buff-to-uint-be (get nonce parsed)))
      (amount             (slot-low-uint (get slot3 parsed)))
      (expiry             (slot-low-uint (get slot4 parsed)))
      (token-commit       (keccak256 (unwrap! (to-consensus-buff? token-contract) ERR_TOKEN_COMMIT)))
      (mapped-commit      (keccak256 (unwrap! (to-consensus-buff? mapped-address) ERR_MAPPED_COMMIT)))
      (recipient-commit   (keccak256 (unwrap! (to-consensus-buff? recipient) ERR_RECIPIENT_COMMIT)))
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
    (try! (verify-message-signature chain message signature pubkey controller mapped-address token-contract recipient eip712-token-hash eip712-mapped-hash eip712-recipient-hash))

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
    (message          (buff 256))
    (signature        (buff 65))
    (pubkey           (buff 64))
    (token            <sip010>)
    (mapped-address   principal)
    (market           <prediction-market-trait>)
    (eip712-token-hash     (buff 32))
    (eip712-mapped-hash    (buff 32))
    (eip712-recipient-hash (buff 32)))
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
      (token-commit     (keccak256 (unwrap! (to-consensus-buff? token-contract) ERR_TOKEN_COMMIT)))
      (mapped-commit    (keccak256 (unwrap! (to-consensus-buff? mapped-address) ERR_MAPPED_COMMIT)))
      (market-commit    (keccak256 (unwrap! (to-consensus-buff? market-contract) ERR_MARKET_COMMIT)))
      (current-balance  (get-balance chain controller mapped-address token-contract))
      (current-nonce    (get-nonce chain controller))
    )
    
    (asserts! (check-market market-contract)                    ERR_MARKET_NOT_ALLOWED)
    (asserts! (is-eq (get magic   parsed) BMP1_MAGIC)           ERR_MSG_MAGIC)
    (asserts! (is-eq (get version parsed) BMP1_VERSION)         ERR_MSG_VERSION)
    (asserts! (is-eq (get opcode  parsed) OP_BUY_SHARES)        ERR_MSG_OPCODE)
    (asserts! (check-chain chain)                               ERR_UNSUPPORTED_CHAIN)
    (asserts! (check-address chain controller)                  ERR_INVALID_ADDRESS)
    (asserts! (> max-cost u0)                                   ERR_INVALID_AMOUNT)
    (asserts! (check-token token-contract)                      ERR_TOKEN_NOT_ALLOWED)
    (asserts! (is-eq (get slot0 parsed) token-commit)           ERR_TOKEN_COMMIT)
    (asserts! (is-eq (get slot1 parsed) mapped-commit)          ERR_MAPPED_COMMIT)
    (asserts! (is-eq (get slot3 parsed) market-commit)          ERR_MARKET_COMMIT)
    (asserts! (>= current-balance max-cost)                     ERR_INSUFFICIENT_BALANCE)
    (asserts! (is-eq nonce current-nonce)                       ERR_INVALID_NONCE)
    (asserts! (or (is-eq expiry u0) (<= stacks-block-height expiry)) ERR_EXPIRED)
    (try! (verify-message-signature chain message signature pubkey controller mapped-address token-contract mapped-address eip712-token-hash eip712-mapped-hash eip712-recipient-hash))
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
;; Use Case 5: Sell shares via signed BMP1 + prediction-market-trait
;;
;; Mirror of buy-shares. The shares being sold are owned by `mapped-address`
;; (the beneficiary) inside the market extension. The market refunds the net
;; proceeds to this vault (it passes contract-caller as the payee), and the
;; vault re-credits the controller ledger so the proceeds can later be
;; withdrawn. No vault-ledger debit happens here -- selling brings funds in.
;;
;; BMP1 OP_SELL_SHARES body:
;;   slot0  keccak256(consensus(token))
;;   slot1  keccak256(consensus(mapped-address))
;;   slot2  outcome-index (high 16) || market-id (low 16)
;;   slot3  keccak256(consensus(market-extension-principal))
;;   slot4  min-refund (high 16) || shares-in (low 16)
;;   slot5  expiry (low 16)
;; ============================================================

(define-public (sell-shares
    (message          (buff 256))
    (signature        (buff 65))
    (pubkey           (buff 64))
    (token            <sip010>)
    (mapped-address   principal)
    (market           <prediction-market-trait>)
    (eip712-token-hash     (buff 32))
    (eip712-mapped-hash    (buff 32))
    (eip712-recipient-hash (buff 32)))
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
      (min-refund       (slot-high-uint (get slot4 parsed)))
      (shares-in        (slot-low-uint (get slot4 parsed)))
      (expiry           (slot-low-uint (get slot5 parsed)))
      (token-commit     (keccak256 (unwrap! (to-consensus-buff? token-contract) ERR_TOKEN_COMMIT)))
      (mapped-commit    (keccak256 (unwrap! (to-consensus-buff? mapped-address) ERR_MAPPED_COMMIT)))
      (market-commit    (keccak256 (unwrap! (to-consensus-buff? market-contract) ERR_MARKET_COMMIT)))
      (current-nonce    (get-nonce chain controller))
    )
    (asserts! (check-market market-contract)                    ERR_MARKET_NOT_ALLOWED)
    (asserts! (is-eq (get magic   parsed) BMP1_MAGIC)           ERR_MSG_MAGIC)
    (asserts! (is-eq (get version parsed) BMP1_VERSION)         ERR_MSG_VERSION)
    (asserts! (is-eq (get opcode  parsed) OP_SELL_SHARES)        ERR_MSG_OPCODE)
    (asserts! (check-chain chain)                               ERR_UNSUPPORTED_CHAIN)
    (asserts! (check-address chain controller)                  ERR_INVALID_ADDRESS)
    (asserts! (> shares-in u0)                                  ERR_INVALID_AMOUNT)
    (asserts! (check-token token-contract)                      ERR_TOKEN_NOT_ALLOWED)
    (asserts! (is-eq (get slot0 parsed) token-commit)          ERR_TOKEN_COMMIT)
    (asserts! (is-eq (get slot1 parsed) mapped-commit)           ERR_MAPPED_COMMIT)
    (asserts! (is-eq (get slot3 parsed) market-commit)          ERR_MARKET_COMMIT)
    (asserts! (is-eq nonce current-nonce)                       ERR_INVALID_NONCE)
    (asserts! (or (is-eq expiry u0) (<= stacks-block-height expiry)) ERR_EXPIRED)
    (try! (verify-message-signature chain message signature pubkey controller mapped-address token-contract mapped-address eip712-token-hash eip712-mapped-hash eip712-recipient-hash))
    (map-set withdrawal-nonces { controller-chain: chain, controller-address: controller } (+ current-nonce u1))
    ;; Market refunds the net proceeds to this vault (payee = contract-caller).
    (let ((net-refund (try! (contract-call? market sell-vault mapped-address market-id min-refund outcome-index token shares-in))))
      (credit-balance chain controller mapped-address token-contract net-refund)
      (print {
        event: "sell-shares",
        market: market-contract,
        market-id: market-id,
        outcome-index: outcome-index,
        shares-in: shares-in,
        min-refund: min-refund,
        net-refund: net-refund,
        mapped-address: mapped-address,
        controller-chain: chain,
        controller-address: controller
      })
      (ok net-refund))))

;; ============================================================
;; Use Case 6: Claim winnings via signed BMP1 + prediction-market-trait
;;
;; Mirror of sell-shares. The winning shares are owned by `mapped-address`; the
;; resolved market pays the net winnings to this vault, which re-credits the
;; controller ledger. No outcome-index is needed -- the market uses its own
;; resolved outcome.
;;
;; BMP1 OP_CLAIM_WINNINGS body:
;;   slot0  keccak256(consensus(token))
;;   slot1  keccak256(consensus(mapped-address))
;;   slot2  market-id (low 16)
;;   slot3  keccak256(consensus(market-extension-principal))
;;   slot5  expiry (low 16)
;; ============================================================

(define-public (claim-winnings
    (message          (buff 256))
    (signature        (buff 65))
    (pubkey           (buff 64))
    (token            <sip010>)
    (mapped-address   principal)
    (market           <prediction-market-trait>)
    (eip712-token-hash     (buff 32))
    (eip712-mapped-hash    (buff 32))
    (eip712-recipient-hash (buff 32)))
  (let
    (
      (token-contract   (contract-of token))
      (market-contract  (contract-of market))
      (parsed           (parse-message message))
      (chain            (get controller-chain parsed))
      (controller       (get controller-address parsed))
      (nonce            (buff-to-uint-be (get nonce parsed)))
      (market-id        (slot-low-uint (get slot2 parsed)))
      (expiry           (slot-low-uint (get slot5 parsed)))
      (token-commit     (keccak256 (unwrap! (to-consensus-buff? token-contract) ERR_TOKEN_COMMIT)))
      (mapped-commit    (keccak256 (unwrap! (to-consensus-buff? mapped-address) ERR_MAPPED_COMMIT)))
      (market-commit    (keccak256 (unwrap! (to-consensus-buff? market-contract) ERR_MARKET_COMMIT)))
      (current-nonce    (get-nonce chain controller))
    )
    (asserts! (check-market market-contract)                    ERR_MARKET_NOT_ALLOWED)
    (asserts! (is-eq (get magic   parsed) BMP1_MAGIC)           ERR_MSG_MAGIC)
    (asserts! (is-eq (get version parsed) BMP1_VERSION)         ERR_MSG_VERSION)
    (asserts! (is-eq (get opcode  parsed) OP_CLAIM_WINNINGS)     ERR_MSG_OPCODE)
    (asserts! (check-chain chain)                               ERR_UNSUPPORTED_CHAIN)
    (asserts! (check-address chain controller)                  ERR_INVALID_ADDRESS)
    (asserts! (check-token token-contract)                      ERR_TOKEN_NOT_ALLOWED)
    (asserts! (is-eq (get slot0 parsed) token-commit)          ERR_TOKEN_COMMIT)
    (asserts! (is-eq (get slot1 parsed) mapped-commit)           ERR_MAPPED_COMMIT)
    (asserts! (is-eq (get slot3 parsed) market-commit)          ERR_MARKET_COMMIT)
    (asserts! (is-eq nonce current-nonce)                       ERR_INVALID_NONCE)
    (asserts! (or (is-eq expiry u0) (<= stacks-block-height expiry)) ERR_EXPIRED)
    (try! (verify-message-signature chain message signature pubkey controller mapped-address token-contract mapped-address eip712-token-hash eip712-mapped-hash eip712-recipient-hash))
    (map-set withdrawal-nonces { controller-chain: chain, controller-address: controller } (+ current-nonce u1))
    ;; Market pays the net winnings to this vault (payee = contract-caller).
    (let ((net-refund (try! (contract-call? market claim-winnings-vault mapped-address market-id token))))
      (credit-balance chain controller mapped-address token-contract net-refund)
      (print {
        event: "claim-winnings",
        market: market-contract,
        market-id: market-id,
        net-refund: net-refund,
        mapped-address: mapped-address,
        controller-chain: chain,
        controller-address: controller
      })
      (ok net-refund))))

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

(define-private (verify-token-eip712-hash (token-contract principal) (supplied-hash (buff 32)))
  (match (map-get? token-eip712-display token-contract)
    entry
      (let
        (
          (display-slice
            (unwrap-panic
              (as-max-len?
                (unwrap-panic (slice? (get display entry) u0 (get len entry)))
                u128)))
          (expected (keccak256 display-slice))
        )
        (asserts! (is-eq expected supplied-hash) ERR_TOKEN_EIP712_BINDING)
        (ok true))
    ERR_TOKEN_EIP712_BINDING))

(define-private (verify-message-signature
    (chain            (buff 4))
    (message          (buff 256))
    (signature        (buff 65))
    (pubkey           (buff 64))
    (controller       (buff 32))
    (mapped-address   principal)
    (token-contract   principal)
    (recipient        principal)
    (eip712-token-hash     (buff 32))
    (eip712-mapped-hash    (buff 32))
    (eip712-recipient-hash (buff 32)))
  (if (is-eq chain CHAIN_EVM)
    (begin
      (try! (verify-token-eip712-hash token-contract eip712-token-hash))
      (verify-evm message signature pubkey controller eip712-token-hash eip712-mapped-hash eip712-recipient-hash))
    (if (is-eq chain CHAIN_STACKS)
      (verify-stacks-sip18 message signature controller mapped-address token-contract recipient)
      ERR_SIG_SCHEME)))

;; SIP-018 structured-data verification for Stacks-native controllers.
;; Opcode-specific human-readable tuples (see SDK stacksSip18.ts).

;; Mapped-address is validated before signature verify in each entrypoint.
(define-private (stacks-sip18-domain-hash (mapped-address principal))
  (if (is-eq (get version (unwrap-panic (principal-destruct? mapped-address))) STACKS_MAINNET_VERSION)
    BMP1_DOMAIN_HASH_MAINNET
    BMP1_DOMAIN_HASH_TESTNET))

(define-private (verify-stacks-sip18-recover
    (domain-hash (buff 32))
    (msg-cv-hash (buff 32))
    (signature   (buff 65))
    (controller  (buff 32)))
  (let
    (
      (digest       (sha256 (concat SIP018_PREFIX (concat domain-hash msg-cv-hash))))
      (recovered    (unwrap! (secp256k1-recover? digest signature) ERR_SIG_VERIFICATION))
      (derived-addr (hash160 recovered))
      (expected-addr (low-20-of-32 controller))
    )
    (asserts! (is-eq derived-addr expected-addr) ERR_ADDRESS_MISMATCH)
    (ok true)))

(define-private (verify-stacks-withdraw
    (message        (buff 256))
    (signature      (buff 65))
    (controller     (buff 32))
    (token-contract principal)
    (recipient      principal)
    (domain-hash    (buff 32)))
  (let
    (
      (parsed    (parse-message message))
      (amount    (slot-low-uint (get slot3 parsed)))
      (nonce     (buff-to-uint-be (get nonce parsed)))
      (bmp1-hash (sha256 message))
      (msg-cv-hash
        (sha256 (unwrap! (to-consensus-buff? {
          amount:    amount,
          bmp1-hash: bmp1-hash,
          nonce:     nonce,
          operation: "withdraw",
          recipient: recipient,
          token:     token-contract
        }) ERR_SIG_VERIFICATION)))
    )
    (verify-stacks-sip18-recover domain-hash msg-cv-hash signature controller)))

(define-private (verify-stacks-buy-shares
    (message        (buff 256))
    (signature      (buff 65))
    (controller     (buff 32))
    (mapped-address principal)
    (token-contract principal)
    (domain-hash    (buff 32)))
  (let
    (
      (parsed        (parse-message message))
      (nonce         (buff-to-uint-be (get nonce parsed)))
      (market-id     (slot-low-uint (get slot2 parsed)))
      (outcome-index (slot-high-uint (get slot2 parsed)))
      (max-cost      (slot-high-uint (get slot4 parsed)))
      (min-shares    (slot-low-uint (get slot4 parsed)))
      (expiry        (slot-low-uint (get slot5 parsed)))
      (bmp1-hash     (sha256 message))
      (msg-cv-hash
        (sha256 (unwrap! (to-consensus-buff? {
          bmp1-hash:     bmp1-hash,
          expiry:        expiry,
          mapped-address: mapped-address,
          market-id:     market-id,
          max-cost:      max-cost,
          min-shares:    min-shares,
          nonce:         nonce,
          operation:     "buy-shares",
          outcome-index: outcome-index,
          token:         token-contract
        }) ERR_SIG_VERIFICATION)))
    )
    (verify-stacks-sip18-recover domain-hash msg-cv-hash signature controller)))

(define-private (verify-stacks-sell-shares
    (message        (buff 256))
    (signature      (buff 65))
    (controller     (buff 32))
    (mapped-address principal)
    (token-contract principal)
    (domain-hash    (buff 32)))
  (let
    (
      (parsed        (parse-message message))
      (nonce         (buff-to-uint-be (get nonce parsed)))
      (market-id     (slot-low-uint (get slot2 parsed)))
      (outcome-index (slot-high-uint (get slot2 parsed)))
      (min-refund    (slot-high-uint (get slot4 parsed)))
      (shares-in     (slot-low-uint (get slot4 parsed)))
      (expiry        (slot-low-uint (get slot5 parsed)))
      (bmp1-hash     (sha256 message))
      (msg-cv-hash
        (sha256 (unwrap! (to-consensus-buff? {
          bmp1-hash:     bmp1-hash,
          expiry:        expiry,
          mapped-address: mapped-address,
          market-id:     market-id,
          min-refund:    min-refund,
          nonce:         nonce,
          operation:     "sell-shares",
          outcome-index: outcome-index,
          shares-in:     shares-in,
          token:         token-contract
        }) ERR_SIG_VERIFICATION)))
    )
    (verify-stacks-sip18-recover domain-hash msg-cv-hash signature controller)))

(define-private (verify-stacks-claim-winnings
    (message        (buff 256))
    (signature      (buff 65))
    (controller     (buff 32))
    (mapped-address principal)
    (token-contract principal)
    (domain-hash    (buff 32)))
  (let
    (
      (parsed    (parse-message message))
      (nonce     (buff-to-uint-be (get nonce parsed)))
      (market-id (slot-low-uint (get slot2 parsed)))
      (expiry    (slot-low-uint (get slot5 parsed)))
      (bmp1-hash (sha256 message))
      (msg-cv-hash
        (sha256 (unwrap! (to-consensus-buff? {
          bmp1-hash:     bmp1-hash,
          expiry:        expiry,
          mapped-address: mapped-address,
          market-id:     market-id,
          nonce:         nonce,
          operation:     "claim-winnings",
          token:         token-contract
        }) ERR_SIG_VERIFICATION)))
    )
    (verify-stacks-sip18-recover domain-hash msg-cv-hash signature controller)))

(define-private (verify-stacks-sip18
    (message        (buff 256))
    (signature      (buff 65))
    (controller     (buff 32))
    (mapped-address principal)
    (token-contract principal)
    (recipient      principal))
  (let
    (
      (parsed      (parse-message message))
      (opcode      (get opcode parsed))
      (domain-hash (stacks-sip18-domain-hash mapped-address))
    )
    (if (is-eq opcode OP_WITHDRAW)
      (verify-stacks-withdraw message signature controller token-contract recipient domain-hash)
      (if (is-eq opcode OP_BUY_SHARES)
        (verify-stacks-buy-shares message signature controller mapped-address token-contract domain-hash)
        (if (is-eq opcode OP_SELL_SHARES)
          (verify-stacks-sell-shares message signature controller mapped-address token-contract domain-hash)
          (if (is-eq opcode OP_CLAIM_WINNINGS)
            (verify-stacks-claim-winnings message signature controller mapped-address token-contract domain-hash)
            ERR_MSG_OPCODE))))))

;; EVM secp256k1 + EIP-712 structured-data verification (opcode-specific structs).

(define-private (compress-pubkey (uncompressed (buff 64)))
  (let
    (
      (x (unwrap-panic (as-max-len? (unwrap-panic (slice? uncompressed u0 u32)) u32)))
      (y-last (unwrap-panic (element-at? uncompressed u63)))
      (prefix (if (is-eq (mod (buff-to-uint-be y-last) u2) u0) 0x02 0x03))
    )
    (unwrap-panic (as-max-len? (concat prefix x) u33))))

(define-private (evm-address-from-pubkey (uncompressed (buff 64)))
  (unwrap-panic (as-max-len?
    (unwrap-panic (slice? (keccak256 uncompressed) u12 u32))
    u20)))

(define-private (low-20-of-32 (addr (buff 32)))
  (unwrap-panic (as-max-len?
    (unwrap-panic (slice? addr u12 u32))
    u20)))

(define-private (slot-low-as-uint256 (slot (buff 32)))
  (concat ZERO_16
    (unwrap-panic (as-max-len? (unwrap-panic (slice? slot u16 u32)) u16))))

(define-private (slot-high-as-uint256 (slot (buff 32)))
  (concat ZERO_16
    (unwrap-panic (as-max-len? (unwrap-panic (slice? slot u0 u16)) u16))))

(define-private (verify-evm-recover-256
    (struct-encoded (buff 256))
    (signature      (buff 65))
    (pubkey         (buff 64))
    (controller     (buff 32)))
  (let
    (
      (struct-hash  (keccak256 struct-encoded))
      (digest       (keccak256 (concat EIP712_PREFIX (concat EIP712_DOMAIN_SEPARATOR struct-hash))))
      (recovered    (unwrap! (secp256k1-recover? digest signature) ERR_SIG_VERIFICATION))
      (recompressed (compress-pubkey pubkey))
      (derived-addr (evm-address-from-pubkey pubkey))
      (expected-addr (low-20-of-32 controller))
    )
    (begin
      (asserts! (is-eq recovered recompressed)     ERR_PUBKEY_MISMATCH)
      (asserts! (is-eq derived-addr expected-addr) ERR_ADDRESS_MISMATCH)
      (ok true))))

(define-private (verify-evm-recover-384
    (struct-encoded (buff 384))
    (signature      (buff 65))
    (pubkey         (buff 64))
    (controller     (buff 32)))
  (let
    (
      (struct-hash  (keccak256 struct-encoded))
      (digest       (keccak256 (concat EIP712_PREFIX (concat EIP712_DOMAIN_SEPARATOR struct-hash))))
      (recovered    (unwrap! (secp256k1-recover? digest signature) ERR_SIG_VERIFICATION))
      (recompressed (compress-pubkey pubkey))
      (derived-addr (evm-address-from-pubkey pubkey))
      (expected-addr (low-20-of-32 controller))
    )
    (begin
      (asserts! (is-eq recovered recompressed)     ERR_PUBKEY_MISMATCH)
      (asserts! (is-eq derived-addr expected-addr) ERR_ADDRESS_MISMATCH)
      (ok true))))

(define-private (verify-evm-recover-288
    (struct-encoded (buff 288))
    (signature      (buff 65))
    (pubkey         (buff 64))
    (controller     (buff 32)))
  (let
    (
      (struct-hash  (keccak256 struct-encoded))
      (digest       (keccak256 (concat EIP712_PREFIX (concat EIP712_DOMAIN_SEPARATOR struct-hash))))
      (recovered    (unwrap! (secp256k1-recover? digest signature) ERR_SIG_VERIFICATION))
      (recompressed (compress-pubkey pubkey))
      (derived-addr (evm-address-from-pubkey pubkey))
      (expected-addr (low-20-of-32 controller))
    )
    (begin
      (asserts! (is-eq recovered recompressed)     ERR_PUBKEY_MISMATCH)
      (asserts! (is-eq derived-addr expected-addr) ERR_ADDRESS_MISMATCH)
      (ok true))))

(define-private (verify-evm-withdraw
    (message        (buff 256))
    (signature      (buff 65))
    (pubkey         (buff 64))
    (controller     (buff 32))
    (token-hash     (buff 32))
    (recipient-hash (buff 32)))
  (let
    (
      (parsed         (parse-message message))
      (bmp1-hash      (keccak256 message))
      (nonce32        (concat ZERO_16 (get nonce parsed)))
      (struct-encoded
        (concat EIP712_WITHDRAW_TYPEHASH
          (concat controller
            (concat (slot-low-as-uint256 (get slot3 parsed))
              (concat bmp1-hash
                (concat nonce32
                  (concat EIP712_OP_WITHDRAW
                    (concat recipient-hash
                      token-hash))))))))
    )
    (verify-evm-recover-256 (unwrap-panic (as-max-len? struct-encoded u256)) signature pubkey controller)))

(define-private (verify-evm-buy-shares
    (message        (buff 256))
    (signature      (buff 65))
    (pubkey         (buff 64))
    (controller     (buff 32))
    (token-hash     (buff 32))
    (mapped-hash    (buff 32)))
  (let
    (
      (parsed         (parse-message message))
      (bmp1-hash      (keccak256 message))
      (nonce32        (concat ZERO_16 (get nonce parsed)))
      (struct-encoded
        (concat EIP712_BUY_SHARES_TYPEHASH
          (concat controller
            (concat bmp1-hash
              (concat (slot-low-as-uint256 (get slot5 parsed))
                (concat mapped-hash
                  (concat (slot-low-as-uint256 (get slot2 parsed))
                    (concat (slot-high-as-uint256 (get slot4 parsed))
                      (concat (slot-low-as-uint256 (get slot4 parsed))
                        (concat nonce32
                          (concat EIP712_OP_BUY_SHARES
                            (concat (slot-high-as-uint256 (get slot2 parsed))
                              token-hash))))))))))))
    )
    (verify-evm-recover-384 (unwrap-panic (as-max-len? struct-encoded u384)) signature pubkey controller)))

(define-private (verify-evm-sell-shares
    (message        (buff 256))
    (signature      (buff 65))
    (pubkey         (buff 64))
    (controller     (buff 32))
    (token-hash     (buff 32))
    (mapped-hash    (buff 32)))
  (let
    (
      (parsed         (parse-message message))
      (bmp1-hash      (keccak256 message))
      (nonce32        (concat ZERO_16 (get nonce parsed)))
      (struct-encoded
        (concat EIP712_SELL_SHARES_TYPEHASH
          (concat controller
            (concat bmp1-hash
              (concat (slot-low-as-uint256 (get slot5 parsed))
                (concat mapped-hash
                  (concat (slot-low-as-uint256 (get slot2 parsed))
                    (concat (slot-high-as-uint256 (get slot4 parsed))
                      (concat nonce32
                        (concat EIP712_OP_SELL_SHARES
                          (concat (slot-high-as-uint256 (get slot2 parsed))
                            (concat (slot-low-as-uint256 (get slot4 parsed))
                              token-hash))))))))))))
    )
    (verify-evm-recover-384 (unwrap-panic (as-max-len? struct-encoded u384)) signature pubkey controller)))

(define-private (verify-evm-claim-winnings
    (message        (buff 256))
    (signature      (buff 65))
    (pubkey         (buff 64))
    (controller     (buff 32))
    (token-hash     (buff 32))
    (mapped-hash    (buff 32)))
  (let
    (
      (parsed         (parse-message message))
      (bmp1-hash      (keccak256 message))
      (nonce32        (concat ZERO_16 (get nonce parsed)))
      (struct-encoded
        (concat EIP712_CLAIM_WINNINGS_TYPEHASH
          (concat controller
            (concat bmp1-hash
              (concat (slot-low-as-uint256 (get slot5 parsed))
                (concat mapped-hash
                  (concat (slot-low-as-uint256 (get slot2 parsed))
                    (concat nonce32
                      (concat EIP712_OP_CLAIM_WINNINGS
                        token-hash)))))))))
    )
    (verify-evm-recover-288 (unwrap-panic (as-max-len? struct-encoded u288)) signature pubkey controller)))

(define-private (verify-evm
    (message        (buff 256))
    (signature      (buff 65))
    (pubkey         (buff 64))
    (controller     (buff 32))
    (token-hash     (buff 32))
    (mapped-hash    (buff 32))
    (recipient-hash (buff 32)))
  (let ((opcode (unwrap-panic (element-at? message u8))))
    (if (is-eq opcode OP_WITHDRAW)
      (verify-evm-withdraw message signature pubkey controller token-hash recipient-hash)
      (if (is-eq opcode OP_BUY_SHARES)
        (verify-evm-buy-shares message signature pubkey controller token-hash mapped-hash)
        (if (is-eq opcode OP_SELL_SHARES)
          (verify-evm-sell-shares message signature pubkey controller token-hash mapped-hash)
          (if (is-eq opcode OP_CLAIM_WINNINGS)
            (verify-evm-claim-winnings message signature pubkey controller token-hash mapped-hash)
            ERR_MSG_OPCODE))))))

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
