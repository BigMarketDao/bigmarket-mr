;; Title: BME050 Cross-Chain User Funds Vault
;; Version: 0.3.0
;;
;; Synopsis:
;; Chain-agnostic vault holding user funds from any source chain.
;; User identity: (source-chain-id buff-4, address buff-32).
;;
;; Verification matrix:
;;   CHAIN_EVM    (0x00000001) secp256k1, keccak256(pubkey)[12:],  20-byte addr padded to 32
;;   CHAIN_BTC    (0x00000002) secp256k1, hash160(pubkey),          20-byte addr padded to 32
;;   CHAIN_STACKS (0x00000003) secp256k1, hash160(pubkey),          20-byte addr padded to 32
;;   CHAIN_SOLANA (0x00000004) ed25519,   raw pubkey,               32-byte addr (relayer-attested)
;;
;; Withdrawal auth:
;;   secp256k1 chains on-chain secp256k1-recover? (trustless)
;;   ed25519 chains   relayer-attested (pragmatic until Clarity adds ed25519-verify?)

(impl-trait 'SP3JP0N1ZXGASRJ0F7QAHWFPGTVK9T2XNXDB908Z.extension-trait.extension-trait)
(use-trait sip010 'SP2AKWJYC7BNY18W1XXKPGP0YVEK63QJG4793Z2D4.sip-010-trait-ft-standard.sip-010-trait)

;; ============================================================
;; Constants
;; ============================================================

(define-constant CHAIN_EVM    0x00000001)
(define-constant CHAIN_BTC    0x00000002)
(define-constant CHAIN_STACKS 0x00000003)
(define-constant CHAIN_SOLANA 0x00000004)

;; Domain separator for withdrawal message hashing
;; bytes of "bigmarket-vault-withdraw-v1"
(define-constant WITHDRAW_DOMAIN 0x6269676d61726b65742d7661756c742d77697468647261772d7631)

;; ============================================================
;; Errors
;; ============================================================

(define-constant ERR_UNAUTHORISED         (err u100))
(define-constant ERR_INVALID_AMOUNT       (err u101))
(define-constant ERR_TOKEN_NOT_ALLOWED    (err u102))
(define-constant ERR_INSUFFICIENT_BALANCE (err u103))
(define-constant ERR_INVALID_NONCE        (err u104))
(define-constant ERR_ALREADY_SWEPT        (err u105))
(define-constant ERR_SIG_VERIFICATION     (err u106))
(define-constant ERR_ADDRESS_MISMATCH     (err u107))
(define-constant ERR_UNSUPPORTED_CHAIN    (err u108))
(define-constant ERR_INVALID_ADDRESS      (err u109))

;; ============================================================
;; Storage
;; ============================================================

;; Whitelisted SIP-010 tokens
(define-map allowed-tokens principal bool)

;; Authorised relayer Stacks principals
(define-map relayers principal bool)

;; Cross-chain balances
;; user-chain:   4-byte chain id
;; user-address: 32-byte normalised address
;;   EVM/BTC/Stacks 12x 0x00 ++ 20-byte address
;;   Solana         32-byte ed25519 public key (raw)
(define-map balances
  { user-chain: (buff 4), user-address: (buff 32), token: principal }
  uint)

;; Per-user withdrawal nonces (prevents signature replay)
(define-map withdrawal-nonces
  { user-chain: (buff 4), user-address: (buff 32) }
  uint)

;; Consumed intent IDs (prevents double-sweep)
(define-map swept-intents (buff 32) bool)

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

(define-private (check-relayer)
  (default-to false (map-get? relayers tx-sender)))

;; ============================================================
;; Admin (DAO only)
;; ============================================================

(define-public (set-relayer (who principal) (enabled bool))
  (begin
    (try! (is-dao-or-extension))
    (map-set relayers who enabled)
    (ok true)))

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
    (user-chain   (buff 4))
    (user-address (buff 32))
    (token        principal))
  (default-to u0
    (map-get? balances
      { user-chain: user-chain, user-address: user-address, token: token })))

(define-read-only (get-nonce
    (user-chain   (buff 4))
    (user-address (buff 32)))
  (default-to u0
    (map-get? withdrawal-nonces
      { user-chain: user-chain, user-address: user-address })))

(define-read-only (is-intent-swept (intent-id (buff 32)))
  (default-to false (map-get? swept-intents intent-id)))

(define-read-only (is-relayer-read (who principal))
  (default-to false (map-get? relayers who)))

(define-read-only (is-token-allowed-read (token-contract principal))
  (default-to false (map-get? allowed-tokens token-contract)))

(define-private (credit-balance (user-chain (buff 4)) (user-address (buff 32)) (token-contract principal) (amount uint))
  (let ((prev (default-to u0 (map-get? balances { user-chain: user-chain, user-address: user-address, token: token-contract }))))
    (map-set balances { user-chain: user-chain, user-address: user-address, token: token-contract } (+ prev amount))))

;; Convenience: get balance by raw EVM address (no padding needed by caller)
(define-read-only (get-evm-balance (eth-address (buff 20)) (token principal))
  (get-balance CHAIN_EVM (pad-address-20 eth-address) token))

;; Convenience: get balance by Stacks principal
(define-read-only (get-stacks-balance (stacks-addr principal) (token principal))
  (get-balance CHAIN_STACKS (pad-address-20 (principal-to-hash160 stacks-addr)) token))

;; ============================================================
;; Use Case 1: Direct deposit (any chain user, self-custodied)
;;
;; tx-sender holds the tokens on Stacks and calls this directly.
;; user-chain + user-address declare which source chain identity
;; this balance belongs to. For native Stacks users, pass
;; CHAIN_STACKS and their own hash160.
;; ============================================================

(define-public (deposit
    (token        <sip010>)
    (amount       uint)
    (user-chain   (buff 4))
    (user-address (buff 32)))
  (let ((token-contract (contract-of token)))
    (asserts! (> amount u0)                              ERR_INVALID_AMOUNT)
    (asserts! (check-token token-contract)               ERR_TOKEN_NOT_ALLOWED)
    (asserts! (check-chain user-chain)                   ERR_UNSUPPORTED_CHAIN)
    (asserts! (check-address user-chain user-address)    ERR_INVALID_ADDRESS)
    (try! (contract-call? token transfer amount tx-sender current-contract none))

    (credit-balance user-chain user-address token-contract amount)
    (ok amount)))

;; ============================================================
;; Use Case 2: Relayer sweeps bridge intent into vault
;;
;; Relayer holds the ephemeral mapped Stacks key, calls this
;; after tokens arrive at the mapped address.
;; Tokens: mapped-address vault contract
;; Credit: goes to (user-chain, user-address) the real user
;; ============================================================

(define-public (deposit-for
    (token        <sip010>)
    (amount       uint)
    (user-chain   (buff 4))
    (user-address (buff 32))
    (intent-id    (buff 32)))
  (let ((token-contract (contract-of token)))
    (asserts! (check-relayer)                            ERR_UNAUTHORISED)
    (asserts! (> amount u0)                              ERR_INVALID_AMOUNT)
    (asserts! (check-token token-contract)               ERR_TOKEN_NOT_ALLOWED)
    (asserts! (check-chain user-chain)                   ERR_UNSUPPORTED_CHAIN)
    (asserts! (check-address user-chain user-address)    ERR_INVALID_ADDRESS)
    (asserts! (not (is-intent-swept intent-id))          ERR_ALREADY_SWEPT)
    (try! (contract-call? token transfer amount tx-sender current-contract none))
    (credit-balance user-chain user-address token-contract amount)
    (map-set swept-intents intent-id true)
    (ok amount)))

;; ============================================================
;; Use Case 3a: secp256k1 withdrawal (EVM, BTC, Stacks)
;;
;; Fully trustless Clarity verifies the signature on-chain.
;; The relayer (or anyone) can submit this tx; signature is auth.
;;
;; For CHAIN_EVM:    address = keccak256(pubkey)[12:]   20 bytes
;; For CHAIN_BTC:    address = hash160(pubkey)          20 bytes
;; For CHAIN_STACKS: address = hash160(pubkey)          20 bytes
;;
;; All three use the same code path; only address derivation differs.
;;
;; Message signed off-chain (TypeScript):
;;   keccak256(WITHDRAW_DOMAIN ++ source-chain-id ++ address ++ token ++ amount ++ recipient ++ nonce)
;;
;; raw-address: the 20-byte address BEFORE padding (caller convenience)
;; signature:   64-byte compact sig (r ++ s)
;; recovery-id: 0 or 1
;; ============================================================

(define-public (withdraw-secp256k1
    (token        <sip010>)
    (amount       uint)
    (source-chain-id     (buff 4))
    (raw-address  (buff 20))
    (recipient    principal)
    (nonce        uint)
    (signature    (buff 64))
    (recovery-id  uint))
  (let
    ((token-contract  (contract-of token))
     (user-address    (pad-address-20 raw-address))
     (current-balance (get-balance source-chain-id user-address token-contract))
     (current-nonce   (get-nonce source-chain-id user-address))
     (message-hash    (build-withdraw-hash
                        source-chain-id user-address token-contract amount recipient nonce)))
    (asserts! (> amount u0)                          ERR_INVALID_AMOUNT)
    (asserts! (check-token token-contract)           ERR_TOKEN_NOT_ALLOWED)
    (asserts! (is-secp256k1-chain source-chain-id)          ERR_UNSUPPORTED_CHAIN)
    (asserts! (>= current-balance amount)            ERR_INSUFFICIENT_BALANCE)
    (asserts! (is-eq nonce current-nonce)            ERR_INVALID_NONCE)
    (let ((recovered (unwrap! (recover-address source-chain-id message-hash signature recovery-id) ERR_ADDRESS_MISMATCH)))
      (asserts! (is-eq recovered raw-address)        ERR_ADDRESS_MISMATCH)
      ;; debit before transfer guards against re-entrancy
      (map-set balances
        { user-chain: source-chain-id, user-address: user-address, token: token-contract }
        (- current-balance amount))
      (map-set withdrawal-nonces
        { user-chain: source-chain-id, user-address: user-address }
        (+ current-nonce u1))
      ;;(try! (as-contract? () (contract-call? token transfer amount tx-sender recipient none)))
      (ok amount))))

;; ============================================================
;; Use Case 3b: Solana withdrawal (relayer-attested)
;;
;; Relayer verifies the Solana (ed25519) signature off-chain,
;; then submits this tx. Trust assumption: relayer cannot steal
;; funds (balances are set by deposit-for with on-chain intent
;; tracking), but relayer must be honest about which sol-address
;; authorised the withdrawal.
;;
;; Upgrade path: replace relayer assertion with ed25519-verify?
;; when Clarity adds native ed25519 support.
;;
;; sol-address: 32-byte ed25519 public key (= Solana address)
;; ============================================================

;; (define-public (withdraw-solana
;;     (token       <sip010>)
;;     (amount      uint)
;;     (sol-address (buff 32))
;;     (recipient   principal)
;;     (nonce       uint))
;;   (let
;;     ((token-contract  (contract-of token))
;;      (current-balance (get-balance CHAIN_SOLANA sol-address token-contract))
;;      (current-nonce   (get-nonce CHAIN_SOLANA sol-address)))
;;     (asserts! (check-relayer)                         ERR_UNAUTHORISED)
;;     (asserts! (> amount u0)                           ERR_INVALID_AMOUNT)
;;     (asserts! (check-token token-contract)            ERR_TOKEN_NOT_ALLOWED)
;;     (asserts! (>= current-balance amount)             ERR_INSUFFICIENT_BALANCE)
;;     (asserts! (is-eq nonce current-nonce)             ERR_INVALID_NONCE)
;;     (map-set balances
;;       { user-chain: CHAIN_SOLANA, user-address: sol-address, token: token-contract }
;;       (- current-balance amount))
;;     (map-set withdrawal-nonces
;;       { user-chain: CHAIN_SOLANA, user-address: sol-address }
;;       (+ current-nonce u1))
;;     (try! (as-contract? () (contract-call? token transfer amount tx-sender recipient none)))
;;     (ok amount)))

;; ============================================================
;; Private: signature verification
;; ============================================================

;; Recover the raw address (20 bytes, unpadded) from a secp256k1 sig.
;; Dispatches on source-chain-id for address derivation:
;;   EVM    keccak256(compressed-pubkey)[12:]
;;   BTC    hash160(compressed-pubkey)
;;   Stacks hash160(compressed-pubkey)   (same as BTC derivation)
(define-private (recover-address
    (source-chain-id    (buff 4))
    (msg-hash    (buff 32))
    (signature   (buff 64))
    (recovery-id uint))
  (match (secp256k1-recover? msg-hash signature)
    pubkey
      (if (is-eq source-chain-id CHAIN_EVM)
        (ok (keccak-to-address pubkey))
        (ok (hash160-to-address pubkey)))  ;; BTC and Stacks both use hash160
    err-code
      (err ERR_SIG_VERIFICATION)))

;; keccak256(compressed-pubkey), take last 20 bytes EVM address
(define-private (keccak-to-address (pubkey (buff 33)))
  (unwrap-panic (as-max-len?
    (unwrap-panic (slice? (keccak256 pubkey) u12 u32))
    u20)))

;; hash160(compressed-pubkey) BTC/Stacks address bytes
(define-private (hash160-to-address (pubkey (buff 33)))
  (hash160 pubkey))

;; ============================================================
;; Private: message hashing
;; ============================================================

;; Build the withdrawal message hash.
;; Must be reproduced identically in TypeScript:
;;   keccak256(concat(
;;     WITHDRAW_DOMAIN,
;;     source-chain-id,           // 4 bytes
;;     user-address,       // 32 bytes (padded)
;;     token-principal,    // consensus-serialised principal
;;     uint256(amount),    // 16 bytes big-endian
;;     recipient-principal,// consensus-serialised principal
;;     uint256(nonce)      // 16 bytes big-endian
;;   ))
(define-private (build-withdraw-hash
    (source-chain-id       (buff 4))
    (user-address   (buff 32))
    (token-contract principal)
    (amount         uint)
    (recipient      principal)
    (nonce          uint))
  (keccak256
    (concat WITHDRAW_DOMAIN
    (concat source-chain-id
    (concat user-address
    (concat (unwrap-panic (to-consensus-buff? token-contract))
    (concat (uint-to-buff-16 amount)
    (concat (unwrap-panic (to-consensus-buff? recipient))
            (uint-to-buff-16 nonce)))))))))

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
    (is-eq source-chain-id CHAIN_SOLANA)))

(define-private (is-secp256k1-chain (source-chain-id (buff 4)))
  (or
    (is-eq source-chain-id CHAIN_EVM)
    (is-eq source-chain-id CHAIN_BTC)
    (is-eq source-chain-id CHAIN_STACKS)))

;; Validate address length for the given chain
;; All chains use 32-byte user-address in storage.
;; For 20-byte chains the caller passes the padded form via pad-address-20.
;; This just checks the stored address is non-zero.
(define-private (check-address (source-chain-id (buff 4)) (user-address (buff 32)))
  (not (is-eq user-address 0x0000000000000000000000000000000000000000000000000000000000000000)))

;; ============================================================
;; Private: uint serialisation
;; ============================================================

;; Encode uint as 16-byte big-endian buffer (covers u128 max)
;; Used in message hashing matches TypeScript encodePacked uint128
;; Encode uint as 16-byte big-endian buffer
;; Split into two u64 halves avoids u128 literal overflow in parser
(define-private (uint-to-buff-16 (n uint))
  (let
    ((high (/ n u18446744073709551616))   ;; u64 max + 1 upper 8 bytes
     (low  (mod n u18446744073709551616))) ;; lower 8 bytes
    (unwrap-panic (as-max-len?
      (concat (uint-to-buff-8 high) (uint-to-buff-8 low))
      u16))))

(define-private (uint-to-buff-8 (n uint))
  (let
    ((high (/ n u4294967296))    ;; u32 max + 1 upper 4 bytes
     (low  (mod n u4294967296))) ;; lower 4 bytes
    (unwrap-panic (as-max-len?
      (concat (uint-to-buff-4 high) (uint-to-buff-4 low))
      u8))))

(define-private (uint-to-buff-4 (n uint))
  (let
    ((high (/ n u65536))    ;; upper 2 bytes
     (low  (mod n u65536))) ;; lower 2 bytes
    (unwrap-panic (as-max-len?
      (concat (uint-to-buff-2 high) (uint-to-buff-2 low))
      u4))))

(define-private (uint-to-buff-2 (n uint))
  (let
    ((high (/ n u256))    ;; upper byte
     (low  (mod n u256))) ;; lower byte
    (unwrap-panic (as-max-len?
      (concat (uint-to-buff-1 high) (uint-to-buff-1 low))
      u2))))

(define-private (uint-to-buff-1 (n uint))
  (unwrap-panic (element-at?
    0x000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f202122232425262728292a2b2c2d2e2f303132333435363738393a3b3c3d3e3f404142434445464748494a4b4c4d4e4f505152535455565758595a5b5c5d5e5f606162636465666768696a6b6c6d6e6f707172737475767778797a7b7c7d7e7f808182838485868788898a8b8c8d8e8f909192939495969798999a9b9c9d9e9fa0a1a2a3a4a5a6a7a8a9aaabacadaeafb0b1b2b3b4b5b6b7b8b9babbbcbdbebfc0c1c2c3c4c5c6c7c8c9cacbcccdcecfd0d1d2d3d4d5d6d7d8d9dadbdcdddedfe0e1e2e3e4e5e6e7e8e9eaebecedeeeff0f1f2f3f4f5f6f7f8f9fafbfcfdfeff
    n)))
