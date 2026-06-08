;; Title: Move treasury and disable DAO
;; Author(s): mijoco.btc
;; Move V1 treasury to V2 DAO and close down the dao

(impl-trait 'ST31A25YBK50KFJ2QS0EQK9FNXEQJD4PR0828789R.proposal-trait.proposal-trait)

(define-public (execute (sender principal))
	(begin
		
		(try! (contract-call? .bigmarket-dao set-extensions
			(list
				{extension: .bme050-0-vault, enabled: false}
				{extension: .bme050-1-vault, enabled: true}
				;;{extension: .bme024-0-market-scalar-pyth, enabled: false}
				{extension: .bme024-1-market-scalar-pyth, enabled: true}
				;;{extension: .bme024-0-market-predicting, enabled: false}
				{extension: .bme024-1-market-predicting, enabled: true}
			)
		))
		(try! (contract-call? .bme050-1-vault set-token-allowed 'ST30Q4WJYHGMYEE1CTGQ334R9M7KQ8ETVQ9NB134T.usdcx true))
		
		(try! (contract-call? .bme024-1-market-predicting  set-allowed-token 'ST30Q4WJYHGMYEE1CTGQ334R9M7KQ8ETVQ9NB134T.usdcx true))
		(try! (contract-call? .bme024-1-market-scalar-pyth set-allowed-token 'ST30Q4WJYHGMYEE1CTGQ334R9M7KQ8ETVQ9NB134T.usdcx true))
		
		(try! (contract-call? .bme024-1-market-predicting  set-token-minimum-seed 'ST30Q4WJYHGMYEE1CTGQ334R9M7KQ8ETVQ9NB134T.usdcx u100000000))
		(try! (contract-call? .bme024-1-market-scalar-pyth set-token-minimum-seed 'ST30Q4WJYHGMYEE1CTGQ334R9M7KQ8ETVQ9NB134T.usdcx u100000000))




		(try! (contract-call? .bme022-0-market-gating set-merkle-root-by-principal .bme024-0-market-predicting 0x26067618f71da1da6fa33c9b7f8d989b87f71ade892e1c55ce3b46ac79a7e64e))
		(try! (contract-call? .bme022-0-market-gating set-merkle-root-by-principal .bme024-0-market-scalar-pyth 0x26067618f71da1da6fa33c9b7f8d989b87f71ade892e1c55ce3b46ac79a7e64e))
		(try! (contract-call? .bme022-0-market-gating set-merkle-root-by-principal .bme024-1-market-predicting 0x189ce7e2c99b1d13fd436e001dc120d28d697548017d248de79b7529649f48e9))
		(try! (contract-call? .bme022-0-market-gating set-merkle-root-by-principal .bme024-1-market-scalar-pyth 0x189ce7e2c99b1d13fd436e001dc120d28d697548017d248de79b7529649f48e9))
		
		(try! (contract-call? .bme024-1-market-predicting set-resolution-agent 'ST167Z6WFHMV0FZKFCRNWZ33WTB0DFBCW9M1FW3AY))
		(try! (contract-call? .bme024-1-market-predicting set-dev-fund 'ST2XFH8D1MM2G11C0S6AZRSNP031RAY92XFABDE58))
		(try! (contract-call? .bme024-1-market-predicting set-dao-treasury .bme006-0-treasury))
		(try! (contract-call? .bme024-1-market-predicting set-creation-gated true))
		(try! (contract-call? .bme024-1-market-predicting set-allowed-token 'ST2X0FMCBMBK3F41WVS8PKN75PF9H5ZDRJB7H600B.wrapped-stx true))
		(try! (contract-call? .bme024-1-market-predicting set-allowed-token .bme000-0-governance-token true))
		(try! (contract-call? .bme024-1-market-predicting set-allowed-token 'ST1F7QA2MDF17S807EPA36TSS8AMEFY4KA9TVGWXT.sbtc-token true))
		(try! (contract-call? .bme024-1-market-predicting set-market-fee-bips-max u1000))
		(try! (contract-call? .bme024-1-market-predicting set-token-minimum-seed 'ST2X0FMCBMBK3F41WVS8PKN75PF9H5ZDRJB7H600B.wrapped-stx u100000000))
		(try! (contract-call? .bme024-1-market-predicting set-token-minimum-seed .bme000-0-governance-token u100000000))
		(try! (contract-call? .bme024-1-market-predicting set-token-minimum-seed 'ST1F7QA2MDF17S807EPA36TSS8AMEFY4KA9TVGWXT.sbtc-token u100000000))

		(try! (contract-call? .bme024-1-market-scalar-pyth set-resolution-agent 'ST167Z6WFHMV0FZKFCRNWZ33WTB0DFBCW9M1FW3AY))
		(try! (contract-call? .bme024-1-market-scalar-pyth set-dev-fund 'ST2XFH8D1MM2G11C0S6AZRSNP031RAY92XFABDE58))
		(try! (contract-call? .bme024-1-market-scalar-pyth set-dao-treasury .bme006-0-treasury))
		(try! (contract-call? .bme024-1-market-scalar-pyth set-creation-gated true))
		(try! (contract-call? .bme024-1-market-scalar-pyth set-allowed-token 'ST2X0FMCBMBK3F41WVS8PKN75PF9H5ZDRJB7H600B.wrapped-stx true))
		(try! (contract-call? .bme024-1-market-scalar-pyth set-allowed-token .bme000-0-governance-token true))
		(try! (contract-call? .bme024-1-market-scalar-pyth set-allowed-token 'ST1F7QA2MDF17S807EPA36TSS8AMEFY4KA9TVGWXT.sbtc-token true))
		;; STXUSD / BTCUSD / SOLUSD / ETHUSD
		(try! (contract-call? .bme024-1-market-scalar-pyth set-price-band-width 0xec7a775f46379b5e943c3526b1c8d54cd49749176b0b98e02dde68d1bd335c17 u2000))
		(try! (contract-call? .bme024-1-market-scalar-pyth set-price-band-width 0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43 u1000))
		(try! (contract-call? .bme024-1-market-scalar-pyth set-price-band-width 0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d u500))
		(try! (contract-call? .bme024-1-market-scalar-pyth set-price-band-width 0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace u1000))
		
		(try! (contract-call? .bme024-1-market-scalar-pyth set-market-fee-bips-max u1000))
		(try! (contract-call? .bme024-1-market-scalar-pyth set-token-minimum-seed 'ST2X0FMCBMBK3F41WVS8PKN75PF9H5ZDRJB7H600B.wrapped-stx u100000000))
		(try! (contract-call? .bme024-1-market-scalar-pyth set-token-minimum-seed .bme000-0-governance-token u100000000))
		(try! (contract-call? .bme024-1-market-scalar-pyth set-token-minimum-seed 'ST1F7QA2MDF17S807EPA36TSS8AMEFY4KA9TVGWXT.sbtc-token u100000000))


		(ok true)
	)
)
