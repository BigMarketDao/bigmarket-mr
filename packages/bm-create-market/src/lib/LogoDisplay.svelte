<script lang="ts">
	import { appConfigStore, requireAppConfig } from '@bigmarket/bm-common';

const appConfig = $derived(requireAppConfig($appConfigStore));

	// Use template directly
	const { logo } = $props<{
		logo: string;
	}>();

	const corsSafe = (url: string) => {
		if (url.indexOf('pump') > -1) {
			return `${appConfig.VITE_BIGMARKET_API}/images/proxy?url=${encodeURI(url)}`;
		}
		return url;
	};

	// Secure URL validation function
	function isSecureURL(url: string): boolean {
		if (!url || typeof url !== 'string') return false;

		// Block dangerous patterns
		const dangerousPatterns = ['<script', 'javascript:', 'onload=', 'onerror=', 'onclick=', 'onmouseover=', 'onfocus=', 'onblur=', 'onchange=', 'vbscript:', 'data:text/html', 'data:application/javascript'];

		const lowerUrl = url.toLowerCase();
		if (dangerousPatterns.some((pattern) => lowerUrl.includes(pattern))) {
			return false;
		}

		// Allow only HTTPS URLs
		if (url.startsWith('https://')) {
			return true;
		}

		// Allow safe data:image/ URLs (images only)
		if (url.startsWith('data:image/')) {
			const dataUrlPattern = /^data:image\/(png|jpeg|jpg|gif|webp|svg\+xml);base64,/i;
			return dataUrlPattern.test(url);
		}

		return false;
	}

	// Reactive variable for secure logo URL
	let safeLogoURL = $derived(logo && isSecureURL(logo) ? corsSafe(logo) : null);

	// Check if URL is invalid
	let isInvalidURL = $derived(logo && !isSecureURL(logo));
</script>

{#if logo}
	{#if safeLogoURL}
		<!-- Display secure image with security attributes -->
		<img
			src={safeLogoURL}
			alt="Logo"
			class="h-auto w-64 object-contain"
			referrerpolicy="no-referrer"
			crossorigin="anonymous"
			onerror={(e) => {
				const target = e.target as HTMLImageElement;
				if (target) target.style.display = 'none';
			}}
		/>
	{:else}
		<!-- Security warning for invalid URLs -->
		<div class="rounded border border-red-200 bg-red-50 p-4 dark:border-red-700 dark:bg-red-900/20">
			<p class="text-sm font-medium text-red-600 dark:text-red-400">⚠️ Security Warning: Invalid or unsafe logo URL detected</p>
			<p class="mt-1 text-sm text-red-500 dark:text-red-400">Only HTTPS URLs and safe data:image/ URLs are allowed for security reasons.</p>
			<p class="mt-2 text-xs text-red-400 dark:text-red-500">
				Blocked URL: {logo}
			</p>
		</div>
	{/if}
{:else}
	<!-- No logo provided -->
	<div class="rounded border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
		<p class="text-sm text-gray-600 dark:text-gray-400">No logo provided</p>
	</div>
{/if}
