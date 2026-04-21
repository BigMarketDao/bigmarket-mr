<script lang="ts">
	import { onMount } from 'svelte';
	export let bannerType = 'info';
	let clazz = '';

	let bannerClassList = '';
	onMount(async () => {
		if (bannerType === 'warning') {
			bannerClassList = clazz + ' bg-yellow-400';
		} else if (bannerType === 'danger') {
			bannerClassList = clazz + ' bg-error-400';
		} else if (bannerType === 'success') {
			bannerClassList = clazz + ' bg-success-400';
		} else if (bannerType === 'waiting' || bannerType === 'checking') {
			bannerClassList = clazz + ' bg-lightpurple/60';
		} else {
			bannerClassList = clazz + ' bg-sand-500/60';
		}
	});
</script>

<div class="flex rounded-md px-4 py-3 text-base text-black {bannerClassList}">
	<div class="flex items-center gap-2">
		<div>
			<slot></slot>
			<!-- Slot for dynamic content -->
		</div>
	</div>
</div>
