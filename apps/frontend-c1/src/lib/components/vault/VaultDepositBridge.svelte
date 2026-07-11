<script lang="ts">
	import { onMount } from 'svelte';
	import { Button } from '@bigmarket/bm-ui';
	import { stacks } from '@bigmarket/sdk';
	import { appConfigStore, requireAppConfig, walletState, initWallet } from '@bigmarket/bm-common';
	import { registerDepositIntent } from '@bigmarket/bm-utilities';
	import { ArrowDown } from 'lucide-svelte';

	const appConfig = $derived(requireAppConfig($appConfigStore));

	let amount = $state('');
	let tokenSymbol = $state<'USDC' | 'USDT'>('USDC');
	let busy = $state(false);
	let errorMsg = $state<string | null>(null);
	let approveTxHash = $state<string | null>(null);
	let txHash = $state<string | null>(null);
	let bridgeAmount = $state<string | null>(null);

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
			? stacks.explorerAddressUrl(appConfig.VITE_NETWORK, appConfig.VITE_STACKS_EXPLORER, mappedStx)
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

	const bridgeSubmitted = $derived(txHash !== null);
	const approveOnly = $derived(approveTxHash !== null && txHash === null && !errorMsg);
	const bridgeStepFailed = $derived(approveTxHash !== null && txHash === null && errorMsg !== null);

	onMount(() => void initWallet(appConfig.VITE_BIGMARKET_API));

	async function submit() {
		if (!canSubmit) return;
		errorMsg = null;
		busy = true;
		const bridgeAmountInput = amount.trim();
		try {
			const { approveAllbridgeDepositIfNeeded, sendAllbridgeDeposit, ChainSymbol } =
				await import('@bigmarket/sdk/ethereum');

			const base = {
				amount: bridgeAmountInput,
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
			bridgeAmount = bridgeAmountInput;

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
			const raw = e instanceof Error ? e.message : String(e);
			if (approveTxHash && !txHash) {
				errorMsg =
					'Approval is done on Ethereum, but the AllBridge transfer could not be submitted. ' +
					'Click Bridge again — MetaMask should only prompt for the bridge transaction.';
				if (!raw.includes('Buffer is not defined')) {
					errorMsg += ` (${raw})`;
				}
			} else {
				errorMsg = raw;
			}
		} finally {
			busy = false;
		}
	}
</script>

<div
	class="w-full space-y-5 rounded-lg border border-neutral-200 bg-neutral-50/80 p-5 dark:border-neutral-700 dark:bg-neutral-900/40"
>
	<p class="text-xs leading-relaxed text-neutral-600 dark:text-neutral-400">
		Bridge {tokenSymbol} from Ethereum to your mapped relay address on Stacks. After AllBridge delivers
		{tokenSymbolDestination} (typically ~20 minutes), sweep it into the vault below to trade on BigMarket.
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
				disabled={bridgeSubmitted}
				class="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 shadow-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:outline-none disabled:opacity-60 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100"
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
				disabled={bridgeSubmitted}
				class="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 shadow-sm placeholder:text-neutral-400 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:outline-none disabled:opacity-60 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100"
			/>
		</div>

		<!-- Bridge submitted — primary success state -->
		{#if bridgeSubmitted}
			<div
				class="space-y-2.5 rounded-md border border-emerald-200 bg-emerald-50/70 p-4 dark:border-emerald-800/50 dark:bg-emerald-950/20"
				role="status"
			>
				<p class="text-sm font-semibold text-emerald-900 dark:text-emerald-100">
					Bridge submitted — your transfer is in progress
				</p>
				<p class="text-xs leading-relaxed text-emerald-800 dark:text-emerald-200">
					AllBridge transfers from Ethereum to Stacks usually take <strong>about 20 minutes</strong>
					on average (sometimes faster, sometimes longer). This is normal — your funds are not lost.
				</p>
				{#if bridgeAmount}
					<p class="text-xs text-emerald-800 dark:text-emerald-200">
						Amount: <strong>{bridgeAmount} {tokenSymbol}</strong> → {tokenSymbolDestination} on your mapped
						relay address.
					</p>
				{/if}
				{#if explorerTxUrl}
					<p class="text-xs text-neutral-700 dark:text-neutral-300">
						<span class="text-neutral-500 dark:text-neutral-400">Ethereum bridge tx</span>
						<a
							class="mt-0.5 block font-mono break-all underline"
							href={explorerTxUrl}
							target="_blank"
							rel="noreferrer"
						>
							{txHash}
						</a>
					</p>
				{/if}
				<ul
					class="list-inside list-disc space-y-1 text-xs leading-relaxed text-emerald-800/90 dark:text-emerald-200/90"
				>
					<li>
						When {tokenSymbolDestination} arrives, the relayer will sweep it to your vault. - you can
						also manually <strong>sweep mapped address → vault</strong>
						using the form below <ArrowDown class="h-4 w-4" />.
					</li>
					<li>Funds are not in your vault balance until the sweep completes.</li>
				</ul>
				{#if mappedStxExplorerUrl}
					<p class="text-xs text-neutral-700 dark:text-neutral-300">
						<a
							class="font-mono underline"
							href={mappedStxExplorerUrl}
							target="_blank"
							rel="noreferrer"
						>
							Watch your relay address on Stacks →
						</a>
					</p>
				{/if}
			</div>
		{:else if bridgeStepFailed}
			<div
				class="space-y-2 rounded-md border border-amber-200 bg-amber-50/70 p-3 dark:border-amber-800/50 dark:bg-amber-950/20"
				role="alert"
			>
				<p class="text-xs font-medium text-amber-950 dark:text-amber-100">
					Approval succeeded — bridge step still needed
				</p>
				<p class="text-xs leading-relaxed text-amber-900 dark:text-amber-200">
					{errorMsg}
				</p>
				{#if explorerApproveTxUrl}
					<p class="text-[11px] text-neutral-600 dark:text-neutral-400">
						Latest approval tx:
						<a
							class="block font-mono break-all underline"
							href={explorerApproveTxUrl}
							target="_blank"
							rel="noreferrer"
						>
							{approveTxHash}
						</a>
					</p>
				{/if}
			</div>
		{:else if approveOnly}
			<!-- Approval only — bridge not yet sent -->
			<div
				class="space-y-2 rounded-md border border-sky-200 bg-sky-50/60 p-3 dark:border-sky-800/50 dark:bg-sky-950/20"
				role="status"
			>
				<p class="text-xs font-medium text-sky-900 dark:text-sky-100">
					Step 1 complete — USDC approved for AllBridge
				</p>
				<p class="text-xs leading-relaxed text-sky-800 dark:text-sky-200">
					Your Etherscan transaction is the <strong>approval</strong>, not the bridge yet. Click
					<strong>Bridge {tokenSymbol} → Stacks</strong> again to submit the actual AllBridge transfer
					(MetaMask should not ask for approval again).
				</p>
				{#if explorerApproveTxUrl}
					<a
						class="block font-mono text-xs break-all underline"
						href={explorerApproveTxUrl}
						target="_blank"
						rel="noreferrer"
					>
						{approveTxHash}
					</a>
				{/if}
			</div>
		{/if}

		<Button
			type="button"
			onclick={submit}
			disabled={!canSubmit || bridgeSubmitted}
			class="w-full cursor-pointer"
		>
			{busy
				? 'Confirm in MetaMask…'
				: bridgeSubmitted
					? 'Bridge submitted'
					: `Bridge ${tokenSymbol} → Stacks`}
		</Button>

		{#if errorMsg && !bridgeStepFailed}
			<p class="text-sm text-red-700 dark:text-red-300" role="alert">{errorMsg}</p>
		{/if}
	{/if}
</div>
