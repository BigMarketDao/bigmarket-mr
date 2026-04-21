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
  <h1 class="text-5xl leading-tight font-bold text-gray-900 lg:text-6xl dark:text-white">
    {headingPart1}
    <span class="bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
      {headingPart2}
    </span>
  </h1>
  <ParaContainer>{message}</ParaContainer>
</div>
