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
		(ok true)
	)
)
