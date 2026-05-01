;; Title: Update epoch duration to 1 day
;; Author(s): mijoco.btc
;; Description: Changes epoch duration for testing purposes

(impl-trait  'SP3JP0N1ZXGASRJ0F7QAHWFPGTVK9T2XNXDB908Z.proposal-trait.proposal-trait)

(define-public (execute (sender principal))
	(begin
		(try! (contract-call? 'ST30Q4WJYHGMYEE1CTGQ334R9M7KQ8ETVQ9NB134T.bme030-0-reputation-token set-epoch-duration u144))
		(try! (contract-call? 'ST30Q4WJYHGMYEE1CTGQ334R9M7KQ8ETVQ9NB134T.bme030-0-reputation-token set-reward-per-epoch u100000000))
		(ok true)
	)
)
