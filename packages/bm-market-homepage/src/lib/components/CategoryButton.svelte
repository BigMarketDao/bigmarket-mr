<script lang="ts">
	export let label: string = 'All Markets';
	export let active: string = 'All Markets';
	export let onChangeCategory: any;

	const changeCategory = (label: string) => {
		onChangeCategory(label);
	};
</script>

<!-- Filter Section with improved spacing -->
<button
	class={`relative text-xs font-medium transition-colors md:text-sm
						${
							label === active
								? 'text-orange-600 after:absolute after:-bottom-2 after:left-0 after:h-0.5 after:w-full after:bg-orange-600 dark:text-orange-400 dark:after:bg-orange-400'
								: 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
						}`}
>
	<a class="capitalize" href="/" on:click|preventDefault={() => changeCategory(label)}><slot name="body"></slot></a>
</button>
