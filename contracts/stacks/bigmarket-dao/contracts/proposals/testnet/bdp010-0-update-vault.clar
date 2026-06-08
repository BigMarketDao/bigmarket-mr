;; Title: Update Vault to V3
;; Author(s): mijoco.btc

(impl-trait 'ST31A25YBK50KFJ2QS0EQK9FNXEQJD4PR0828789R.proposal-trait.proposal-trait)

(define-public (execute (sender principal))
	(begin
		
		(try! (contract-call? .bigmarket-dao set-extensions
			(list
				{extension: .bme050-1-vault, enabled: false}
				{extension: .bme050-2-vault, enabled: true}
			)
		))
		(try! (contract-call? .bme050-2-vault set-token-allowed 'ST30Q4WJYHGMYEE1CTGQ334R9M7KQ8ETVQ9NB134T.usdcx true))
		(ok true)
	)
)
