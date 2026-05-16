import { type WithElementRef } from '../../../utils.js';
import type { HTMLAnchorAttributes, HTMLButtonAttributes } from 'svelte/elements';
import { type VariantProps, tv } from 'tailwind-variants';

export const buttonVariants = tv({
	base: [
		'cursor-pointer',
		'inline-flex shrink-0 items-center justify-center gap-2',
		'rounded-md text-sm font-medium whitespace-nowrap',
		'outline-none transition-colors duration-200', // no movement
		'focus-visible:ring-[3px] focus-visible:ring-ring/40',
		'disabled:pointer-events-none disabled:opacity-50',
		'aria-disabled:pointer-events-none aria-disabled:opacity-50',
		"[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
	].join(' '),
	variants: {
		variant: {
			default: [
				'bg-primary text-primary-foreground',
				'border border-primary/40',
				'shadow-sm',
				'hover:bg-primary/90 hover:border-primary/60',
				'[a&]:no-underline'
			].join(' '),

			secondary: [
				'bg-secondary text-secondary-foreground',
				'border border-secondary/30',
				'shadow-sm',
				'hover:bg-secondary/90 hover:border-secondary/50'
			].join(' '),

			outline: [
				'bg-transparent text-muted-foreground',
				'border border-border',
				'hover:bg-transparent hover:text-foreground'
			].join(' '),

			ghost: [
				'bg-transparent text-foreground',
				'border border-transparent',
				'hover:bg-accent hover:text-accent-foreground',
				'dark:hover:bg-accent dark:hover:text-accent-foreground'
			].join(' '),

			link: 'bg-transparent text-primary underline-offset-4 hover:underline',

			destructive: [
				'bg-destructive text-white',
				'border border-destructive/40',
				'shadow-sm',
				'hover:bg-destructive/90 hover:border-destructive/60',
				'focus-visible:ring-destructive/30',
				'dark:focus-visible:ring-destructive/40'
			].join(' ')
		},

		size: {
			default: 'h-9 px-4 py-2 has-[>svg]:px-3',
			sm: 'h-8 gap-1.5 rounded-md px-3 has-[>svg]:px-2.5',
			lg: 'h-10 rounded-md px-6 has-[>svg]:px-4',
			icon: 'size-9',
			'icon-sm': 'size-8',
			'icon-lg': 'size-10'
		}
	},
	defaultVariants: {
		variant: 'default',
		size: 'default'
	}
});

export type ButtonVariant = VariantProps<typeof buttonVariants>['variant'];
export type ButtonSize = VariantProps<typeof buttonVariants>['size'];

export type ButtonProps = WithElementRef<HTMLButtonAttributes> &
	WithElementRef<HTMLAnchorAttributes> & {
		variant?: ButtonVariant;
		size?: ButtonSize;
	};
