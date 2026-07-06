;; Title: Enable BigPlay
;; Author(s): BigMarket
;; BigPlay is a zero value token that allows users to earn reputation while testing the platform

(impl-trait  'SP3JP0N1ZXGASRJ0F7QAHWFPGTVK9T2XNXDB908Z.proposal-trait.proposal-trait)

(define-public (execute (sender principal))
	(begin
		
		(try! (contract-call? 'SPT94T4HGFN8A99AH4DEE3E5EM7J6JN8FKY8KB7Z.bme024-0-market-predicting set-allowed-token 'SPT94T4HGFN8A99AH4DEE3E5EM7J6JN8FKY8KB7Z.big-play true))
		(try! (contract-call? 'SPT94T4HGFN8A99AH4DEE3E5EM7J6JN8FKY8KB7Z.bme024-0-market-predicting set-token-minimum-seed 'SPT94T4HGFN8A99AH4DEE3E5EM7J6JN8FKY8KB7Z.big-play u1000000000))
		(try! (contract-call? 'SPT94T4HGFN8A99AH4DEE3E5EM7J6JN8FKY8KB7Z.bme024-0-market-scalar-pyth set-allowed-token 'SPT94T4HGFN8A99AH4DEE3E5EM7J6JN8FKY8KB7Z.big-play true))
		(try! (contract-call? 'SPT94T4HGFN8A99AH4DEE3E5EM7J6JN8FKY8KB7Z.bme024-0-market-scalar-pyth set-token-minimum-seed 'SPT94T4HGFN8A99AH4DEE3E5EM7J6JN8FKY8KB7Z.big-play u1000000000))
		(ok true)
	)
)
