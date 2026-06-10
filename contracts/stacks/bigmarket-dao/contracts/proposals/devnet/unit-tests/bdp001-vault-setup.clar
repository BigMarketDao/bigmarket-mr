;; Title: Vault Setup (unit tests)
;; Description: Enables the cross-chain vault extension and whitelists the SIP-010
;; tokens used by the vault unit tests (sBTC and wrapped-stx).

(impl-trait 'SP3JP0N1ZXGASRJ0F7QAHWFPGTVK9T2XNXDB908Z.proposal-trait.proposal-trait)

(define-public (execute (sender principal))
	(begin
		(try! (contract-call? .bigmarket-dao set-extensions
			(list
				{
					extension: .bme050-0-vault,
					enabled: true,
				}
			)))
		(try! (contract-call? .bme050-0-vault set-token-allowed .sbtc true))
		(try! (contract-call? .bme050-0-vault set-token-allowed .wrapped-stx true))
		(try! (contract-call? .bme050-0-vault set-market-allowed .bme024-0-market-predicting true))
		(try! (contract-call? .bme050-0-vault set-market-allowed .bme024-0-market-scalar-pyth true))
		;; Canonical EIP-712 UTF-8 display strings for simnet deployer (ST1PQ..GZGM.*)
		(try! (contract-call? .bme050-0-vault set-token-eip712-display .sbtc
			0x535431505148514b5630524a585a465931444758384d4e534e5956453356475a4a53525450475a474d2e7362746300000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
			u46))
		(try! (contract-call? .bme050-0-vault set-token-eip712-display .wrapped-stx
			0x535431505148514b5630524a585a465931444758384d4e534e5956453356475a4a53525450475a474d2e777261707065642d737478000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
			u53))
		(ok true)
	)
)
