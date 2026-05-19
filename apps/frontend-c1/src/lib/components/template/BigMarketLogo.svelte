<script lang="ts">
	let { class: className = '' } = $props<{ class?: string }>();
</script>

<span
	class="text-xl font-bold tracking-tight text-primary transition-opacity duration-200 group-hover:opacity-90 {className}"
	aria-hidden="true"
>
	BigMarket
</span>
