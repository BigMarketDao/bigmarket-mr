(impl-trait  'SP3JP0N1ZXGASRJ0F7QAHWFPGTVK9T2XNXDB908Z.proposal-trait.proposal-trait)

(define-public (execute (sender principal))
	(begin
		(try! (contract-call? .bme030-0-reputation-token mint 'ST2JHG361ZXG51QTKY2NQCVBPPRRE2KZB1HR05NNC u1 u1000))
		(ok true)
	)
)
