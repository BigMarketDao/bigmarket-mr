<script lang="ts">
  import { onMount } from 'svelte';
  import { isLoggedIn, loginStacksFromHeader } from '$lib/stacks/stacks-connect';
  import { Banner } from '@bigmarket/bm-ui';

  const login = async () => {
    loginStacksFromHeader(document);
  };

  onMount(async () => {});
</script>

<div class="flex flex-col gap-y-2 rounded-lg border border-white p-5">
  <div class="flex flex-col gap-y-5">
    <div class="flex flex-col gap-y-2">
      <h1 class="text-lg font-medium">Voting Method</h1>
      <p>
        Vote by signing a message with your (Leather / Xverse / etc) web wallet. The signed messages
        are batched up and sent to the voting contract for verification.
      </p>
      <p>
        You can also send your vote directly to the smart contract by sending a stacks transaction -
        click the link to toggle this feature.
      </p>
    </div>
    <div class="flex flex-col gap-y-2">
      <h1 class="text-lg font-medium">Voting Power</h1>
      <p>
        Vote with however much STX you had when voting began (snapshot balance). You can vote as
        many times as you like up to that amount.
      </p>
    </div>
  </div>
  {#if !isLoggedIn()}
    <div class="">
      <Banner bannerType={'warning'} message={'Your wallet must be connected to vote!'} />
    </div>
    <div class="my-5 flex w-full flex-col items-center">
      <button
        on:click={() => {
          login();
        }}
        class="bg-success-01 w-[250px] items-center justify-center gap-x-1.5 rounded-xl border border-bitcoinorange bg-black px-4 py-2 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500/50 md:inline-flex"
      >
        Connect Wallet to Continue
      </button>
    </div>
  {/if}
</div>
