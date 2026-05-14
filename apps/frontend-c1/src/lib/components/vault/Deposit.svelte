<script lang="ts">
	import { onMount } from 'svelte';
	import { Button } from '@bigmarket/bm-ui';
	import { stacks } from '@bigmarket/sdk';
	import { appConfigStore, requireAppConfig, walletState, initWallet } from '@bigmarket/bm-common';

	const appConfig = $derived(requireAppConfig($appConfigStore));

	let flow = $state<'deposit' | 'withdraw'>('deposit');
	let amount = $state('100');
	let tokenSymbol = $state<'USDC' | 'USDT'>('USDC');
	/** For withdraw: Ethereum address that receives USDC / USDT. */
	let ethRecipient = $state('');
	let busy = $state(false);
	let errorMsg = $state<string | null>(null);
	let approveTxHash = $state<string | null>(null);
	let txHash = $state<string | null>(null);

	const tokenSymbolDestination = $derived(tokenSymbol === 'USDT' ? 'USDTx' : 'USDCx');

	const tokenSymbolSourceStx = $derived(tokenSymbol === 'USDT' ? 'USDTx' : 'USDCx');

	const tokenSymbolDestEth = $derived(tokenSymbol);

	const isTestnet = $derived(appConfig.VITE_NETWORK !== 'mainnet');

	const explorerEthOrigin = $derived(
		appConfig.VITE_NETWORK === 'mainnet' ? 'https://etherscan.io' : 'https://sepolia.etherscan.io'
	);

	const explorerEthTxUrl = $derived(
		flow === 'deposit' && txHash ? `${explorerEthOrigin}/tx/${txHash}` : null
	);
	const explorerEthApproveUrl = $derived(
		flow === 'deposit' && approveTxHash ? `${explorerEthOrigin}/tx/${approveTxHash}` : null
	);

	const explorerStxTxUrl = $derived(
		flow === 'withdraw' && txHash
			? stacks.explorerTxUrl(appConfig.VITE_NETWORK, appConfig.VITE_STACKS_EXPLORER, txHash)
			: null
	);

	const mappedStx = $derived($walletState.activeAccount?.mappedAddress?.trim() ?? '');
	const ethAddress = $derived($walletState.accounts.find((a) => a.type === 'eth')?.address ?? '');
	const stxAddress = $derived($walletState.accounts.find((a) => a.type === 'stx')?.address ?? '');

	const ethRecipientOk = $derived(/^0x[a-fA-F0-9]{40}$/.test(ethRecipient.trim()));

	const readyDeposit = $derived(
		$walletState.status === 'connected' &&
			$walletState.chain === 'ethereum' &&
			mappedStx.length > 0 &&
			ethAddress.length > 0
	);

	const readyWithdraw = $derived(
		$walletState.status === 'connected' &&
			$walletState.chain === 'stacks' &&
			stxAddress.length > 0 &&
			ethRecipientOk
	);

	const ready = $derived(flow === 'deposit' ? readyDeposit : readyWithdraw);

	const canSubmit = $derived(
		ready &&
			!busy &&
			amount.trim().length > 0 &&
			Number(amount) > 0 &&
			Number.isFinite(Number(amount))
	);

	onMount(() => {
		void initWallet(appConfig.VITE_BIGMARKET_API);
	});

	async function bridgeToStacks() {
		errorMsg = null;
		approveTxHash = null;
		txHash = null;
		if (!canSubmit || flow !== 'deposit') return;

		busy = true;
		try {
			const { approveAllbridgeDepositIfNeeded, sendAllbridgeDeposit, ChainSymbol } =
				await import('@bigmarket/sdk/ethereum');

			const base = {
				amount: amount.trim(),
				sourceChain: ChainSymbol.ETH,
				destinationChain: ChainSymbol.STX,
				tokenSymbol,
				tokenSymbolDestination,
				stxIsTestnet: isTestnet
			};

			const approveResult = await approveAllbridgeDepositIfNeeded(base);
			if (!approveResult.alreadyApproved) {
				approveTxHash = approveResult.txHash;
			}

			const { txHash: hash } = await sendAllbridgeDeposit({
				...base,
				toAccountAddress: mappedStx
			});

			txHash = hash;
		} catch (e) {
			errorMsg = e instanceof Error ? e.message : String(e);
		} finally {
			busy = false;
		}
	}

	async function bridgeToEthereum() {
		errorMsg = null;
		approveTxHash = null;
		txHash = null;
		if (!canSubmit || flow !== 'withdraw') return;

		busy = true;
		try {
			const { sendAllbridgeWithdraw, ChainSymbol } = await import('@bigmarket/sdk/ethereum');

			const { txHash: hash } = await sendAllbridgeWithdraw({
				amount: amount.trim(),
				fromAccountAddress: stxAddress,
				toAccountAddress: ethRecipient.trim(),
				sourceChain: ChainSymbol.STX,
				destinationChain: ChainSymbol.ETH,
				tokenSymbol: tokenSymbolSourceStx,
				tokenSymbolDestination: tokenSymbolDestEth,
				stxIsTestnet: isTestnet
			});

			txHash = hash;
		} catch (e) {
			errorMsg = e instanceof Error ? e.message : String(e);
		} finally {
			busy = false;
		}
	}

	function onSubmit() {
		if (flow === 'deposit') void bridgeToStacks();
		else void bridgeToEthereum();
	}
</script>

<div
	class="w-full max-w-lg space-y-5 rounded-lg border border-neutral-200 bg-neutral-50/80 p-5 dark:border-neutral-700 dark:bg-neutral-900/40"
>
	<h2 class="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Vault bridge</h2>

	<div
		class="flex gap-2 rounded-md border border-neutral-200 p-1 dark:border-neutral-600"
		role="tablist"
	>
		<button
			type="button"
			id="bm-vault-flow-deposit"
			aria-pressed={flow === 'deposit'}
			aria-controls="bm-vault-flow-panel"
			class="flex-1 rounded px-3 py-1.5 text-xs font-medium transition-colors {flow === 'deposit'
				? 'bg-orange-500 text-white shadow-sm'
				: 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800'}"
			onclick={() => {
				flow = 'deposit';
				errorMsg = null;
				txHash = null;
				approveTxHash = null;
			}}
		>
			Deposit to Stacks
		</button>
		<button
			type="button"
			id="bm-vault-flow-withdraw"
			aria-pressed={flow === 'withdraw'}
			aria-controls="bm-vault-flow-panel"
			class="flex-1 rounded px-3 py-1.5 text-xs font-medium transition-colors {flow === 'withdraw'
				? 'bg-orange-500 text-white shadow-sm'
				: 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800'}"
			onclick={() => {
				flow = 'withdraw';
				errorMsg = null;
				txHash = null;
				approveTxHash = null;
			}}
		>
			Withdraw to Ethereum
		</button>
	</div>

	{#if flow === 'deposit'}
		<p
			id="bm-vault-flow-panel"
			class="text-xs leading-relaxed text-neutral-600 dark:text-neutral-400"
		>
			Send {tokenSymbol} from Ethereum (MetaMask) to your mapped BigMarket Stacks address via Allbridge.
		</p>
	{:else}
		<p
			id="bm-vault-flow-panel"
			class="text-xs leading-relaxed text-neutral-600 dark:text-neutral-400"
		>
			Send {tokenSymbolSourceStx} from Stacks (Hiro wallet) to your Ethereum address as {tokenSymbolDestEth}
			via Allbridge.
		</p>
	{/if}

	{#if $walletState.status !== 'connected'}
		<p class="text-sm text-amber-800 dark:text-amber-200">
			Connect your wallet, then open this page again.
		</p>
	{:else if flow === 'deposit' && $walletState.chain !== 'ethereum'}
		<p class="text-sm text-amber-800 dark:text-amber-200">
			Switch to an Ethereum connection: connect with MetaMask so your chain is <strong
				>ethereum</strong
			>.
		</p>
	{:else if flow === 'deposit' && !mappedStx}
		<p class="text-sm text-amber-800 dark:text-amber-200">
			No mapped Stacks address yet. Ensure the API can resolve your Ethereum address (cross-chain
			mapping), then refresh or reconnect.
		</p>
	{:else if flow === 'withdraw' && $walletState.chain !== 'stacks'}
		<p class="text-sm text-amber-800 dark:text-amber-200">
			Switch to a Stacks connection so your chain is <strong>stacks</strong> (Hiro or compatible wallet).
		</p>
	{:else if flow === 'withdraw' && !stxAddress}
		<p class="text-sm text-amber-800 dark:text-amber-200">
			No Stacks address in session. Reconnect your wallet and choose a Stacks account.
		</p>
	{/if}

	<div class="space-y-1 font-mono text-xs text-neutral-700 dark:text-neutral-300">
		{#if flow === 'deposit'}
			{#if ethAddress}
				<p>
					<span class="text-neutral-500 dark:text-neutral-400">From (ETH)</span>
					<span class="mt-0.5 block break-all">{ethAddress}</span>
				</p>
			{/if}
			{#if mappedStx}
				<p>
					<span class="text-neutral-500 dark:text-neutral-400">To (Stacks / mapped)</span>
					<span class="mt-0.5 block break-all">{mappedStx}</span>
				</p>
			{/if}
		{:else}
			{#if stxAddress}
				<p>
					<span class="text-neutral-500 dark:text-neutral-400">From (Stacks)</span>
					<span class="mt-0.5 block break-all">{stxAddress}</span>
				</p>
			{/if}
			<p>
				<span class="text-neutral-500 dark:text-neutral-400">To (ETH)</span>
				<span class="mt-0.5 block break-all text-neutral-400 italic"
					>{ethRecipientOk ? ethRecipient.trim() : 'Enter recipient below'}</span
				>
			</p>
		{/if}
	</div>

	<div class="space-y-2">
		<label
			class="block text-xs font-medium text-neutral-700 dark:text-neutral-300"
			for="bm-vault-token">Token</label
		>
		<select
			id="bm-vault-token"
			bind:value={tokenSymbol}
			class="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 shadow-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:outline-none dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100"
		>
			<option value="USDC">USDC</option>
			<option value="USDT">USDT</option>
		</select>
	</div>

	{#if flow === 'withdraw'}
		<div class="space-y-2">
			<label
				class="block text-xs font-medium text-neutral-700 dark:text-neutral-300"
				for="bm-vault-eth-recipient">Recipient on Ethereum (0x…)</label
			>
			<input
				id="bm-vault-eth-recipient"
				type="text"
				autocomplete="off"
				placeholder="0x..."
				bind:value={ethRecipient}
				class="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 font-mono text-sm text-neutral-900 shadow-sm placeholder:text-neutral-400 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:outline-none dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100"
			/>
			<p class="text-[11px] leading-relaxed text-neutral-500 dark:text-neutral-400">
				Use the address where you want to receive {tokenSymbolDestEth} (for example your MetaMask account).
			</p>
		</div>
	{/if}

	<div class="space-y-2">
		<label
			class="block text-xs font-medium text-neutral-700 dark:text-neutral-300"
			for="bm-vault-amount">Amount</label
		>
		<input
			id="bm-vault-amount"
			type="text"
			inputmode="decimal"
			placeholder="e.g. 100"
			bind:value={amount}
			class="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 shadow-sm placeholder:text-neutral-400 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:outline-none dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100"
		/>
	</div>

	{#if errorMsg}
		<p class="text-sm text-red-700 dark:text-red-300">{errorMsg}</p>
	{/if}

	{#if flow === 'deposit' && explorerEthApproveUrl}
		<p class="text-xs text-neutral-700 dark:text-neutral-300">
			Approval tx:
			<a
				class="font-mono break-all underline"
				href={explorerEthApproveUrl}
				target="_blank"
				rel="noreferrer">{approveTxHash}</a
			>
		</p>
	{:else if flow === 'deposit' && approveTxHash}
		<p class="text-xs text-neutral-700 dark:text-neutral-300">
			Approval tx: <span class="font-mono break-all">{approveTxHash}</span>
		</p>
	{/if}

	{#if flow === 'deposit' && explorerEthTxUrl}
		<p class="text-xs text-emerald-800 dark:text-emerald-200">
			Bridge transaction sent.
			<a
				class="font-mono break-all underline"
				href={explorerEthTxUrl}
				target="_blank"
				rel="noreferrer">{txHash}</a
			>
		</p>
	{:else if flow === 'withdraw' && explorerStxTxUrl}
		<p class="text-xs text-emerald-800 dark:text-emerald-200">
			Stacks transaction sent. Funds will arrive on Ethereum after Allbridge completes the transfer.
			<a
				class="font-mono break-all underline"
				href={explorerStxTxUrl}
				target="_blank"
				rel="noreferrer">{txHash}</a
			>
		</p>
	{:else if txHash}
		<p class="text-xs text-emerald-800 dark:text-emerald-200">
			Transaction sent. <span class="font-mono break-all">{txHash}</span>
		</p>
	{/if}

	<Button type="button" onclick={onSubmit} disabled={!canSubmit} class="w-full cursor-pointer">
		{busy
			? 'Confirm in wallet…'
			: flow === 'deposit'
				? `Bridge ${tokenSymbol} to Stacks`
				: `Bridge ${tokenSymbolSourceStx} to Ethereum`}
	</Button>
</div>
