import { DaoOverview } from "@bigmarket/bm-types";
import { writable } from "svelte/store";

const initial: DaoOverview = {} as DaoOverview;
export const daoOverviewStore = writable<DaoOverview>(initial);
