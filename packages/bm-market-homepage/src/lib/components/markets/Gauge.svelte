<!-- Gauge.svelte -->
<script lang="ts">
	/**
	 * Binary Market Probability Gauge
	 * Displays a semicircle gauge showing the Yes percentage for binary markets
	 */
	const { percent = 50, radius = 20 } = $props<{
		percent: number;
		radius: number;
	}>();

	// semicircle geometry
	const circumference = Math.PI * radius;
	const offset = circumference - (percent / 100) * circumference;

	const size = radius * 2 + 8; // viewBox size with padding
	const strokeWidth = 3; // Thinner stroke
	const centerX = size / 2;
	const centerY = radius + 4;
</script>

<!-- SVG Semicircle Gauge -->
<div class="flex flex-col items-center">
	<svg
		class="overflow-visible"
		width={size}
		height={radius + 8}
		viewBox="0 0 {size} {radius + 8}"
		aria-label="Probability gauge: {Math.round(percent)}%"
		role="img"
	>
		<!-- Background arc -->
		<path
			d="M {strokeWidth / 2 + 4},{centerY} A {radius},{radius} 0 0,1 {size - strokeWidth / 2 - 4},{centerY}"
			fill="none"
			stroke-width={strokeWidth}
			class="stroke-border"
		/>

		<!-- Foreground arc (colored based on percentage) -->
		<path
			d="M {strokeWidth / 2 + 4},{centerY} A {radius},{radius} 0 0,1 {size - strokeWidth / 2 - 4},{centerY}"
			fill="none"
			stroke-width={strokeWidth}
			stroke-dasharray={circumference}
			stroke-dashoffset={offset}
			stroke-linecap="round"
			class="transition-all duration-300 ease-in-out motion-reduce:transition-none {percent > 60
				? 'stroke-price-up'
				: percent >= 30
					? 'stroke-warning'
					: 'stroke-price-down'}"
		/>
	</svg>

	<!-- Percentage number below the arc -->
	<div class="mt-1 flex flex-col items-center">
		<span class="text-sm font-semibold text-card-foreground tabular-nums">
			{Math.round(percent)}%
		</span>
		<span class="text-xs text-muted-foreground">chance</span>
	</div>
</div>
