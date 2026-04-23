<script lang="ts">
	import { getMarketToken } from '$lib/core/app/loaders/governance/tokens';
	import type { ContractBalances } from '@bigmarket/bm-types';
	import { fmtMicroToStx } from '@bigmarket/bm-utilities';
	import { onMount } from 'svelte';

	let { contracts }: { contracts: Array<{ contract: string; balances: ContractBalances }> } =
		$props();

	type BalanceRow = {
		contract: string;
		token: string;
		symbol: string;
		balance: number;
		decimals: number;
	};
	let balances = $state<BalanceRow[]>([]);

	const formatCryptoValue = (value: string | number): string => {
		if (typeof value === 'number') value = value.toString();
		if (!value || value.indexOf('.') === -1) return value;
		const parts = value.split('.');
		const integerPart = Number(parts[0]).toLocaleString();
		const decimalPart = parts[1] ? parts[1].padEnd(8, '0') : '00000000';
		return `${integerPart}.<span class="text-sm text-gray-300">${decimalPart}</span>`;
	};

	onMount(() => {
		balances = contracts.flatMap(({ contract, balances }) => {
			const tokens = Object.keys(balances?.fungible_tokens || {}).map((token) => ({
				contract,
				token: token.split('::')[1],
				balance: Number(balances.fungible_tokens[token].balance),
				decimals: getMarketToken(token.split('::')[0]).decimals,
				symbol: getMarketToken(token.split('::')[0]).symbol as string
			}));

			return [
				...tokens,
				{
					contract,
					token: 'STX',
					symbol: 'STX',
					balance: Number(balances.stx.balance),
					decimals: 6
				}
			];
		});
	});
</script>

<table class="min-w-full table-auto border-collapse border border-gray-300 shadow-lg">
	<thead>
		<tr class="bg-gray-200 text-left">
			<th class="border border-gray-300 px-4 py-2 text-gray-800">Contract</th>
			<th class="border border-gray-300 px-4 py-2 text-gray-800">Token</th>
			<th class="border border-gray-300 px-4 py-2 text-gray-800">Balance</th>
		</tr>
	</thead>
	<tbody>
		{#each balances as { contract, token, symbol, balance, decimals }, i (i)}
			<tr class="border-b transition hover:bg-gray-700">
				<td class="border border-gray-300 px-4 py-2">{contract}</td>
				<td class="border border-gray-300 px-4 py-2">{symbol || token}</td>
				<td class="border border-gray-300 px-4 py-2"
					>{@html formatCryptoValue(fmtMicroToStx(balance, decimals))}
				</td>
			</tr>
		{/each}
	</tbody>
</table>
