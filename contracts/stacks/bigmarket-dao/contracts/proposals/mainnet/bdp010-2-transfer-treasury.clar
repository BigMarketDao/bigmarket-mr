;; Title: Move treasury and disable DAO
;; Author(s): mijoco.btc
;; Move V1 treasury to V2 DAO and close down the dao

(impl-trait  'SP3JP0N1ZXGASRJ0F7QAHWFPGTVK9T2XNXDB908Z.proposal-trait.proposal-trait)

(define-public (execute (sender principal))
	(begin
		
		(try! (contract-call? 'SP10CZMEE431Q48Z9HNN971BKXPKMR4VQAF3EM6GD.bme006-0-treasury stx-transfer u314623733 'SPT94T4HGFN8A99AH4DEE3E5EM7J6JN8FKY8KB7Z.bme006-0-treasury none))

		(try! (contract-call? 'SP10CZMEE431Q48Z9HNN971BKXPKMR4VQAF3EM6GD.bigmarket-dao set-extensions
			(list
				{extension: 'SP10CZMEE431Q48Z9HNN971BKXPKMR4VQAF3EM6GD.bme000-0-governance-token, enabled: false}
				{extension: 'SP10CZMEE431Q48Z9HNN971BKXPKMR4VQAF3EM6GD.bme001-0-proposal-voting, enabled: false}
				{extension: 'SP10CZMEE431Q48Z9HNN971BKXPKMR4VQAF3EM6GD.bme003-0-core-proposals, enabled: false}
				{extension: 'SP10CZMEE431Q48Z9HNN971BKXPKMR4VQAF3EM6GD.bme006-0-treasury, enabled: false}
				{extension: 'SP10CZMEE431Q48Z9HNN971BKXPKMR4VQAF3EM6GD.bme010-0-liquidity-contribution, enabled: false}
				{extension: 'SP10CZMEE431Q48Z9HNN971BKXPKMR4VQAF3EM6GD.bme021-0-market-voting, enabled: false}
				{extension: 'SP10CZMEE431Q48Z9HNN971BKXPKMR4VQAF3EM6GD.bme022-0-market-gating, enabled: false}
				{extension: 'SP10CZMEE431Q48Z9HNN971BKXPKMR4VQAF3EM6GD.bme024-0-market-scalar-pyth, enabled: false}
				{extension: 'SP10CZMEE431Q48Z9HNN971BKXPKMR4VQAF3EM6GD.bme024-0-market-predicting, enabled: false}
				{extension: 'SP10CZMEE431Q48Z9HNN971BKXPKMR4VQAF3EM6GD.bme030-0-reputation-token, enabled: false}
				{extension: 'SP10CZMEE431Q48Z9HNN971BKXPKMR4VQAF3EM6GD.bme008-0-resolution-coordinator, enabled: false}
			)
		))
		(ok true)
	)
)
