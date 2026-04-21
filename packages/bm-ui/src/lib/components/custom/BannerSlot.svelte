<script lang="ts">
	let { bannerType = 'info', children } = $props();

	const bannerClassList = $derived(
		bannerType === 'warning'
			? ' bg-yellow-400'
			: bannerType === 'danger'
				? ' bg-error-400'
				: bannerType === 'success'
					? ' bg-success-400'
					: bannerType === 'waiting' || bannerType === 'checking'
						? ' bg-lightpurple/60'
						: ' bg-sand-500/60'
	);
</script>

<div class="flex rounded-md px-4 py-3 text-base text-black {bannerClassList}">
	<div class="flex items-center gap-2">
		<div>
			{@render children()}
		</div>
	</div>
</div>
