;; Title: BME050 User Funds Vault
;; Synopsis: Manages user balances for trading within BigMarket DAO.
;;
;; Description:
;; This contract is a DAO extension responsible for holding user funds used in trading.
;;
;; Use Case 1: Deposit Funds into Vault
;;
;; Functional Requirements:
;; 1. Users can deposit SIP-010 tokens into the vault
;; 2. The contract must transfer tokens from the user to itself
;; 3. The contract must track balances per user:
;;    - map: principal => uint
;; 4. The contract must expose:
;;    (define-public (deposit (amount uint)))
;; 5. The deposit must:
;;    - fail if amount == 0
;;    - fail if token transfer fails
;; 6. The contract must update internal balance AFTER successful transfer
;;
;; Non-Functional Requirements:
;; - MUST be minimal (no withdrawals yet)
;; - MUST be DAO extension controlled
;; - MUST support configurable token contract (not hardcoded)
;;
;; Invariants:
;; - Total internal balances MUST equal tokens held by contract
;; - No user balance can be negative
;; - No state update without successful token transfer
;;
;; Notes for Agents:
;; - Do NOT implement withdrawal in this version
;; - Do NOT add multi-token support yet (single token only)
;; - Focus ONLY on deposit flow 

(impl-trait 'SP3JP0N1ZXGASRJ0F7QAHWFPGTVK9T2XNXDB908Z.extension-trait.extension-trait)
(use-trait sip010 'SP2AKWJYC7BNY18W1XXKPGP0YVEK63QJG4793Z2D4.sip-010-trait-ft-standard.sip-010-trait)

(define-constant err-unauthorised (err u100))
(define-constant err-invalid-amount (err u101))
(define-constant err-token-not-allowed (err u102))


;; allowed token contracts: principal => bool (keyed by (contract-of token))
(define-map allowed-tokens principal bool)

;; { user, token } => uint  (token keyed by (contract-of token))
(define-map balances {user: principal, token: principal} uint)

(define-public (is-dao-or-extension)
  (begin
    (asserts!
      (or
        (is-eq tx-sender .bigmarket-dao)
        (contract-call? .bigmarket-dao is-extension contract-caller)
      )
      err-unauthorised
    )
    (ok true)
  )
)

;; DAO-controlled whitelist management
(define-public (set-token-allowed (token <sip010>) (allowed bool))
  (begin
    (try! (is-dao-or-extension))
    (map-set allowed-tokens (contract-of token) allowed)
    (ok true)
  )
)

;; extension-trait
(define-public (callback (sender principal) (memo (buff 34)))
  (ok true)
)

(define-read-only (get-balance (user principal) (token principal))
  (default-to u0 (map-get? balances {user: user, token: token}))
)

;; Use Case 1: Deposit Funds into Vault
(define-public (deposit (token <sip010>) (amount uint))
  (begin
    (asserts! (> amount u0) err-invalid-amount)
    (let ((token-contract (contract-of token)))
      (asserts! (is-eq (default-to false (map-get? allowed-tokens token-contract)) true) err-token-not-allowed)
      (try! (contract-call? token transfer amount tx-sender (as-contract tx-sender) none))
      (let ((prev (default-to u0 (map-get? balances {user: tx-sender, token: token-contract}))))
        (map-set balances {user: tx-sender, token: token-contract} (+ prev amount))
      )
      (ok amount)
    )
  )
)
