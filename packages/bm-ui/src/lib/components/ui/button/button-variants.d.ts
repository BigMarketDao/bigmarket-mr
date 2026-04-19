import { type WithElementRef } from '../../../utils.js';
import type { HTMLAnchorAttributes, HTMLButtonAttributes } from 'svelte/elements';
import { type VariantProps } from 'tailwind-variants';
export declare const buttonVariants: import("tailwind-variants").TVReturnType<{
    variant: {
        default: string;
        secondary: string;
        outline: string;
        ghost: string;
        link: string;
        destructive: string;
    };
    size: {
        default: string;
        sm: string;
        lg: string;
        icon: string;
        'icon-sm': string;
        'icon-lg': string;
    };
}, undefined, string, {
    variant: {
        default: string;
        secondary: string;
        outline: string;
        ghost: string;
        link: string;
        destructive: string;
    };
    size: {
        default: string;
        sm: string;
        lg: string;
        icon: string;
        'icon-sm': string;
        'icon-lg': string;
    };
}, undefined, import("tailwind-variants").TVReturnType<{
    variant: {
        default: string;
        secondary: string;
        outline: string;
        ghost: string;
        link: string;
        destructive: string;
    };
    size: {
        default: string;
        sm: string;
        lg: string;
        icon: string;
        'icon-sm': string;
        'icon-lg': string;
    };
}, undefined, string, unknown, unknown, undefined>>;
export type ButtonVariant = VariantProps<typeof buttonVariants>['variant'];
export type ButtonSize = VariantProps<typeof buttonVariants>['size'];
export type ButtonProps = WithElementRef<HTMLButtonAttributes> & WithElementRef<HTMLAnchorAttributes> & {
    variant?: ButtonVariant;
    size?: ButtonSize;
};
//# sourceMappingURL=button-variants.d.ts.map