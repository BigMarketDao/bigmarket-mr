import { writable } from "svelte/store";

export const marketStateStore = writable("all");
export const sortStateStore = writable("ending-soon");
export const searchStateStore = writable("all");
export const categoryStateStore = writable("all");
export const marketTypeStore = writable("all");
export const marketSystemCategoriesStore = writable([]);
export const searchTypeStore = writable("all");
