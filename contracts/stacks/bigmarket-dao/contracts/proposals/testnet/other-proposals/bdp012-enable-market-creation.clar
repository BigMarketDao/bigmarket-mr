;; Title: bdp010-enable-market-creation
;; Synopsis:
;; disables gating of market creation.

(impl-trait  'SP3JP0N1ZXGASRJ0F7QAHWFPGTVK9T2XNXDB908Z.proposal-trait.proposal-trait)

(define-public (execute (sender principal))
	(begin 
		(try! (contract-call? 'ST3HAHEV768GAMP34MTEC83PJ4PG6ZSGBX77J7SV0.bme024-0-market-predicting set-market-fee-bips-max u333))
		(try! (contract-call? 'ST3HAHEV768GAMP34MTEC83PJ4PG6ZSGBX77J7SV0.bme024-0-market-predicting set-creation-gated false))
		(try! (contract-call? 'ST3HAHEV768GAMP34MTEC83PJ4PG6ZSGBX77J7SV0.bme024-0-market-scalar-pyth set-creation-gated false))
		;;(try! (contract-call? 'ST3HAHEV768GAMP34MTEC83PJ4PG6ZSGBX77J7SV0.bme024-0-market-predicting set-default-hedge-executor 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.bme032-0-scalar-strategy-hedge))
		(ok true)
	)
)
