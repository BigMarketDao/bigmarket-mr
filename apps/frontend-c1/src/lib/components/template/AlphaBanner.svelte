<script lang="ts">
	// import { Button } from '@bigmarket/bm-ui';
	// import { isLoggedIn, connectWallet, showTxModal, watchTransaction, getStxAddress } from '@bigmarket/bm-common';
	import { appConfigStore, requireAppConfig } from '@bigmarket/bm-common';
	// import {
	// 	daoConfigStore,
	// 	requireVaultClient,
	// 	requireDaoConfig
	// } from '@bigmarket/bm-common';
	// import type { TxResult } from '@bigmarket/bm-types';

	// let walletConnected = isLoggedIn();
	const appConfig = $derived(requireAppConfig($appConfigStore));
	// const daoConfig = $derived(requireDaoConfig($daoConfigStore));
	// const MAX_MINT = 1000000000;
	// const authenticateWallet = async () => {
	// 	await connectWallet();
	// 	window.location.reload();
	// };

	// const claimTokens = async () => {
	// 	const response: TxResult = await requireVaultClient($daoConfigStore).claimFaucet(`${daoConfig.VITE_DAO_DEPLOYER}.${daoConfig.VITE_DAO_BIG_PLAY}`, MAX_MINT, getStxAddress());
	// 	if (response.success) {
	// 		showTxModal(response.txid);
	// 		watchTransaction(
	// 			appConfig.VITE_BIGMARKET_API,
	// 			appConfig.VITE_STACKS_API,
	// 			`${daoConfig.VITE_DAO_DEPLOYER}.${daoConfig.VITE_DAO}`,
	// 			response.txid
	// 		);
	// 	} else {
	// 		showTxModal('Unable to process right now');
	// 	}
	// };
</script>

<header
	class="relative top-0 right-0 left-0 z-[999] h-16 border-b border-border bg-background"
>
	<nav
		class="mx-auto flex h-full w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8"
	>
		<div class="font-bold tracking-wide text-foreground">
			BigMarket {appConfig.VITE_NETWORK === 'testnet'
				? appConfig.VITE_NETWORK.toUpperCase()
				: 'ALPHA'}
		</div>

		<div class="flex h-[80%] items-center gap-3 overflow-hidden text-foreground">
			<!-- <div
				class="border-bloodorange relative flex h-4 items-center overflow-hidden border-l-2 pl-2 sm:h-5 lg:h-6"
			>
				<span
					class="text-bloodorange animate-ticker font-mono text-[10px] tracking-wide whitespace-nowrap uppercase sm:text-xs lg:text-sm"
				>
					Mint BIG-PLAY → Participate in markets → Earn BIGR → Redeem for $BIG ownership tokens
				</span>
			</div>

			{#if walletConnected}
				<Button
					onclick={() => claimTokens()}
					class="focus:ring-bloodorange rounded-xl bg-gradient-to-b from-orange-500 to-orange-900 
	px-3 py-1.5 text-xs 
	font-semibold text-white 
	shadow-sm transition-transform hover:scale-105 hover:shadow-md focus:ring-2 
	focus:ring-offset-1 sm:px-4 sm:py-2 
	sm:text-sm md:text-base dark:from-orange-400 
	dark:to-amber-500 dark:focus:ring-orange-400 dark:focus:ring-offset-gray-900"
				>
					MINT BIG-PLAY
				</Button>
			{:else}
				<Button
					onclick={() => authenticateWallet()}
					class="focus:ring-bloodorange rounded-xl bg-gradient-to-b from-orange-500 to-orange-900 
	px-3 py-1.5 text-xs 
	font-semibold text-white 
	shadow-sm transition-transform hover:scale-105 hover:shadow-md focus:ring-2 
	focus:ring-offset-1 sm:px-4 sm:py-2 
	sm:text-sm md:text-base dark:from-orange-400 
	dark:to-amber-500 dark:focus:ring-orange-400 dark:focus:ring-offset-gray-900"
				>
					Connect to Mint
				</Button>
			{/if} -->
		</div>
	</nav>
</header>

<style>
	@keyframes ticker {
		from {
			transform: translateX(100%);
		}
		to {
			transform: translateX(-100%);
		}
	}
	.animate-ticker {
		display: inline-block;
		animation: ticker 18s linear infinite;
		white-space: nowrap;
		will-change: transform;
	}
	.animate-ticker:hover {
		animation-play-state: paused;
	}
</style>
