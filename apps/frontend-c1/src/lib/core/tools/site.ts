export type NavLink = {
	href: string;
	label: string;
	external?: boolean;
};

export type NavSection = {
	title: string;
	links: Array<NavLink>;
};

export const daoLink = '/dao';

export const controlRoomLink: NavLink = { href: '/dao', label: 'CONTROL ROOM' };

export const howItWorksLink: NavLink = {
	href: '/docs',
	label: 'HOW IT WORKS',
	external: false
};

/** Footer columns — only routes that exist in the app or verified external URLs. */
export const footerNavSections: Array<NavSection> = [
	{
		title: 'Platform',
		links: [
			{ href: '/', label: 'Markets' },
			{ href: '/dao', label: 'Control Room' },
			{ href: '/docs', label: 'How It Works' },
			{ href: '/reputation', label: 'Reputation' },
			{ href: '/reputation/leader-board', label: 'Leaderboard' },
			{ href: '/vault/deposit', label: 'Deposit' }
		]
	},
	{
		title: 'Documentation',
		links: [
			{ href: '/docs', label: 'Documentation' },
			{ href: '/docs/getting-started/overview', label: 'Overview' },
			{ href: '/docs/trading/quickstart', label: 'Quickstart' },
			{ href: '/docs/trading/fees-and-payouts', label: 'Fees & Payouts' }
		]
	},
	{
		title: 'Legal',
		links: [
			{ href: '/docs/terms', label: 'Terms of Use' },
			{ href: '/docs/privacy', label: 'Privacy Policy' },
			{ href: '/docs/license', label: 'Content License (MIT)' }
		]
	},
	{
		title: 'Community',
		links: [
			{ href: 'https://github.com/BigMarketDao', label: 'GitHub', external: true },
			{ href: 'https://x.com/BigMarketDAO', label: 'X (Twitter)', external: true },
			{ href: 'https://discord.gg/WhdxNhSV', label: 'Discord', external: true }
		]
	}
];

export const footerDisclaimer =
	'BigMarket is an open, non-custodial prediction-market protocol on Stacks. This interface provides software and documentation only. We do not hold user funds, execute trades on your behalf, or provide investment, legal, or tax advice. All collateral and outcomes are controlled by smart contracts and participating wallets.';
