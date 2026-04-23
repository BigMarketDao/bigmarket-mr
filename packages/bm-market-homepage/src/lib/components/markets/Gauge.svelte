<!-- Gauge.svelte -->
<script lang="ts">
	/**
	 * Binary Market Probability Gauge
	 * Displays a semicircle gauge showing the Yes percentage for binary markets
	 */
	const { percent = 50, radius = 20 } = $props<{
		percent: number;
		radius: number
	}>();

	// semicircle geometry
	const circumference = Math.PI * radius;
	const offset = circumference - (percent / 100) * circumference;

	// Dynamic color based on percentage thresholds
	const color = $derived(
		percent > 60
			? '#22c55e' // green
			: percent >= 30
				? '#eab308' // yellow
				: '#ef4444' // red
		);
	const size = radius * 2 + 8; // viewBox size with padding
	const strokeWidth = 3; // Thinner stroke
	const centerX = size / 2;
	const centerY = radius + 4;
</script>

<!-- SVG Semicircle Gauge -->
<div class="flex flex-col items-center">
	<svg class="overflow-visible" width={size} height={radius + 8} viewBox="0 0 {size} {radius + 8}" aria-label="Market probability gauge showing {Math.round(percent)}% chance" role="img">
		<!-- Background arc (gray) -->
		<path
			d="M {strokeWidth / 2 + 4},{centerY} A {radius},{radius} 0 0,1 {size - strokeWidth / 2 - 4},{centerY}"
			fill="none"
			stroke-width={strokeWidth}
			class="stroke-gray-300 dark:stroke-gray-600"
		/>

		<!-- Foreground arc (colored based on percentage) -->
		<path
			d="M {strokeWidth / 2 + 4},{centerY} A {radius},{radius} 0 0,1 {size - strokeWidth / 2 - 4},{centerY}"
			fill="none"
			stroke-width={strokeWidth}
			stroke-dasharray={circumference}
			stroke-dashoffset={offset}
			stroke-linecap="round"
			stroke={color}
			class="transition-all duration-300 ease-in-out"
		/>
	</svg>

	<!-- Percentage number below the arc -->
	<div class="mt-1 flex flex-col items-center">
		<span class="text-sm font-semibold text-gray-900 dark:text-gray-100 tabular-nums">
			{Math.round(percent)}%
		</span>
		<span class="text-xs text-gray-500 dark:text-gray-400">chance</span>
	</div>
</div>
