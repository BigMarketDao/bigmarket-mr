<script lang="ts">
	let {
		title = 'Welcome to Our Site',
		subtitle = 'Empowering ideas with technologyy'
	}: {
		title: string;
		subtitle: string;
	} = $props();

</script>

<div class="z-0 py-8">
	<div class=" inset-0 z-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-900/20 via-[#0F1225]/10 to-[#0F1225]/5"></div>

	<div class=" mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
		<div class="text-center">
			<h1 class="text-primary-500 bg-gradient-to-r from-purple-400 to-indigo-300 bg-clip-text text-4xl font-bold sm:text-6xl dark:text-white">
				{title}
			</h1>
			<p class="mx-auto mt-6 max-w-2xl text-lg text-indigo-200/70">
				{@html subtitle}
			</p>
		</div>
	</div>
</div>
