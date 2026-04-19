import { tv } from 'tailwind-variants';
export const badgeVariants = tv({
    base: [
        'inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden',
        'rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap',
        'border',
        'transition-colors duration-200',
        'focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:outline-none',
        'aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40',
        '[&>svg]:pointer-events-none [&>svg]:size-3'
    ].join(' '),
    variants: {
        variant: {
            default: [
                'bg-primary/12 text-primary',
                'border-primary/25',
                '[a&]:hover:bg-primary/18 [a&]:hover:border-primary/40',
                'dark:bg-primary/18 dark:text-primary-foreground dark:border-primary/30',
                '[a&]:dark:hover:bg-primary/24 [a&]:dark:hover:border-primary/45'
            ].join(' '),
            secondary: [
                'bg-secondary/10 text-secondary',
                'border-secondary/20',
                '[a&]:hover:bg-secondary/16 [a&]:hover:border-secondary/35',
                'dark:bg-secondary/35 dark:text-secondary-foreground dark:border-secondary/35',
                '[a&]:dark:hover:bg-secondary/45 [a&]:dark:hover:border-secondary/50'
            ].join(' '),
            destructive: [
                'bg-destructive text-white',
                'border-destructive/35',
                '[a&]:hover:bg-destructive/90 [a&]:hover:border-destructive/55',
                'focus-visible:ring-destructive/30 dark:focus-visible:ring-destructive/40',
                'dark:bg-destructive/70 dark:border-destructive/45'
            ].join(' '),
            outline: [
                'bg-transparent text-foreground',
                'border-border',
                '[a&]:hover:bg-accent [a&]:hover:text-accent-foreground [a&]:hover:border-border',
                'dark:border-input'
            ].join(' ')
        }
    },
    defaultVariants: {
        variant: 'default'
    }
});
//# sourceMappingURL=badge-variants.js.map