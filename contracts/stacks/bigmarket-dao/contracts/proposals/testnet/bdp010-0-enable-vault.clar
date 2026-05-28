;; Title: Move treasury and disable DAO
;; Author(s): mijoco.btc
;; Move V1 treasury to V2 DAO and close down the dao

(impl-trait 'ST31A25YBK50KFJ2QS0EQK9FNXEQJD4PR0828789R.proposal-trait.proposal-trait)

(define-public (execute (sender principal))
	(begin
		
		(try! (contract-call? .bigmarket-dao set-extensions
			(list
				{extension: .bme050-0-vault, enabled: true}
			)
		))
		(try! (contract-call? .bme050-0-vault set-token-allowed 'ST30Q4WJYHGMYEE1CTGQ334R9M7KQ8ETVQ9NB134T.usdcx true))
		;; (try! (contract-call? .bme050-0-vault set-token-allowed 'ST1F7QA2MDF17S807EPA36TSS8AMEFY4KA9TVGWXT.sbtc-token true))
		;; (try! (contract-call? .bme050-0-vault set-token-allowed 'ST2X0FMCBMBK3F41WVS8PKN75PF9H5ZDRJB7H600B.wrapped-stx true))
		;; (try! (contract-call? .bme050-0-vault set-token-allowed 'ST30Q4WJYHGMYEE1CTGQ334R9M7KQ8ETVQ9NB134T.bme000-0-governance-token true))
		
		(try! (contract-call? .bme024-0-market-predicting  set-allowed-token 'ST30Q4WJYHGMYEE1CTGQ334R9M7KQ8ETVQ9NB134T.usdcx true))
		(try! (contract-call? .bme024-0-market-scalar-pyth set-allowed-token 'ST30Q4WJYHGMYEE1CTGQ334R9M7KQ8ETVQ9NB134T.usdcx true))
		
		(try! (contract-call? .bme024-0-market-predicting  set-token-minimum-seed 'ST30Q4WJYHGMYEE1CTGQ334R9M7KQ8ETVQ9NB134T.usdcx u100000000))
		(try! (contract-call? .bme024-0-market-scalar-pyth set-token-minimum-seed 'ST30Q4WJYHGMYEE1CTGQ334R9M7KQ8ETVQ9NB134T.usdcx u100000000))

		(try! (contract-call? 'ST30Q4WJYHGMYEE1CTGQ334R9M7KQ8ETVQ9NB134T.usdcx mint-many
			(list
				{
					amount: u1000000000000000,
					recipient: .univ2-router,
				}
				{
					amount: u1000000000000000,
					recipient: 'ST30Q4WJYHGMYEE1CTGQ334R9M7KQ8ETVQ9NB134T,
				}
				{
					amount: u1000000000000000,
					recipient: 'ST2ST2H80NP5C9SPR4ENJ1Z9CDM9PKAJVPYWPQZ50,
				}
			)))

		(ok true)
	)
)
