<script lang="ts">
  import { BarChart3, TrendingUp, Zap, DollarSign, Code } from 'lucide-svelte';
</script>

<div class="">
  <!-- Main Hero -->
  <!-- TODO MJC: REPUTATION <div class="max-w-3xl"> -->
  <div class="max-w-5xl">
    <h1 class="text-5xl leading-tight font-bold text-foreground lg:text-6xl">
      Own the Future of
      <span class="bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
        Prediction Markets
      </span>
    </h1>
    <p class="mt-6 text-xl leading-relaxed text-muted-foreground">
      The first prediction market protocol where <strong class="text-foreground"
        >community predictions drive treasury investments</strong
      >. Your token doesn't just govern—it captures value from crowd wisdom.
    </p>
  </div>

  <!-- Modern Sale Timeline -->

  <!-- Algorithmic Treasury Section -->
  <div class="space-y-8">
    <div>
      <h2 class="text-3xl font-bold text-foreground">
        Revolutionary <span class="text-primary">Treasury Algorithm</span>
      </h2>
      <p class="mt-2 text-lg text-muted-foreground">
        The world's first prediction market that converts crowd wisdom into treasury alpha. When
        markets close, collective intelligence automatically drives treasury positioning.
      </p>
    </div>

    <!-- Algorithm Flow -->
    <div class="relative">
      <div class="grid grid-cols-1 gap-6 md:grid-cols-4">
        <!-- Step 1 -->
        <div class="text-center">
          <div
            class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted shadow-lg"
          >
            <BarChart3 class="h-8 w-8 text-primary" />
          </div>
          <h3 class="mb-2 text-lg font-bold text-foreground">Market Closes</h3>
          <p class="text-sm text-muted-foreground">
            Community predictions recorded on-chain
          </p>
        </div>

        <!-- Step 2 -->
        <div class="text-center">
          <div
            class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted shadow-lg"
          >
            <Zap class="h-8 w-8 text-primary" />
          </div>
          <h3 class="mb-2 text-lg font-bold text-foreground">Signal Generated</h3>
          <p class="text-sm text-muted-foreground">
            Algorithm analyzes prediction patterns
          </p>
        </div>

        <!-- Step 3 -->
        <div class="text-center">
          <div
            class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted shadow-lg"
          >
            <TrendingUp class="h-8 w-8 text-primary" />
          </div>
          <h3 class="mb-2 text-lg font-bold text-foreground">Treasury Hedge</h3>
          <p class="text-sm text-muted-foreground">
            Automatic asset swaps based on signals
          </p>
        </div>

        <!-- Step 4 -->
        <div class="text-center">
          <div
            class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted shadow-lg"
          >
            <DollarSign class="h-8 w-8 text-primary" />
          </div>
          <h3 class="mb-2 text-lg font-bold text-foreground">Profits to DAO</h3>
          <p class="text-sm text-muted-foreground">Returns benefit entire ecosystem</p>
        </div>
      </div>
    </div>

    <!-- Code Example -->
    <div
      class="rounded-xl border border-border bg-muted p-4"
    >
      <div class="mb-2 flex items-center gap-2">
        <Code class="h-4 w-4 text-muted-foreground" />
        <span class="text-sm text-muted-foreground">Smart Contract Evidence:</span>
      </div>
      <code class="font-mono text-sm text-primary">
        execute-hedge(market-id, predicted-index) → perform-swap-hedge() → treasury.swap-tokens()
      </code>
    </div>
  </div>

  <!-- Multiple Revenue Streams -->
  <div class="space-y-8">
    <div>
      <h2 class="text-3xl font-bold text-foreground">Multiple Revenue Streams</h2>
      <p class="mt-2 text-lg text-muted-foreground">
        BIG token holders benefit from every aspect of the platform
      </p>
    </div>

    <div class="grid gap-6 md:grid-cols-3">
      <div
        class="rounded-xl border border-border bg-card p-6 text-card-foreground"
      >
        <div
          class="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-muted"
        >
          <DollarSign class="h-6 w-6 text-primary" />
        </div>
        <h3 class="mb-3 text-lg font-bold text-foreground">Protocol Fees</h3>
        <p class="mb-4 text-sm text-muted-foreground">
          Earn from every trade on the platform. DAO controls fee rates (currently 2-5% per
          transaction).
        </p>
        <div class="font-mono text-xs text-primary">dao-fee-bips → treasury</div>
      </div>

      <div
        class="rounded-xl border border-border bg-card p-6 text-card-foreground"
      >
        <div
          class="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-muted"
        >
          <TrendingUp class="h-6 w-6 text-primary" />
        </div>
        <h3 class="mb-3 text-lg font-bold text-foreground">Treasury Alpha</h3>
        <p class="mb-4 text-sm text-muted-foreground">
          Algorithmic hedge fund profits from crowd-signal-driven strategies. Transparent on-chain
          execution.
        </p>
        <div class="font-mono text-xs text-primary">hedge-PnL → dao-treasury</div>
      </div>

      <div
        class="rounded-xl border border-border bg-card p-6 text-card-foreground"
      >
        <div
          class="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-muted"
        >
          <Zap class="h-6 w-6 text-primary" />
        </div>
        <h3 class="mb-3 text-lg font-bold text-foreground">Cross-Chain Growth</h3>
        <p class="mb-4 text-sm text-muted-foreground">
          Future revenue from Bitcoin, Solana (Zeus Network), and multi-chain trading expansion.
        </p>
        <div class="font-mono text-xs text-primary">multi-chain fees → DAO</div>
      </div>
    </div>
  </div>
</div>
