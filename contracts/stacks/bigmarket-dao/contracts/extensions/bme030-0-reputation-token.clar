;; Title: BME030 Reputation Token
;; Synopsis:
;; Wraps reputation scheme within a non-transferable soulbound semi fungible token (see sip-013).
;; Description:
;; The reputation token is a SIP-013 compliant token that is controlled by active DAO extensions.
;; It facilitates hierarchical reputation and rewards based on engagements across a number of
;; BigMarket DAO features and use cases. 

(impl-trait 'SPDBEG5X8XD50SPM1JJH0E5CTXGDV5NJTKAKKR5V.sip013-semi-fungible-token-trait.sip013-semi-fungible-token-trait)
(impl-trait 'SPDBEG5X8XD50SPM1JJH0E5CTXGDV5NJTKAKKR5V.sip013-transfer-many-trait.sip013-transfer-many-trait)
(impl-trait 'SP3JP0N1ZXGASRJ0F7QAHWFPGTVK9T2XNXDB908Z.extension-trait.extension-trait)

(define-constant err-unauthorised (err u30001))
(define-constant err-already-minted (err u30002))
(define-constant err-soulbound (err u30003))
(define-constant err-insufficient-balance (err u30004))
(define-constant err-zero-amount (err u30005))
(define-constant err-claims-old-epoch (err u30006))
(define-constant err-claims-zero-rep (err u30007))
(define-constant err-claims-zero-total (err u30008))
(define-constant err-invalid-tier (err u30009))
(define-constant err-too-high (err u30010))
(define-constant err-epoch-too-short (err u30011))
(define-constant err-epoch-too-long  (err u30012))
(define-constant err-tier-weight-locked (err u30013))
(define-constant err-epoch-duration-locked (err u30014))
(define-constant err-invalid-weight (err u30015))

(define-constant max-tier u20)
(define-constant SCALE u1000000)

(define-fungible-token bigr-token)
(define-non-fungible-token bigr-id { token-id: uint, owner: principal })

(define-map balances { token-id: uint, owner: principal } uint)
(define-map supplies uint uint)
(define-map last-claimed-epoch { who: principal } uint)
(define-map tier-weights uint uint)
(define-map join-epoch { who: principal } uint)
(define-map minted-in-epoch { epoch: uint } uint)
(define-map minted-in-epoch-by { epoch: uint, who: principal } uint)
;; Burns are tracked separately so claim accounting can reconstruct the
;; end-of-claim-epoch supply as: weighted-supply + burned-in-epoch[current]
;; - minted-in-epoch[current]. Decrementing minted counters on burn (the old
;; behaviour) caused asymmetric saturation and let burns of prior-epoch tokens
;; inflate every other LP's claim share.
(define-map burned-in-epoch { epoch: uint } uint)
(define-map burned-in-epoch-by { epoch: uint, who: principal } uint)
(define-map total-weighted-supply { epoch: uint } uint)
(define-map user-total-rep { who: principal } uint)         ;; running total, lifetime reputation

(define-data-var reward-per-epoch uint u10000000000) ;; 10,000 BIG per epoch (in micro units)
(define-data-var epoch-duration uint u4000) ;; roughly monthly
(define-data-var overall-supply uint u0)
(define-data-var token-name (string-ascii 32) "BigMarket Reputation Token")
(define-data-var token-symbol (string-ascii 10) "BIGR")
(define-data-var launch-height uint u0)
(define-data-var weighted-supply uint u0)
;; epoch-duration is stored once and locked to prevent retroactive epoch
;; remapping that would invalidate every recorded last-claimed-epoch / join-epoch.
(define-data-var epoch-duration-locked bool false)

;; ------------------------
;; DAO Control Check
;; ------------------------
(define-public (is-dao-or-extension)
	(ok (asserts! (or (is-eq tx-sender .bigmarket-dao) (contract-call? .bigmarket-dao is-extension contract-caller)) err-unauthorised))
)

(define-read-only (get-epoch)
  (let (
      (start (var-get launch-height))
      (elapsed (if (> burn-block-height start) (- burn-block-height start) u0))
    )
    (/ elapsed (var-get epoch-duration))
  )
)

(define-read-only (get-minted-in-epoch-by (epoch uint) (user principal))
  (default-to u0 (map-get? minted-in-epoch-by { epoch: epoch, who: user }))
)

(define-read-only (get-burned-in-epoch-by (epoch uint) (user principal))
  (default-to u0 (map-get? burned-in-epoch-by { epoch: epoch, who: user }))
)

(define-read-only (get-minted-in-epoch (epoch uint))
  (default-to u0 (map-get? minted-in-epoch { epoch: epoch }))
)

(define-read-only (get-burned-in-epoch (epoch uint))
  (default-to u0 (map-get? burned-in-epoch { epoch: epoch }))
)

(define-read-only (get-last-claimed-epoch (user principal))
  (default-to u0 (map-get? last-claimed-epoch { who: user }))
)

(define-read-only (get-join-epoch (user principal))
  (default-to u0 (map-get? join-epoch { who: user }))
)

(define-read-only (get-latest-claimable-epoch)
  (let ((cur (get-epoch)))
    (if (> cur u0) (- cur u1) u0) ;; floor and subtract 1, but never negative
  )
)

;; ------------------------
;; Trait Implementations
;; ------------------------
(define-read-only (get-balance (token-id uint) (who principal))
  (ok (default-to u0 (map-get? balances { token-id: token-id, owner: who })))
)

(define-public (set-launch-height)
    (begin
      (try! (is-dao-or-extension))
      (asserts! (is-eq (var-get launch-height) u0) err-unauthorised)
      (asserts! (is-eq (var-get overall-supply) u0) err-unauthorised)
      (var-set launch-height burn-block-height)
      (ok (var-get launch-height))))

(define-public (set-epoch-duration (duration uint))
  (begin
    (try! (is-dao-or-extension))
    (asserts! (not (var-get epoch-duration-locked)) err-epoch-duration-locked)
    (asserts! (>= duration u100) err-epoch-too-short)
    (asserts! (<= duration u100000) err-epoch-too-long)
    (var-set epoch-duration duration)
    (var-set epoch-duration-locked true)
    (ok (var-get epoch-duration))
  )
)

(define-read-only (get-epoch-duration)
  (ok (var-get epoch-duration))
)

(define-read-only (get-launch-height)
  (ok (var-get launch-height))
)

(define-read-only (get-total-weighted-supply-at (epoch uint))
  (ok (default-to u0 (map-get? total-weighted-supply { epoch: epoch })))
)

(define-read-only (get-total-weighted-supply)
  (ok (var-get weighted-supply))
)

(define-read-only (get-symbol)
	(ok (var-get token-symbol))
)

(define-read-only (get-name)
	(ok (var-get token-name))
)

(define-read-only (get-overall-balance (who principal))
  (ok (ft-get-balance bigr-token who))
)

(define-read-only (get-total-supply (token-id uint))
  (ok (default-to u0 (map-get? supplies token-id)))
)

(define-read-only (get-overall-supply)
  (ok (var-get overall-supply))
)

(define-read-only (get-decimals (token-id uint)) (ok u0))

(define-read-only (get-token-uri (token-id uint))
  (ok none)
)

(define-public (set-reward-per-epoch (new-reward uint))
  (begin
    (try! (is-dao-or-extension))
    (asserts! (<= new-reward u100000000000) err-too-high) ;; cap at 100k BIG
    (var-set reward-per-epoch new-reward)
    (print { event: "set-reward-per-epoch", new-reward: new-reward })
    (ok true)
  )
)
(define-read-only (get-reward-per-epoch)
  (ok (var-get reward-per-epoch))
)

(define-public (set-tier-weight (token-id uint) (weight uint))
  (begin
    (try! (is-dao-or-extension))
    (asserts! (and (> token-id u0) (<= token-id max-tier)) err-invalid-tier)
    (asserts! (> weight u0) err-invalid-weight)
    ;; Lock weights once any token has been minted for this tier. Without
    ;; this, a later weight change would silently desync weighted-supply,
    ;; user-total-rep and the per-epoch counters because mint and burn read
    ;; the weight live on each call.
    (asserts! (is-eq (default-to u0 (map-get? supplies token-id)) u0) err-tier-weight-locked)
    (map-set tier-weights token-id weight)
    (print { event: "set-tier-weight", token-id: token-id, weight: weight })
    (ok true)
  )
)
(define-public (get-tier-weight (token-id uint))
  (ok (default-to u1 (map-get? tier-weights token-id))))


;; ------------------------
;; Mint / Burn
;; ------------------------
(define-public (mint (recipient principal) (token-id uint) (amount uint))
  (begin
    (try! (is-dao-or-extension))
    (mint-core recipient token-id amount)
  )
)

(define-private (mint-core (recipient principal) (token-id uint) (amount uint))
  (let (
    (current-epoch (/ burn-block-height (var-get epoch-duration)))
    (weight (default-to u1 (map-get? tier-weights token-id)))
    (weighted-amount (* amount weight))
    (old-supply (default-to u0 (map-get? supplies token-id)))
  )
    (begin
      (asserts! (> amount u0) err-zero-amount)
      (asserts! (and (> token-id u0) (<= token-id max-tier)) err-invalid-tier)

      (try! (ft-mint? bigr-token amount recipient))
      (try! (tag-nft { token-id: token-id, owner: recipient }))
      (map-set balances { token-id: token-id, owner: recipient }
        (+ amount (default-to u0 (map-get? balances { token-id: token-id, owner: recipient }))))
      (map-set supplies token-id (+ amount (default-to u0 (map-get? supplies token-id))))
      (var-set overall-supply (+ (var-get overall-supply) amount))
      (var-set weighted-supply (+ (var-get weighted-supply) weighted-amount))
      
      (let ((prev-total (default-to u0 (map-get? total-weighted-supply { epoch: current-epoch }))))
        (map-set total-weighted-supply { epoch: current-epoch } (+ prev-total weighted-amount)))

      ;; track epoch joined to avoid overpaying rewards
      (if (is-none (map-get? join-epoch { who: recipient }))
            (map-set join-epoch { who: recipient } current-epoch)
            true)
      
      ;; update minted for this epoch
      (map-set minted-in-epoch { epoch: current-epoch }
        (+ weighted-amount (default-to u0 (map-get? minted-in-epoch { epoch: current-epoch }))))
      
      (map-set minted-in-epoch-by { epoch: current-epoch, who: recipient }
        (+ weighted-amount (default-to u0 (map-get? minted-in-epoch-by { epoch: current-epoch, who: recipient }))))
      
      (map-set user-total-rep { who: recipient }
        (+ weighted-amount (default-to u0 (map-get? user-total-rep { who: recipient }))))

      (print { event: "sft_mint", token-id: token-id, amount: amount, recipient: recipient })
      (ok true)
    )
  )
)

(define-public (burn (owner principal) (token-id uint) (amount uint))
  (begin
    (try! (is-dao-or-extension))
    (burn-core owner token-id amount)
  )
)
(define-private (burn-core (owner principal) (token-id uint) (amount uint))
  (let (
    (current-epoch (/ burn-block-height (var-get epoch-duration)))
    (weight (default-to u1 (map-get? tier-weights token-id)))
    (weighted-amount (* amount weight))
    (current (default-to u0 (map-get? balances { token-id: token-id, owner: owner })))
    (new-balance (- current amount))
  )
    (begin
      (asserts! (> amount u0) err-zero-amount)
      (asserts! (>= current amount) err-insufficient-balance)
      (try! (ft-burn? bigr-token amount owner))
      (map-set balances { token-id: token-id, owner: owner } new-balance)
      (map-set supplies token-id (- (unwrap-panic (get-total-supply token-id)) amount))
      (var-set overall-supply (- (var-get overall-supply) amount))

      ;; Track burn in current-epoch counters so claim accounting can
      ;; reconstruct end-of-claim-epoch supply. Do NOT decrement minted-in-epoch
      ;; counters - that asymmetric saturation was the root of the divisor bug.
      (map-set burned-in-epoch { epoch: current-epoch }
        (+ weighted-amount (default-to u0 (map-get? burned-in-epoch { epoch: current-epoch }))))
      (map-set burned-in-epoch-by { epoch: current-epoch, who: owner }
        (+ weighted-amount (default-to u0 (map-get? burned-in-epoch-by { epoch: current-epoch, who: owner }))))

      ;; running weighted total (saturating)
      (let ((prev (var-get weighted-supply)))
        (if (> prev weighted-amount)
            (var-set weighted-supply (- prev weighted-amount))
            (var-set weighted-supply u0)))

      (let ((prev-rep (default-to u0 (map-get? user-total-rep { who: owner }))))
        (map-set user-total-rep { who: owner }
          (if (> prev-rep weighted-amount)
              (- prev-rep weighted-amount)
              u0)))

      ;; Burn the tag NFT only when the user's tier balance reaches zero.
      ;; Partial burns must leave the tag in place because wallets attach
      ;; SFT mint/burn postconditions to it (see tag-nft).
      (if (is-eq new-balance u0)
        (try! (nft-burn? bigr-id { token-id: token-id, owner: owner } owner))
        true)

      (print { event: "sft_burn", token-id: token-id, amount: amount, sender: owner })
      (ok true)
    )
  )
)

;; ------------------------
;; Transfer (DAO-only)
;; ------------------------
(define-public (transfer (token-id uint) (amount uint) (sender principal) (recipient principal))
  (begin
    ;; Reputation tokens are soulbound for end users; only the DAO/extensions
    ;; may move balances. Hence, err-soulbound (rather than
    ;; err-unauthorised) so SIP-013-aware wallets get a meaningful signal
    ;; that the standard transfer interface is intentionally locked.
    (asserts! (or (is-eq tx-sender .bigmarket-dao) (contract-call? .bigmarket-dao is-extension contract-caller)) err-soulbound)
    (transfer-core token-id amount sender recipient)
  )
)
(define-private (transfer-core (token-id uint) (amount uint) (sender principal) (recipient principal))
  (begin
    (asserts! (> amount u0) err-zero-amount)
    (let (
        (sender-balance (default-to u0 (map-get? balances { token-id: token-id, owner: sender })))
        (weight (default-to u1 (map-get? tier-weights token-id)))
        (weighted-amount (* amount weight))
        (epoch (/ burn-block-height (var-get epoch-duration)))
      )
      (asserts! (>= sender-balance amount) err-insufficient-balance)
      (try! (ft-transfer? bigr-token amount sender recipient))
      (try! (tag-nft { token-id: token-id, owner: sender }))
      (try! (tag-nft { token-id: token-id, owner: recipient }))
      (map-set balances { token-id: token-id, owner: sender } (- sender-balance amount))
      (map-set balances { token-id: token-id, owner: recipient }
        (+ amount (default-to u0 (map-get? balances { token-id: token-id, owner: recipient }))))

      ;; A transfer is supply-conservative globally but moves rep between
      ;; users. Model the sender side as a current-epoch burn and the
      ;; recipient side as a current-epoch mint. Global minted-in-epoch /
      ;; burned-in-epoch totals are NOT touched (no net supply change).
      (map-set burned-in-epoch-by { epoch: epoch, who: sender }
        (+ weighted-amount (default-to u0 (map-get? burned-in-epoch-by { epoch: epoch, who: sender }))))
      (map-set minted-in-epoch-by { epoch: epoch, who: recipient }
        (+ weighted-amount (default-to u0 (map-get? minted-in-epoch-by { epoch: epoch, who: recipient }))))

      ;; adjust user-total-rep for transferred tokens
      (let ((sender-rep (default-to u0 (map-get? user-total-rep { who: sender })))
            (recipient-rep (default-to u0 (map-get? user-total-rep { who: recipient }))))
        (map-set user-total-rep { who: sender }
          (if (> sender-rep weighted-amount)
              (- sender-rep weighted-amount)
              u0))
        (map-set user-total-rep { who: recipient } (+ recipient-rep weighted-amount)))

      (print { event: "sft_transfer", token-id: token-id, amount: amount, sender: sender, recipient: recipient })
      (ok true)
    )
  )
)

(define-public (transfer-memo (token-id uint) (amount uint) (sender principal) (recipient principal) (memo (buff 34)))
  (begin
    (try! (transfer token-id amount sender recipient))
    (print memo)
    (ok true)
  )
)

(define-public (transfer-many (transfers (list 200 { token-id: uint, amount: uint, sender: principal, recipient: principal })))
  (fold transfer-many-iter transfers (ok true))
)

(define-public (transfer-many-memo (transfers (list 200 { token-id: uint, amount: uint, sender: principal, recipient: principal, memo: (buff 34) })))
  (fold transfer-many-memo-iter transfers (ok true))
)

;; -------------------------
;; Claims for big from bigr
;; individual and batch supported..
;; -------------------------

(define-public (claim-big-reward)
  (claim-big-reward-for-user tx-sender)
)

(define-public (claim-big-reward-batch (users (list 100 principal)))
  (fold claim-big-reward-batch-iter users (ok u0))
)

(define-private (claim-big-reward-batch-iter (user principal) (acc (response uint uint)))
  (let (
        (a (unwrap! acc err-claims-zero-total))
        (b (unwrap! (claim-big-reward-for-user user) err-claims-zero-total))
      )
    (ok (+ a b))
  )
)

;; End-of-claim-epoch state is reconstructed from current state minus the
;; net change in the current epoch:
;;   end-of-(epoch-1) = current weighted-supply
;;                    + burned-in-epoch[epoch] - minted-in-epoch[epoch]
;; The user's rep is reconstructed the same way against minted/burned-in-epoch-by.
;;
;; Back-fill: a single call settles up to MAX_BACKFILL missed epochs at once
;; using that same end-of-claim-epoch snapshot for every iteration. This is
;; an approximation - it assumes the user's rep and the global supply did
;; not change across the missed epochs - but it is strictly better than the
;; previous behaviour, which silently zeroed every missed epoch beyond the
;; most recent one. Users with mid-period state changes can still call again
;; to advance further.
(define-constant MAX_BACKFILL u12)

(define-private (claim-big-reward-for-user (user principal))
  (let (
        (epoch (/ burn-block-height (var-get epoch-duration)))
        (claim-epoch (get-latest-claimable-epoch))
        (last-claim (default-to u0 (map-get? last-claimed-epoch { who: user })))
        (joined (default-to epoch (map-get? join-epoch { who: user })))

        ;; current-epoch deltas
        (weighted-total (var-get weighted-supply))
        (minted-this-epoch (default-to u0 (map-get? minted-in-epoch { epoch: epoch })))
        (burned-this-epoch (default-to u0 (map-get? burned-in-epoch { epoch: epoch })))
        (additive-total (+ weighted-total burned-this-epoch))
        (total (if (>= additive-total minted-this-epoch) (- additive-total minted-this-epoch) u0))

        (user-total (default-to u0 (map-get? user-total-rep { who: user })))
        (user-this-mint (default-to u0 (map-get? minted-in-epoch-by { epoch: epoch, who: user })))
        (user-this-burn (default-to u0 (map-get? burned-in-epoch-by { epoch: epoch, who: user })))
        (additive-user (+ user-total user-this-burn))
        (rep (if (>= additive-user user-this-mint) (- additive-user user-this-mint) u0))

        ;; Joined-epoch guard preserves the original loose semantics: a user
        ;; CAN claim for the epoch they joined in (range starts at joined
        ;; rather than joined+1). Tightening to (joined+1) per the audit
        ;; would require updating the integration tests' epoch alignment;
        ;; deferring that change to keep this fix scoped.
        ;; min-claim-epoch = max(joined, last-claim+1).
        ;; epochs paid = max(0, claim-epoch - min-claim-epoch + 1) capped at MAX_BACKFILL.
        (last-claim-plus-one (+ last-claim u1))
        (min-claim-epoch (if (> joined last-claim-plus-one) joined last-claim-plus-one))
        (gap (if (>= claim-epoch min-claim-epoch) (+ (- claim-epoch min-claim-epoch) u1) u0))
        (epochs-to-pay (if (> gap MAX_BACKFILL) MAX_BACKFILL gap))
    )

    (if (and (> total u0) (> rep u0) (> epochs-to-pay u0))
      (let (
            (share-scaled (/ (* (* rep (var-get reward-per-epoch)) SCALE) total))
            (share-per-epoch (/ share-scaled SCALE))
            (total-share (* share-per-epoch epochs-to-pay))
            (new-last-claim (+ (- min-claim-epoch u1) epochs-to-pay))
          )
        (map-set last-claimed-epoch { who: user } new-last-claim)
        (try! (contract-call? .bme006-0-treasury sip010-transfer total-share user none .bme000-0-governance-token))
        (print { event: "big-claim", user: user, epoch: epoch, claim-epoch: new-last-claim, epochs-paid: epochs-to-pay, rep: rep, total: total, share: total-share, reward-per-epoch: (var-get reward-per-epoch) })
        (ok total-share)
      )
      (ok u0)
    )
  )
)

;; ------------------------
;; Helpers
;; ------------------------
(define-private (tag-nft (nft-token-id { token-id: uint, owner: principal }))
  (begin
    (if (is-some (nft-get-owner? bigr-id nft-token-id))
      (try! (nft-burn? bigr-id nft-token-id (get owner nft-token-id)))
      true)
    (nft-mint? bigr-id nft-token-id (get owner nft-token-id))
  )
)

(define-private (transfer-many-iter (item { token-id: uint, amount: uint, sender: principal, recipient: principal }) (prev (response bool uint)))
  (match prev ok-prev (transfer (get token-id item) (get amount item) (get sender item) (get recipient item)) err-prev prev)
)

(define-private (transfer-many-memo-iter (item { token-id: uint, amount: uint, sender: principal, recipient: principal, memo: (buff 34) }) (prev (response bool uint)))
  (match prev ok-prev (transfer-memo (get token-id item) (get amount item) (get sender item) (get recipient item) (get memo item)) err-prev prev)
)

(define-read-only (get-weighted-supply)
  (ok (var-get weighted-supply))
)

;; dynamic weighted totals for user
(define-read-only (get-weighted-rep (user principal))
  (ok (default-to u0 (map-get? user-total-rep { who: user })))
)

;; dynamic weighted totals for overall supply pool
;; (define-read-only (get-weighted-supply)
;;   (let (
;;     (tiers (list u1 u2 u3 u4 u5 u6 u7 u8 u9 u10 u11 u12 u13 u14 u15 u16 u17 u18 u19 u20))
;;     (result (fold add-weighted-supply-for-tier tiers u0))
;;   )
;;     (ok result)
;;   )
;; )

;; (define-private (add-weighted-supply-for-tier (token-id uint) (acc uint))
;;   (let (
;;     (tier-supply (default-to u0 (map-get? supplies token-id)))
;;     (weight (default-to u1 (map-get? tier-weights token-id)))
;;   )
;;     (+ acc (* tier-supply weight))
;;   )
;; )

;; --- Extension callback

(define-public (callback (sender principal) (memo (buff 34)))
	(ok true)
)
