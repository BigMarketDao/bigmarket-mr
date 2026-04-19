import { tokens } from '@bigmarket/bm-design';

export default {
	content: [
		'./src/**/*.{html,js,svelte,ts}',
		'../../packages/bm-ui/src/**/*.{html,js,svelte,ts}' // 👈 IMPORTANT
	],
	theme: {
		extend: {
			colors: {
				primary: tokens.colors.primary,
				secondary: tokens.colors.secondary,
				muted: tokens.colors.muted,
				border: tokens.colors.border,
				background: tokens.colors.background
			},
			borderRadius: tokens.radius,
			spacing: tokens.spacing,
			fontFamily: tokens.typography.fontFamily,
			fontSize: tokens.typography.fontSize
		}
	},
	plugins: []
};
