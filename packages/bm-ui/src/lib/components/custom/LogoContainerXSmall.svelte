<script lang="ts">
	let placeholderImage = 'https://bitcoinfaces.xyz/api/get-image?name=SP1R1061ZT6KPJXQ7PAXPFB6ZAZ6ZWW28GBQA1W0F'; // Path to your standard placeholder image
	
	const { logo = placeholderImage } = $props<{
		logo: string;
	}>();

	let isPlaceholder = false;

	function handleError(event: any) {
		event.target.src = placeholderImage; // Set the fallback image
		event.target.alt = 'Default placeholder image';
		isPlaceholder = true; // Update state
	}
</script>

<div class=""><img src={logo || placeholderImage} alt="Market Logo" onerror={handleError} class="max-h-[40px] min-h-[40px] max-w-[50px] min-w-[50px] place-self-start rounded-sm object-cover" /></div>
