;; Title: Gating
;; Author(s): mijoco.btc
;; Synopsis:
;; Description:

(impl-trait  'SP3JP0N1ZXGASRJ0F7QAHWFPGTVK9T2XNXDB908Z.proposal-trait.proposal-trait)

(define-public (execute (sender principal))
	(begin
		(try! (contract-call? .bme024-0-market-scalar-pyth set-allowed-token
			'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.tusdh false
		))
		(try! (contract-call? .bme024-0-market-scalar-pyth set-allowed-token
			'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.tpepe false
		))
		(try! (contract-call? .bme024-0-market-predicting set-allowed-token
			'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.tusdh false
		))
		(try! (contract-call? .bme024-0-market-predicting set-allowed-token
			'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.tpepe false
		))

		(try! (contract-call? .bme024-0-market-scalar-pyth set-allowed-token
			'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.usdcx true
		))
		(try! (contract-call? .bme024-0-market-scalar-pyth set-token-minimum-seed
			'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.usdcx u100
		))
		(try! (contract-call? .bme024-0-market-predicting set-allowed-token
			'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.usdcx true
		))
		(try! (contract-call? .bme024-0-market-predicting set-token-minimum-seed
			'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.usdcx u100
		))
		(try! (contract-call? .bme050-0-vault set-token-allowed
			'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.usdcx true
		))
				(try! (contract-call? 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.usdcx mint-many
			(list
				{
					amount: u1000000000000000,
					recipient: .univ2-router,
				}
				{
					amount: u1000000000000000,
					recipient: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM,
				}
				{
					amount: u1000000000000000,
					recipient: 'ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5,
				}
				{
					amount: u1000000000000000,
					recipient: 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG,
				}
				{
					amount: u1000000000000000,
					recipient: 'ST2JHG361ZXG51QTKY2NQCVBPPRRE2KZB1HR05NNC,
				}
				{
					amount: u1000000000000000,
					recipient: 'ST2NEB84ASENDXKYGJPQW86YXQCEFEX2ZQPG87ND,
				}
				{
					amount: u1000000000000000,
					recipient: 'ST3NBRSFKX28FQ2ZJ1MAKX58HKHSDGNV5N7R21XCP,
				}
			)))

		(ok true)
	)
)
