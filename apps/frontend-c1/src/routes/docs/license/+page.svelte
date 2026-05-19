<script lang="ts">
	import LegalDocLayout from '$lib/components/legal/LegalDocLayout.svelte';
</script>

<LegalDocLayout
	title="Content License (MIT)"
	description="License terms for this website, documentation, and related open-source materials."
>
	<h2>MIT License</h2>
	<p>Copyright &copy; {new Date().getFullYear()} BigMarket DAO contributors</p>
	<p>
		Permission is hereby granted, free of charge, to any person obtaining a copy of this website
		content, documentation, and accompanying materials (the <strong>“Materials”</strong>), to deal in
		the Materials without restriction, including without limitation the rights to use, copy, modify,
		merge, publish, distribute, sublicense, and/or sell copies of the Materials, and to permit persons
		to whom the Materials are furnished to do so, subject to the following conditions:
	</p>
	<p>
		The above copyright notice and this permission notice shall be included in all copies or
		substantial portions of the Materials.
	</p>
	<p>
		THE MATERIALS ARE PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
		BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
		NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
		DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT
		OF OR IN CONNECTION WITH THE MATERIALS OR THE USE OR OTHER DEALINGS IN THE MATERIALS.
	</p>

	<h2>How you may use our content</h2>
	<ul>
		<li>You may fork, translate, or republish documentation for education or integration.</li>
		<li>You must retain the copyright notice and this license in redistributions.</li>
		<li>
			You may <strong>not</strong> imply that your fork is the official BigMarket product, operate a
			phishing clone, or remove risk disclosures.
		</li>
	</ul>

	<h2>What this license does not cover</h2>
	<p>
		Smart contracts, logos, and third-party assets may be licensed differently. Check the
		<a href="https://github.com/BigMarketDao" target="_blank" rel="noopener noreferrer">GitHub repository</a>
		for contract licenses and attribution requirements. Wallet software (Leather, Xverse, etc.) is
		governed by its own vendors.
	</p>

	<h2>Trademarks</h2>
	<p>
		“BigMarket” and related marks are used to identify the project. This MIT license does not grant
		trademark rights. Contact the DAO before using our branding in commercial products.
	</p>
</LegalDocLayout>
