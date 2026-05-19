<script lang="ts">
  import { stacks } from "@bigmarket/sdk";


	const { onGenerateRoot } = $props<{
		onGenerateRoot: (root: string, contractIds: Array<string>) => void;
	}>();

	let contractIds: Array<string> = $state([]); // List of added contract IDs
	let manualEntry = $state(''); // Content of the textarea
	const maxContracts = 20;

	const popularContracts = [
		{ id: 'SP3QSAJQ4EA8WXEDSRRKMZZ29NH91VZ6C5X88FGZQ.crashpunks-v2', name: 'crashpunks' },
		{ id: 'SP3QSAJQ4EA8WXEDSRRKMZZ29NH91VZ6C5X88FGZQ.thisisnumberone-v2', name: 'thisisnumberone' },
		{ id: 'SP26QQ5BGSFYSSK6RE33VB97X1V1W96GSXXXHA7CZ.aibtcdev-airdrop-2', name: 'aibtcdev' },
		{
			id: 'SPVD6CE8RW90BGGKJZTKCSMGKS7HP0K8364TFR48.bitcoin-faces-airdrop',
			name: 'bitcoin-faces-airdrop'
		},
		{ id: 'SP3N4AJFZZYC4BK99H53XP8KDGXFGQ2PRSQP2HGT6.loopbomb-genesis', name: 'loopbomb' },
		{
			id: 'SPVD6CE8RW90BGGKJZTKCSMGKS7HP0K8364TFR48.bitcoin-faces-airdrop',
			name: 'bitcoin-faces-airdrop'
		},
		{ id: 'SP32AEEF6WW5Y0NMJ1S8SBSZDAY8R5J32NBZFPKKZ.nope', name: 'nope' }
	];

	function generateRoot() {
		if (contractIds && contractIds.length > 0) {
			const { tree, root } = stacks.generateMerkleTreeUsingStandardPrincipal(contractIds);
			onGenerateRoot(root, contractIds);
		} else {
			onGenerateRoot(undefined, undefined);
		}
	}

	function addFromTextarea() {
		const ids = manualEntry
			.split('\n')
			.map((id) => id.trim())
			.filter((id) => id && !contractIds.includes(id));
		if (contractIds.length + ids.length > maxContracts) {
			alert('You can only add up to 20 contract IDs.');
			return;
		}
		contractIds = [...contractIds, ...ids];
		generateRoot();
		manualEntry = '';
	}

	function addContract(event: any) {
		if (!event || !event.target || !event.target.value) return;
		const id = event.target.value;
		if (contractIds.includes(id)) return;
		if (contractIds.length >= maxContracts) {
			alert('You can only add up to 20 contract IDs.');
			return;
		}
		contractIds = [...contractIds, id];
		generateRoot();
	}

	function removeContract(id: string) {
		contractIds = contractIds.filter((contract) => contract !== id);
		generateRoot();
	}
</script>

<div class="mx-auto px-4 text-foreground shadow-md">
	<h2 class="mb-4 text-xl font-bold text-foreground">Vote Gating Tokens</h2>

	<!-- Textarea for manual entry -->
	<div class="mb-6">
		<label for="manual-entry" class="mb-2 block text-sm font-medium text-foreground"> Enter Contract IDs (one per line): </label>
		<textarea
			id="manual-entry"
			bind:value={manualEntry}
			rows="5"
			class="w-full rounded-md border border-border bg-background p-5 text-foreground shadow-sm placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
		></textarea>
		<button
			onclick={addFromTextarea}
			class="mt-2 rounded bg-info px-4 py-2 text-sm text-info-foreground hover:bg-info/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
		>
			Add Contracts
		</button>
	</div>

	<!-- Dropdown for popular contracts -->
	<div class="mb-6">
		<label for="popular-contracts" class="mb-2 block text-sm font-medium text-foreground"> Add a Popular Contract: </label>
		<select
			id="popular-contracts"
			onchange={(e) => addContract(e)}
			class="h-10 w-full rounded-md border border-border bg-background text-foreground shadow-sm focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
		>
			<option value="" disabled selected>-- Select a Contract --</option>
			{#each popularContracts as contract}
				<option value={contract.id}>{contract.name}</option>
			{/each}
		</select>
	</div>

	<!-- Display added contracts -->
	<div class="text-foreground">
		<h3 class="mb-2 text-lg font-semibold text-foreground">
			Selected Contracts ({contractIds.length}/{maxContracts}):
		</h3>
		<ul class="list-inside list-disc">
			{#each contractIds as id}
				<li class="mb-2 flex items-center justify-between">
					<span class="text-sm text-foreground">{id}</span>
					<button
						onclick={() => removeContract(id)}
						class="text-lg font-bold text-destructive hover:text-destructive/80 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
						aria-label="Remove contract"
					>
						&times;
					</button>
				</li>
			{/each}
		</ul>
	</div>
</div>
