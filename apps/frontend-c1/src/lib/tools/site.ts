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

export const mainNavLinks: Array<NavLink> = [{ href: '/dao', label: 'DAO' }];

export const footerNavSections: Array<NavSection> = [
	{
		title: 'Quick Links',
		links: [
			{ href: '/dao', label: 'DAO Information' },
			{ href: '/market-mgt', label: 'Create Market' },
			{ href: 'https://big-market-dao.gitbook.io/big-market-dao-docs/', label: 'Docs' }
		]
	},
	{
		title: 'Resources',
		links: [
			{ href: '/docs', label: 'Documentation' },
			{ href: 'https://github.com/BigMarketDao', label: 'GitHub', external: true },
			{ href: '/docs/terms', label: 'Terms & Conditions' },
			{ href: '/docs/privacy', label: 'Privacy Policy' }
		]
	},
	{
		title: 'Community',
		links: [
			{ href: 'https://x.com/BigMarketDAO', label: 'Twitter', external: true },
			{ href: 'https://discord.gg/WhdxNhSV', label: 'Discord', external: true },
			{ href: 'https://leather.io/', label: 'Download Leather', external: true },
			{ href: 'https://www.xverse.app/', label: 'Download Xverse', external: true }
		]
	}
];
