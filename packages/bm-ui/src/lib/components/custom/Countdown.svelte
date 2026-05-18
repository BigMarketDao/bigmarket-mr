<script lang="ts">
  import { DateTime, Duration } from 'luxon';

  let {
    endBlock,
    scaleFactor = 1,
    showTilde = true,
    suffix = '',
    valueClass = '',
    suffixClass = '',
  }: {
    endBlock: number;
    scaleFactor?: number;
    showTilde?: boolean;
    suffix?: string;
    valueClass?: string;
    suffixClass?: string;
  } = $props();

  let end = $state(DateTime.local());
  let now = $state<any>(DateTime.local());
  let moreThanDay = $state(false);

  const display = $derived(end && now ? Duration.fromObject(end.diff(now).toObject()) : undefined);

  $effect(() => {
    try {
      const dayInMillis = 1000 * 60 * 60 * 24;
      const blockProdTime = scaleFactor ? 10 * scaleFactor : 10;
      const endTime = DateTime.local().plus({ minutes: endBlock * blockProdTime });
      end = endTime;
      moreThanDay = endTime.toMillis() - DateTime.local().toMillis() > dayInMillis;
      const myInt = setInterval(() => {
        now = DateTime.local();
      }, 1000);
      return () => clearInterval(myInt);
    } catch (err: any) {
      console.error('error in countdown: ', err);
    }
  });
</script>

{#if display && endBlock > 0}
  <span class="inline-flex items-baseline gap-1">
    {#if showTilde}<span>~ </span>{/if}
    <span class={valueClass}>
      {#if moreThanDay}
        {display.toFormat("d 'days' h 'hrs'")}
      {:else}
        {display.toFormat("h 'hrs' m 'mins' ss 'secs'")}
      {/if}
    </span>
    {#if suffix}<span class={suffixClass}>{suffix}</span>{/if}
  </span>
{/if}

<style>
</style>
