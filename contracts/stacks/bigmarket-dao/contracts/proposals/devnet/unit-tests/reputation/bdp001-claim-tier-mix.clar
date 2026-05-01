(impl-trait  'SP3JP0N1ZXGASRJ0F7QAHWFPGTVK9T2XNXDB908Z.proposal-trait.proposal-trait)

;; Bootstrap leaves tier 10 weight = 5 and tier 1 weight = 1.
;; Mint alice tier 10 amount 100  -> weighted 500
;; Mint bob   tier 1  amount 500  -> weighted 500
;; Equal weighted rep, unequal raw balance.

(define-public (execute (sender principal))
	(begin
		(try! (contract-call? .bme030-0-reputation-token mint 'ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5 u10 u100))
		(try! (contract-call? .bme030-0-reputation-token mint 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG u1 u500))
		(ok true)
	)
)
