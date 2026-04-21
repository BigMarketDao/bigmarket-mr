<script lang="ts">
	let {
		currentStage = 1,
		currentStageStart = 0
	}: {
		currentStage?: number;
		currentStageStart?: number;
	} = $props();

	const stages = [1, 2, 3, 4, 5, 6];

	function getStageClass(stage: number) {
		if (stage < currentStage) return 'bg-success-500';
		if (stage === currentStage) return 'bg-warning-500 animate-pulse';
		return 'bg-gray-300';
	}
</script>

<div class="bg-gray-1000 w-full rounded-lg p-4 text-white shadow-lg">
	<div class="mb-2 text-center text-lg font-semibold">Token Sale Progress</div>

	<!-- Progress bar container -->
	<div class="relative my-5 flex h-10 w-full items-center rounded-lg bg-transparent">
		<!-- Progress track -->
		<div class="absolute top-1/2 left-0 h-1 w-full -translate-y-1/2 bg-gray-500"></div>

		<!-- Stages -->
		{#each stages as stage (stage)}
			<div class="relative flex w-1/6 flex-col items-center">
				<!-- Circular indicator -->
				<div
					class={`flex h-6 w-6 items-center justify-center rounded-full border-2 text-xs font-bold ${getStageClass(stage)}`}
				>
					{stage}
				</div>

				<!-- Stage labels -->
				<div class="mt-2 text-center text-xs">
					{stage === currentStage ? `Started at block ${currentStageStart}` : `Stage ${stage}`}
				</div>
			</div>
		{/each}
	</div>
</div>
