;; Title: Allowed tokens
;; Author(s): mijoco.btc
;; Description: Includes some major tokens for use in prediction markets 

(impl-trait  'SP3JP0N1ZXGASRJ0F7QAHWFPGTVK9T2XNXDB908Z.proposal-trait.proposal-trait)

(define-public (execute (sender principal))
	(begin
		(try! (contract-call? .bme024-0-market-predicting set-allowed-token 'SP1SCD8ERMTFYE6CK9S0MHWQCP6SY4NAVFJ538A27.wrapped-stx true))
		(try! (contract-call? .bme024-0-market-predicting set-allowed-token 'ST1CV2YGRJA5X8BWS0GP31J9HF56M06CQK8998TSX.bme000-0-governance-token true))
		(try! (contract-call? .bme024-0-market-predicting set-allowed-token 'SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token true))

		(try! (contract-call? .bme024-0-market-scalar-pyth set-allowed-token 'SP1SCD8ERMTFYE6CK9S0MHWQCP6SY4NAVFJ538A27.wrapped-stx true))
		(try! (contract-call? .bme024-0-market-scalar-pyth set-allowed-token 'ST1CV2YGRJA5X8BWS0GP31J9HF56M06CQK8998TSX.bme000-0-governance-token true))
		(try! (contract-call? .bme024-0-market-scalar-pyth set-allowed-token 'SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token true))
		(ok true)
	)
)
