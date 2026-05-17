;; BigMarket testnet DAO proposal — add agent wallet to market-creation allowlist
;; Deploy name: bdp-agent-1
;; Deploy from: ST105HCS1RTR7D61EZET8CWNEF24ENEN3V6ARBYBJ (or any wallet)
;; After deploy: ST105HCS....bdp-agent-1 → submit via DAO core-propose
;; Agent wallet added: ST3DHHFQC5K7SYAZHC02RQFAZ4MQQFJYTZW50VAWV

(impl-trait 'SP3JP0N1ZXGASRJ0F7QAHWFPGTVK9T2XNXDB908Z.proposal-trait.proposal-trait)

(define-public (execute (sender principal))
	(begin
		(try! (contract-call? 'ST30Q4WJYHGMYEE1CTGQ334R9M7KQ8ETVQ9NB134T.bme022-0-market-gating set-merkle-root-by-principal 'ST30Q4WJYHGMYEE1CTGQ334R9M7KQ8ETVQ9NB134T.bme024-0-market-predicting 0x6e6c5a0c6576535558f15a5df87625331a021eb1adb34ad016952618255676a9))
		(try! (contract-call? 'ST30Q4WJYHGMYEE1CTGQ334R9M7KQ8ETVQ9NB134T.bme022-0-market-gating set-merkle-root-by-principal 'ST30Q4WJYHGMYEE1CTGQ334R9M7KQ8ETVQ9NB134T.bme024-0-market-scalar-pyth 0x6e6c5a0c6576535558f15a5df87625331a021eb1adb34ad016952618255676a9))
		(ok true)
	)
)
