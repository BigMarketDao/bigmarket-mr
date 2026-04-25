<script lang="ts">
	import { onMount } from 'svelte';
	import { constructed } from '@bigmarket/bm-common';
	//import { appConfigStore, requireAppConfig } from '@bigmarket/bm-common';
	import {
		daoConfigStore,
		requireDaoConfig,
		requireDaoGovernanceClient
	} from '@bigmarket/bm-common';
	import { readBaseDaoEvents } from '../../../core/app/loaders/governance/dao_api';
	import DaoBanner from '$lib/components/dao/DaoBanner.svelte';
	import BootstrapDao from './BootstrapDao.svelte';
	import { base } from '$app/paths';
	import { requireAppConfig, appConfigStore } from '@bigmarket/bm-common';
	import { signAdminMessage } from '$lib/core/app/loaders/governance/voting_sip18';

	//const appConfig = $derived(requireAppConfig($appConfigStore));
	const daoConfig = $derived(requireDaoConfig($daoConfigStore));
	const appConfig = $derived(requireAppConfig($appConfigStore));
	let daoContractId = $derived(`${daoConfig.VITE_DAO_DEPLOYER}.${daoConfig.VITE_DAO}`);
	let showExtensions = false;
	let showProposals = false;
	let showOpenProposals = false;
	let showCoreExecute = false;
	let txId: string | undefined = $state();
	let inited = $state(false);

	// function closeModal() {
	// 	showExtensions = false;
	// 	showProposals = false;
	// 	showCoreExecute = false;
	// 	showOpenProposals = false;
	// 	componentKey++;
	// }

	const baseDaoEvents = async () => {
		const auth = await signAdminMessage();
		if (auth) await readBaseDaoEvents(daoContractId, auth);
	};

	const initIdo = async () => {
		const client = requireDaoGovernanceClient($daoConfigStore);
		const response = await client.initializeIdo();
		txId = response.success ? response.txid : undefined;
	};

	onMount(async () => {
		inited = true;
	});
</script>

<svelte:head>
	<title>BigMarket DAO</title>
	<meta
		name="description"
		content="Governance of the Stacks Blockchain, Smart Contracts on Bitcoin"
	/>
</svelte:head>

<div class="mx-auto max-w-7xl py-6 md:px-6">
	<div class="my-8 flex w-full flex-col">
		<div
			class="flex w-full flex-col gap-y-4 overflow-hidden rounded-lg border-[0.5px] border-gray-700 p-6 sm:p-10"
		>
			{#if inited}
				<div class="py-0">
					{#if !txId}
						<DaoBanner contractId={daoContractId} />
						<div>
							<p>
								No dao found for contract: {daoContractId} - {appConfig.VITE_NETWORK} - - {daoConfig.VITE_DAO_DEPLOYER}
							</p>
						</div>
					{/if}
					{#if !$constructed}
						<DaoBanner contractId={daoContractId} />
						<div>
							<p>DAO for contract: {daoContractId} is not bootstrapped</p>
						</div>
						<div>
							<BootstrapDao {daoContractId} />
						</div>
					{:else}
						<DaoBanner contractId={daoContractId} />
						<h1 class="text-2xl">Manage DAO</h1>
						<p class="py-2">
							Proposals can change the DAO configuration of the DAO by activating, deactivating the
							extensions. For example a proposal can automatically switch the current voting
							extension for a new type of voting.
						</p>
						<p class="py-2">
							There are two ways for proposals to pass - voting via the whole DAO community and
							voting via the core team.
						</p>
						<div class="mt-5">
							<ul class="ps-5">
								{#if false}
									<li class="list-disc">
										<a
											href="/"
											onclick={(e) => {
												e.preventDefault();
												showCoreExecute = !showCoreExecute;
											}}>run core actions</a
										>
									</li>
								{/if}
								<li class="list-disc">
									<a
										href="/"
										onclick={(e) => {
											e.preventDefault();
											showExtensions = !showExtensions;
										}}>view current extensions</a
									>
								</li>
								<li class="list-disc">
									<a
										href="/"
										onclick={(e) => {
											e.preventDefault();
											showProposals = !showProposals;
										}}>view finished proposals</a
									>
								</li>
								<li class="list-disc">
									<button
										onclick={() => (showOpenProposals = !showOpenProposals)}
										class="hover:underline">view open proposals</button
									>
								</li>
								<li class="list-disc">
									<a href={`${base}/dao/manager/propose/${daoContractId}`}>make a new proposal</a>
								</li>
								<li class="list-disc">
									<a href={`${base}/dao/transfers`}>transfer tokens</a>
								</li>
							</ul>
						</div>
						<!-- {#if showCoreExecute}
							<SlotModal onClose={() => closeModal()}>
								<div slot="modalBody">
									<CoreSignalExecute />
								</div>
							</SlotModal>
						{/if}
						{#if showExtensions}
							<SlotModal onClose={() => closeModal()}>
								<div slot="modalBody">
									<ExtensionList {daoContractId} />
								</div>
							</SlotModal>
						{/if}
						{#if showProposals}
							<SlotModal onClose={() => closeModal()}>
								<div slot="modalBody">
									<ProposalList {daoContractId} status={'open'} />
								</div>
							</SlotModal>
						{/if}
						{#if showOpenProposals}
							<SlotModal onClose={() => closeModal()}>
								<div slot="modalBody">
									<ProposalList {daoContractId} status={'open'} />
								</div>
							</SlotModal>
						{/if} -->
						<div class="my-10">
							<p class="">Keep the DAO up to date.</p>
							<ul class="mt-4 ps-5">
								<li class="list-disc">
									<a
										href="/"
										onclick={(e) => {
											e.preventDefault();
											baseDaoEvents();
										}}>read dao events</a
									>
								</li>
							</ul>
						</div>
						<div class="my-10">
							<p class="">Manage IDO.</p>
							<ul class="mt-4 ps-5">
								<li class="list-disc">
									<a
										href="/"
										onclick={(e) => {
											e.preventDefault();
											initIdo();
										}}>initialise ido</a
									>
								</li>
							</ul>
						</div>
					{/if}
				</div>
			{:else}
				<div>Loading...</div>
			{/if}
		</div>
	</div>
</div>
