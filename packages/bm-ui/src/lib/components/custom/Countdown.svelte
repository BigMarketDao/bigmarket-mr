<script lang="ts">
  import { DateTime, Duration } from 'luxon';

  let { endBlock, scaleFactor = 1 }: { endBlock: number; scaleFactor?: number } = $props();

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
  <div class="inline-block">
    {#if moreThanDay}
      ~ {display.toFormat("d ' days' h ' hrs'")}
    {:else}
      ~ {display.toFormat("h ' hrs' m ' mins' ss ' secs'")}
    {/if}
  </div>
{/if}

<style>
</style>
