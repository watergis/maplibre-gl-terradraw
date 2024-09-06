<script lang="ts">
	import { CodeBlock, RadioGroup, RadioItem, Tab, TabGroup } from '@skeletonlabs/skeleton';
	import { onMount } from 'svelte';
	import type { PageData } from './$types.js';

	export let data: PageData;

	let imprtTypeTabs = [
		{ label: 'NPM', value: 'npm' },
		{ label: 'CDN', value: 'cdn' }
	];
	let importTypeTabSet: string = imprtTypeTabs[0].value;

	let packageManager = 'npm';
	let version = 'latest';
	let cdnExample = '';
	let npmExample = '';

	const getVersion = async () => {
		const res = await fetch(`https://registry.npmjs.org/${data.packageName}/latest`);
		if (!res.ok) {
			return;
		}
		const json = await res.json();
		version = json.version;
	};

	const getExample = async (type: 'cdn' | 'npm') => {
		let url = `/assets/maplibre-npm-example.txt`;
		if (type === 'cdn') {
			url = `/index_cdn.html`;
		}
		const res = await fetch(url);
		if (!res.ok) {
			return '';
		}
		return await res.text();
	};

	onMount(() => {
		getVersion().then(() => {
			getExample('cdn').then((text) => {
				cdnExample = text.replace(
					/..\/..\//g,
					`https://cdn.jsdelivr.net/npm/@watergis/maplibre-gl-terradraw@${version}/`
				);
			});
			getExample('npm').then((text) => {
				npmExample = text.replace(/{style}/g, data.style);
			});
		});
	});
</script>

<div class="px-4">
	<div class="text-center">
		<h2 class="h1 pt-4 pb-6">Welcome to {data.title}</h2>

		<div class="flex justify-center space-x-2 pb-4">
			This plugin is to add controls to your MapLibre for sketching powered by Terra Draw library.
		</div>

		<div class="flex justify-center space-x-2">
			<img
				class=" h-auto max-w-sm md:max-w-lg rounded-lg"
				src="/assets/plugin-overview.webp"
				alt="Overview of Plugin"
			/>
		</div>
	</div>

	<div class="space-y-2">
		<h3 class="h3 pt-6 pb-4">Demo</h3>

		<a class="btn variant-filled-primary capitalize" href="/demo">
			Open DEMO ({version})
		</a>

		<TabGroup>
			{#each imprtTypeTabs as tab}
				<Tab bind:group={importTypeTabSet} name={tab.value} value={tab.value}>{tab.label}</Tab>
			{/each}
		</TabGroup>

		<div class="p-2" hidden={importTypeTabSet !== 'npm'}>
			<h3 class="h3 pt-6 pb-4">Install</h3>
			<p>Getting start with installing the package</p>

			<RadioGroup active="variant-filled-primary" hover="hover:variant-soft-primary">
				<RadioItem bind:group={packageManager} name="justify" value={'npm'}>npm</RadioItem>
				<RadioItem bind:group={packageManager} name="justify" value={'yarn'}>yarn</RadioItem>
				<RadioItem bind:group={packageManager} name="justify" value={'pnpm'}>pnpm</RadioItem>
			</RadioGroup>

			<div class="pt-2">
				{#if packageManager === 'npm'}
					<CodeBlock language="shell" code={`npm install --save-dev ${data.packageName}`} />
				{:else if packageManager === 'yarn'}
					<CodeBlock language="shell" code={`yarn add --dev ${data.packageName}`} />
				{:else if packageManager === 'pnpm'}
					<CodeBlock language="shell" code={`pnpm add --save-dev ${data.packageName}`} />
				{/if}
			</div>

			<h3 class="h3 pt-6 pb-4">Usage</h3>

			<p>Copy and past the below code.</p>

			<CodeBlock language="ts" lineNumbers code={npmExample} />
		</div>

		<div hidden={importTypeTabSet !== 'cdn'}>
			<h3 class="h3 pt-6">Usage</h3>

			<CodeBlock language="html" lineNumbers code={cdnExample} />
		</div>
	</div>

	<div class="space-y-2 py-4">
		<p class="flex justify-center space-x-2">The source code is licensed MIT.</p>
		<p class="flex justify-center space-x-2">The website content is licensed CC BY NC SA 4.0.</p>
	</div>
</div>

<style lang="postcss">
</style>
