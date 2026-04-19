<script lang="ts">
	import { DatePicker } from 'date-picker-svelte';
	import { format } from 'date-fns';

	interface Props {
		value: Date;
		minDate: Date;
		maxDate: Date;
		localCriterion: { resolvesAt: number };
		dateFormat?: string;
	}

	let { value = $bindable(), minDate, maxDate, localCriterion, dateFormat = 'PPpp' }: Props = $props();
</script>

<div class="mb-6 w-full" data-resolves-at={localCriterion.resolvesAt}>
	<label for="date-picker" class="text-text-default mb-1 block text-sm font-medium"> Select Date & Time </label>

	<div id="date-picker" class="relative w-full">
		<DatePicker bind:value max={maxDate} min={minDate} timePrecision="minute" />
	</div>

	<p class="text-text-default/70 mt-2 text-sm">
		<strong class="text-text-default">
			{format(value, dateFormat)}
		</strong>
	</p>
</div>
