<script lang="ts">
  import '../app.css';
  // import AppBar from '$lib/components/theme/AppBar.svelte';
  // import { configStore } from '$lib/stores/stores_config';
  // import { type Config, getBnsNameFromAddress, getStxAddress } from '@bigmarket/bm-common/forum_helper';
  // import { storedBnsData } from '$lib/stores/threads';
  // import { isConnected } from '@bigmarket/bm-common/connection_wrapper';

  // export let data: {
  // 	network: string;
  // 	appConfig: Config;
  // };
  // if (!data.appConfig) throw new Error('no app config present?');
  // $: configStore.set(data.appConfig);

  // // let isDark = false;

  // onMount(async () => {
  // 	const connected = await isConnected();
  // 	if (connected) {
  // 		const name = await getBnsNameFromAddress(
  // 			data.appConfig.VITE_FORUM_API,
  // 			await getStxAddress()
  // 		);
  // 		storedBnsData.set(name || (await getStxAddress()));
  // 	}
  // });
</script>

<!-- {@render children()} -->
<div
  class="bg-surface-50-950 text-surface-contrast-50-950 from-surface-100-900
	       via-surface-100-900
	       to-surface-100-900 min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))]
	       font-extralight"
>
  <div class="">
    <div class="flex min-h-screen flex-col">
      <!-- <AppBar /> -->
      <slot />
    </div>
  </div>
</div>
