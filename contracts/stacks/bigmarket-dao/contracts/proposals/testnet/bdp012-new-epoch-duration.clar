;; Title: Update epoch duration to 1 day
;; Author(s): mijoco.btc
;; Description: Changes epoch duration for testing purposes

(impl-trait  'SP3JP0N1ZXGASRJ0F7QAHWFPGTVK9T2XNXDB908Z.proposal-trait.proposal-trait)

(define-public (execute (sender principal))
	(begin
		(try! (contract-call? 'ST1GZKCXE2J2R9T2RKQQSR0C9AQTE2JV8FQE3EDW4.bme030-0-reputation-token set-epoch-duration u144))
		(try! (contract-call? 'ST1GZKCXE2J2R9T2RKQQSR0C9AQTE2JV8FQE3EDW4.bme030-0-reputation-token set-reward-per-epoch u100000000))
		(ok true)
	)
)
