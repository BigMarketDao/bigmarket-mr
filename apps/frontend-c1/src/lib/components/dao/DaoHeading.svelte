<script lang="ts">
  import { ParaContainer } from '@bigmarket/bm-ui';

  let {
    headingPart1,
    headingPart2,
    message = ''
  }: {
    headingPart1: string;
    headingPart2: string;
    message?: string;
  } = $props();
</script>

<div class="">
  <h1 class="text-5xl leading-tight font-bold text-foreground lg:text-6xl">
    {headingPart1}
    <span class="bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
      {headingPart2}
    </span>
  </h1>
  <ParaContainer>{message}</ParaContainer>
</div>
