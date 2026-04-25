<script lang="ts">
	const { logo, name, description } = $props<{
		logo: string;
		name: string;
		description: string;
	}>();

	const getImage = (e:any) => {
		const img = e.target as HTMLImageElement;
		img.src = 'https://bitcoinfaces.xyz/api/get-image?name=SP1R1061ZT6KPJXQ7PAXPFB6ZAZ6ZWW28GBQA1W0F';
		return img
	}
</script>


<svelte:head>
	<title>Market Volumes</title>
	<meta name="description" content="View prediction market details and participate" />
</svelte:head>

<div class="mb-8 flex items-start gap-6">
	<div class="flex h-20 w-20 items-center justify-center overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800">
		{#if logo}
			<img
				src={logo}
				alt="Market logo"
				class="h-full w-full object-cover"
				onerror={(e) => getImage(e)}
			/>
		{:else}
			<div class="h-12 w-12 rounded bg-gray-200 dark:bg-gray-700"></div>
		{/if}
	</div>
	<div class="flex-1 space-y-4">
		<h1 class="text-2xl font-semibold text-gray-900 dark:text-white">
			{@html name}
		</h1>
		<p class="text-base text-gray-600 dark:text-gray-400">
			{@html description}
		</p>
	</div>
</div>
