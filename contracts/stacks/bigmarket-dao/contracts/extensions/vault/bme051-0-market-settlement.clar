;; ---------------- CONSTANTS ----------------

(define-constant RESOLUTION_OPEN u0)
(define-constant RESOLUTION_RESOLVED u1)

(define-constant err-not-found (err u100))
(define-constant err-not-open (err u101))
(define-constant err-not-resolved (err u102))
(define-constant err-insufficient-balance (err u103))

;; ---------------- STATE ----------------

(define-data-var market-counter uint u0)

(define-map markets
  uint
  {
    creator: principal,
    token: principal,
    categories: (list 10 (string-ascii 64)),
    outcome: (optional uint),
    resolved: bool
  }
)

;; user shares per outcome
(define-map balances
  { market-id: uint, user: principal }
  (list 10 uint)
)

;; ---------------- HELPERS ----------------

(define-private (empty-balances)
  (list u0 u0 u0 u0 u0 u0 u0 u0 u0 u0)
)

;; ---------------- PUBLIC ----------------

;; KEEP SIGNATURE SIMILAR
(define-public (create-market 
  (categories (list 10 (string-ascii 64)))
  (token principal)
)
  (let (
    (id (var-get market-counter))
  )
    (map-set markets id {
      creator: tx-sender,
      token: token,
      categories: categories,
      outcome: none,
      resolved: false
    })
    (var-set market-counter (+ id u1))
    (ok id)
  )
)

;; settles a matched trade from off-chain matcher
(define-public (execute-trade
  (market-id uint)
  (outcome uint)
  (buyer principal)
  (seller principal)
  (amount uint)
)
  (let (
    (market (unwrap! (map-get? markets market-id) err-not-found))
  )
    (asserts! (not (get resolved market)) err-not-open)

    ;; --- seller must have shares ---
    (let (
      (seller-balances (unwrap! (map-get? balances {market-id: market-id, user: seller}) err-insufficient-balance))
      (seller-shares (unwrap-panic (element-at? seller-balances outcome)))
    )
      (asserts! (>= seller-shares amount) err-insufficient-balance)

      ;; --- update seller ---
      (let (
        (seller-updated (unwrap-panic (replace-at? seller-balances outcome (- seller-shares amount))))
      )
        (map-set balances {market-id: market-id, user: seller} seller-updated)
      )
    )

    ;; --- update buyer ---
    (let (
      (buyer-balances (default-to (empty-balances) (map-get? balances {market-id: market-id, user: buyer})))
      (buyer-shares (unwrap-panic (element-at? buyer-balances outcome)))
      (buyer-updated (unwrap-panic (replace-at? buyer-balances outcome (+ buyer-shares amount))))
    )
      (map-set balances {market-id: market-id, user: buyer} buyer-updated)
    )

    ;; NOTE: token transfer happens OFF-CHAIN or via separate escrow
    (print {event: "trade", market-id: market-id, outcome: outcome, buyer: buyer, seller: seller, amount: amount})
    (ok true)
  )
)

;; KEEP SIGNATURE CLOSE
(define-public (resolve-market (market-id uint) (outcome uint))
  (let (
    (market (unwrap! (map-get? markets market-id) err-not-found))
  )
    (asserts! (not (get resolved market)) err-not-open)

    (map-set markets market-id
      (merge market {
        outcome: (some outcome),
        resolved: true
      })
    )

    (ok outcome)
  )
)

;; KEEP SIGNATURE CLOSE
(define-public (claim-winnings (market-id uint))
  (let (
    (market (unwrap! (map-get? markets market-id) err-not-found))
    (outcome (unwrap! (get outcome market) err-not-resolved))
    (user-balances (unwrap! (map-get? balances {market-id: market-id, user: tx-sender}) err-insufficient-balance))
    (shares (unwrap-panic (element-at? user-balances outcome)))
  )
    (asserts! (get resolved market) err-not-resolved)
    (asserts! (> shares u0) err-insufficient-balance)

    ;; payout logic simplified (1:1 placeholder)
    ;; replace later with proper pool accounting
    (print {event: "claim", market-id: market-id, user: tx-sender, shares: shares})

    ;; zero user balance
    (map-set balances {market-id: market-id, user: tx-sender} (empty-balances))

    (ok shares)
  )
)

;; read-only helper
(define-read-only (get-balance (market-id uint) (user principal))
  (ok (default-to (empty-balances) (map-get? balances {market-id: market-id, user: user})))
)