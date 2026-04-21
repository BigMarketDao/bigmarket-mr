<script lang="ts">
	type Fields = { contractName: string; title: string; author: string; synopsis: string; description: string };

	const { onAddNewPoll }: { onAddNewPoll?: (fields: Fields) => void } = $props();

	let fields: Fields = $state({ contractName: '', title: '', author: '', synopsis: '', description: '' });
	let errors: Fields = $state({ contractName: '', title: '', author: '', synopsis: '', description: '' });

	if (typeof localStorage !== 'undefined' && localStorage.getItem('PROPOSAL_FORM')) {
		fields = JSON.parse(localStorage.getItem('PROPOSAL_FORM')!);
	}

	const saveContractName = () => {
		fields.contractName = fields.contractName.toLowerCase().replace(/\s/g, '-');
		localStorage.setItem('PROPOSAL_FORM', JSON.stringify(fields));
	};

	const saveDescription = () => {
		let desc = fields.description.replace(/\n/g, '').replace(/;; /g, '');
		const words = desc.split(' ');
		for (let i = 0; i < words.length; i++) {
			words[i] = (i === 0 || i % 8 === 0 ? '\n;; ' : '') + words[i];
		}
		fields.description = words.join(' ');
		localStorage.setItem('PROPOSAL_FORM', JSON.stringify(fields));
	};

	const saveForm = () => {
		fields.title = fields.title.replace(/\\/g, '');
		fields.author = fields.author.replace(/\\/g, '');
		fields.synopsis = fields.synopsis.replace(/\\/g, '');
		localStorage.setItem('PROPOSAL_FORM', JSON.stringify(fields));
	};

	const submitHandler = () => {
		let valid = true;
		errors.contractName = fields.contractName.trim().length < 2
			? 'contract name is required - no spaces, dots, underscores or special characters'
			: '';
		if (errors.contractName) valid = false;

		errors.title = fields.title.trim().length < 5 ? 'title is required' : '';
		if (errors.title) valid = false;

		errors.author = fields.author.trim().length < 1 ? 'author is required' : '';
		if (errors.author) valid = false;

		errors.synopsis = fields.synopsis.trim().length < 1 ? 'synopsis is required' : '';
		if (errors.synopsis) valid = false;

		errors.description = fields.description.trim().length < 1 ? 'Description is required' : '';
		if (errors.description) valid = false;

		if (valid) {
			saveDescription();
			saveForm();
			onAddNewPoll?.(fields);
		}
	};
</script>

<div class=" mx-10 mb-4">
	<p>
		Enter the information required then press 'update' - the information will be copied into the
		contract template. Press deploy to deploy the contract on the Stacks Blockchain.
	</p>
	<form onsubmit={(e) => { e.preventDefault(); submitHandler(); }}>
		<div class="form-field">
			<label for="contractName">Contract Name (max 60 chars)</label>
			<input
			class="rounded-lg border-gray-300 px-2 py-1 text-black"
			maxlength="60"
			type="text"
			id="contractName"
			bind:value={fields.contractName}
			oninput={saveContractName}
			/>
			<div class="error">{errors.contractName}</div>
		</div>
		<div class="form-field">
			<label for="title">Title (max 60 chars)</label>
			<input
			class="rounded-lg border-gray-300 px-2 py-1 text-black"
			maxlength="60"
			type="text"
			id="title"
			bind:value={fields.title}
			oninput={saveForm}
			/>
			<div class="error">{errors.title}</div>
		</div>
		<div class="form-field">
			<label for="author">Author (max 60 chars)</label>
			<input
			class="rounded-lg border-gray-300 px-2 py-1 text-black"
			maxlength="60"
			type="text"
			id="author"
			bind:value={fields.author}
			oninput={saveForm}
			/>
			<div class="error">{errors.author}</div>
		</div>
		<div class="form-field">
			<label for="synopsis">Synopsis (max 100 chars)</label>
			<input
			class="rounded-lg border-gray-300 px-2 py-1 text-black"
			maxlength="100"
			type="text"
			id="synopsis"
			bind:value={fields.synopsis}
			oninput={saveForm}
			/>
			<div class="error">{errors.synopsis}</div>
		</div>
		<div class="form-field">
			<label for="description">Description (max 500 chars)</label>
			<!-- svelte-ignore element_invalid_self_closing_tag -->
			<textarea
			class="rounded-lg border-gray-300 px-2 py-1 text-black"
			maxlength="500"
			rows="3"
			id="description"
			bind:value={fields.description}
			oninput={saveForm}
			/>
			<div class="error">{errors.description}</div>
		</div>
		<div class="mt-4">
			<button
				class="inline-flex w-full items-center justify-center gap-x-1.5 rounded-xl border border-primary-600 bg-primary-01 px-4 py-2 text-center text-base text-black hover:bg-primary-800 focus:outline-none focus:ring-4 focus:ring-primary-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500/50 dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800"
				>Update</button
			>
		</div>
	</form>
</div>

<style>
	form {
		width: 100%;
		margin: 0 auto;
		text-align: left;
	}
	.form-field {
		margin: 10px auto;
	}
	textarea {
		width: 100%;
	}
	input {
		width: 100%;
	}
	label {
		vertical-align: top;
		width: 100%;
		margin: 5px auto;
		text-align: left;
	}
	.error {
		text-align: right;
		font-weight: bold;
		font-size: 12px;
		color: #d91b42;
	}
</style>
