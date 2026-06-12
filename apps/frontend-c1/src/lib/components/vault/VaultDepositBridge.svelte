<script lang="ts">
	import { onMount } from 'svelte';
	import { Button } from '@bigmarket/bm-ui';
	import { stacks } from '@bigmarket/sdk';
	import { appConfigStore, requireAppConfig, walletState, initWallet } from '@bigmarket/bm-common';
	import { registerDepositIntent } from '@bigmarket/bm-utilities';

	const appConfig = $derived(requireAppConfig($appConfigStore));

	let amount = $state('');
	let tokenSymbol = $state<'USDC' | 'USDT'>('USDC');
	let busy = $state(false);
	let errorMsg = $state<string | null>(null);
	let approveTxHash = $state<string | null>(null);
	let txHash = $state<string | null>(null);

	const tokenSymbolDestination = $derived(tokenSymbol === 'USDT' ? 'USDTx' : 'USDCx');
	const isTestnet = $derived(appConfig.VITE_NETWORK !== 'mainnet');
	const explorerOrigin = $derived(
		appConfig.VITE_NETWORK === 'mainnet' ? 'https://etherscan.io' : 'https://sepolia.etherscan.io'
	);
	const explorerApproveTxUrl = $derived(
		approveTxHash ? `${explorerOrigin}/tx/${approveTxHash}` : null
	);
	const explorerTxUrl = $derived(txHash ? `${explorerOrigin}/tx/${txHash}` : null);

	const mappedStx = $derived($walletState.activeAccount?.mappedAddress?.trim() ?? '');
	const mappedStxExplorerUrl = $derived(
		mappedStx.length > 0
			? stacks.explorerAddressUrl(
					appConfig.VITE_NETWORK,
					appConfig.VITE_STACKS_EXPLORER,
					mappedStx
				)
			: null
	);
	const ethAddress = $derived($walletState.accounts.find((a) => a.type === 'eth')?.address ?? '');

	const ready = $derived(
		$walletState.status === 'connected' &&
			$walletState.chain === 'ethereum' &&
			ethAddress.length > 0 &&
			mappedStx.length > 0
	);

	const canSubmit = $derived(
		ready &&
			!busy &&
			amount.trim().length > 0 &&
			Number(amount) > 0 &&
			Number.isFinite(Number(amount))
	);

	onMount(() => void initWallet(appConfig.VITE_BIGMARKET_API));

	async function submit() {
		if (!canSubmit) return;
		errorMsg = null;
		approveTxHash = null;
		txHash = null;
		busy = true;
		try {
			const { approveAllbridgeDepositIfNeeded, sendAllbridgeDeposit, ChainSymbol } =
				await import('@bigmarket/sdk/ethereum');

			const base = {
				amount: amount.trim(),
				sourceAddress: ethAddress,
				sourceChain: ChainSymbol.ETH,
				destinationChain: ChainSymbol.STX,
				tokenSymbol,
				tokenSymbolDestination,
				stxIsTestnet: isTestnet
			};

			const approveResult = await approveAllbridgeDepositIfNeeded(base);
			if (!approveResult.alreadyApproved) approveTxHash = approveResult.txHash;

			const intentRes = await registerDepositIntent(appConfig.VITE_BIGMARKET_API, base);
			if (!intentRes.ok) throw new Error(await intentRes.text());
			const { intentId } = (await intentRes.json()) as { intentId: string };

			const { txHash: hash } = await sendAllbridgeDeposit({ ...base, toAccountAddress: mappedStx });
			txHash = hash;

			const submittedRes = await fetch(
				`${appConfig.VITE_BIGMARKET_API}/cross-chain/intents/${intentId}/submitted`,
				{
					method: 'POST',
					headers: { 'content-type': 'application/json' },
					body: JSON.stringify({ sourceTxHash: hash })
				}
			);
			if (!submittedRes.ok) throw new Error(await submittedRes.text());
		} catch (e) {
			errorMsg = e instanceof Error ? e.message : String(e);
		} finally {
			busy = false;
		}
	}
</script>

<div
	class="w-full space-y-5 rounded-lg border border-neutral-200 bg-neutral-50/80 p-5 dark:border-neutral-700 dark:bg-neutral-900/40"
>
	<p class="text-xs leading-relaxed text-neutral-600 dark:text-neutral-400">
		Bridge {tokenSymbol} from Ethereum to your mapped relay address on Stacks. After AllBridge and the
		relayer confirm, {tokenSymbolDestination} is swept into your vault so you can trade on BigMarket.
	</p>

	{#if $walletState.status !== 'connected'}
		<p class="text-sm text-amber-800 dark:text-amber-200">
			Connect <strong>MetaMask</strong> to bridge USDC from Ethereum.
		</p>
	{:else if $walletState.chain !== 'ethereum'}
		<p class="text-sm text-amber-800 dark:text-amber-200">
			Switch to an <strong>Ethereum</strong> connection (MetaMask) to deposit.
		</p>
	{:else if !mappedStx}
		<p class="text-sm text-amber-800 dark:text-amber-200">
			No mapped Stacks address found. Ensure the API can resolve your Ethereum address, then refresh
			or reconnect.
		</p>
	{:else}
		<!-- Address summary -->
		<div class="space-y-1 font-mono text-xs text-neutral-700 dark:text-neutral-300">
			{#if ethAddress}
				<p>
					<span class="text-neutral-500 dark:text-neutral-400">From (ETH)</span>
					<span class="mt-0.5 block break-all">{ethAddress}</span>
				</p>
			{/if}
			<p>
				<span class="text-neutral-500 dark:text-neutral-400">To (Stacks / mapped)</span>
				<span class="mt-0.5 block break-all">{mappedStx}</span>
			</p>
		</div>

		<!-- Token selector -->
		<div class="space-y-1">
			<label
				class="block text-xs font-medium text-neutral-700 dark:text-neutral-300"
				for="bm-db-token"
			>
				Token
			</label>
			<select
				id="bm-db-token"
				bind:value={tokenSymbol}
				class="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 shadow-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:outline-none dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100"
			>
				<option value="USDC">USDC</option>
				<option value="USDT">USDT</option>
			</select>
		</div>

		<!-- Amount -->
		<div class="space-y-1">
			<label
				class="block text-xs font-medium text-neutral-700 dark:text-neutral-300"
				for="bm-db-amount"
			>
				Amount
			</label>
			<input
				id="bm-db-amount"
				type="text"
				inputmode="decimal"
				placeholder="e.g. 100"
				bind:value={amount}
				class="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 shadow-sm placeholder:text-neutral-400 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:outline-none dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100"
			/>
		</div>

		<!-- Error -->
		{#if errorMsg}
			<p class="text-sm text-red-700 dark:text-red-300">{@html errorMsg}</p>
		{/if}

		<!-- Approval tx -->
		{#if approveTxHash}
			<p class="text-xs text-neutral-700 dark:text-neutral-300">
				Approval tx:
				{#if explorerApproveTxUrl}
					<a
						class="font-mono break-all underline"
						href={explorerApproveTxUrl}
						target="_blank"
						rel="noreferrer"
					>
						{approveTxHash}
					</a>
				{:else}
					<span class="font-mono break-all">{approveTxHash}</span>
				{/if}
			</p>
		{/if}

		<!-- Bridge tx -->
		{#if txHash}
			<div
				class="space-y-2.5 rounded-md border border-amber-200 bg-amber-50/60 p-3 dark:border-amber-700/50 dark:bg-amber-900/10"
				role="status"
			>
				<p class="text-xs font-medium text-emerald-800 dark:text-emerald-200">
					Ethereum bridge transaction submitted — not finished yet.
				</p>
				<p class="text-xs text-neutral-700 dark:text-neutral-300">
					<span class="text-neutral-500 dark:text-neutral-400">Ethereum tx</span>
					{#if explorerTxUrl}
						<a
							class="mt-0.5 block font-mono break-all underline"
							href={explorerTxUrl}
							target="_blank"
							rel="noreferrer"
						>
							{txHash}
						</a>
					{:else}
						<span class="mt-0.5 block font-mono break-all">{txHash}</span>
					{/if}
				</p>
				<p class="text-xs leading-relaxed text-amber-900 dark:text-amber-100">
					<strong>Please wait.</strong> AllBridge and our relayer can take several minutes to deliver
					{tokenSymbolDestination} on Stacks. Your deposit is not in the vault until the sweep completes.
				</p>
				<ul
					class="list-inside list-disc space-y-1 text-xs leading-relaxed text-amber-800 dark:text-amber-200"
				>
					<li>
						Check your mapped relay address on the Stacks explorer for incoming {tokenSymbolDestination}.
					</li>
					<li>
						Once it arrives, the relayer sweeps it into your vault balance automatically (usually
						within a minute).
					</li>
					<li>
						If it does not sweep, use <strong>Sweep mapped address → vault</strong> below once
						{tokenSymbolDestination} shows on your relay address.
					</li>
				</ul>
				{#if mappedStx && mappedStxExplorerUrl}
					<p class="text-xs text-neutral-700 dark:text-neutral-300">
						<span class="text-neutral-500 dark:text-neutral-400">Relay address (Stacks)</span>
						<a
							class="mt-0.5 block break-all font-mono underline"
							href={mappedStxExplorerUrl}
							target="_blank"
							rel="noreferrer"
						>
							{mappedStx}
						</a>
					</p>
				{/if}
			</div>
		{/if}

		<Button type="button" onclick={submit} disabled={!canSubmit} class="w-full cursor-pointer">
			{busy ? 'Confirm in wallet…' : `Bridge ${tokenSymbol} → Stacks`}
		</Button>
	{/if}
</div>
