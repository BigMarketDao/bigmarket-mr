;; Title: Returns newguy STX from Phase I
;; Author(s): mijoco.btc
;; Returns STX to newguy due to latency of project

(impl-trait  'SP3JP0N1ZXGASRJ0F7QAHWFPGTVK9T2XNXDB908Z.proposal-trait.proposal-trait)

(define-public (execute (sender principal))
	(begin
		(try! (contract-call? .bme003-0-core-proposals set-core-team-member 'SP10CZMEE431Q48Z9HNN971BKXPKMR4VQAF3EM6GD false))
		(try! (contract-call? .bme003-0-core-proposals set-core-team-member 'SP2A6S0FQCBJ7P54ZQ5FFQ6F1AVS60F5DBC9H0D7R false))
		(try! (contract-call? .bme003-0-core-proposals set-core-team-member 'SP3JP0N1ZXGASRJ0F7QAHWFPGTVK9T2XNXDB908Z false))

		(try! (contract-call? .bme003-0-core-proposals set-core-team-member 'SPEZD95XQ194X67C1QJW4PHKDG8F5D66ZCT8BY29 true))
		(try! (contract-call? .bme003-0-core-proposals set-core-team-member 'SPT94T4HGFN8A99AH4DEE3E5EM7J6JN8FKY8KB7Z true))
		(ok true)
	)
)
