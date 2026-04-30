(impl-trait 'SP3JP0N1ZXGASRJ0F7QAHWFPGTVK9T2XNXDB908Z.proposal-trait.proposal-trait)

(define-public (execute (sender principal))
	(begin
		(try! (contract-call? .bigmarket-dao request-extension-callback .bme000-0-governance-token 0x0A))
		(try! (contract-call? .bigmarket-dao set-extension .bme000-0-governance-token true))
		(ok true)
	)
)
