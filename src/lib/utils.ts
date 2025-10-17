import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { Snippet } from 'svelte';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

// shadcn utility types
export type WithElementRef<T> = T & { ref?: HTMLElement | null };
export type WithoutChildrenOrChild<T> = Omit<T, 'children' | 'child'> & {
	children?: Snippet;
};
export type WithoutChild<T> = Omit<T, 'child'> & {
	child?: Snippet;
};
