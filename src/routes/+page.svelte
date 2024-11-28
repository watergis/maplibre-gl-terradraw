<script lang="ts">
	import {
		CodeBlock,
		InputChip,
		RadioGroup,
		RadioItem,
		Tab,
		TabGroup,
		SlideToggle
	} from '@skeletonlabs/skeleton';
	import type { PageData } from './$types.js';
	import { AvailableModes } from '$lib/constants/AvailableModes.js';
	import { onMount } from 'svelte';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	let importTypeTabs = [
		{ label: 'NPM', value: 'npm' },
		{ label: 'CDN', value: 'cdn' }
	];
	let importTypeTabSet: string = $state(importTypeTabs[0].value);

	let availableMode: string[] = AvailableModes as unknown as string[];
	let selectedModes: string[] = $state([]);
	let isOpen = $state(true);

	let packageManager = $state('npm');

	onMount(() => {
		if (selectedModes.length === 0) {
			selectedModes = ['render', ...availableMode.filter((m) => m !== 'render')];
		}
	});
</script>

<div class="px-4">
	<div class="text-center">
		<h2 class="h1 pt-4 pb-6">Welcome to {data.metadata.title}</h2>

		<div class="flex justify-center space-x-2 pb-4">
			{data.metadata.description}
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

		<a
			class="btn variant-filled-primary capitalize"
			href="{selectedModes.length === 0
				? ''
				: `/demo?modes=${selectedModes.join(',')}`}&open={isOpen}"
			tabindex={selectedModes.length === 0 ? 0 : -1}
		>
			Open DEMO ({data.metadata.version})
		</a>

		<h4 class="h4 pt-6">Choose options for demo</h4>
		<p>Your chosen options are automatically applied at the demo and the below usage code.</p>

		<InputChip
			name="terradraw-modes"
			placeholder="{selectedModes.length === 0
				? 'Select at least a mode. '
				: ''}Select TerraDraw modes to be added"
			bind:value={selectedModes}
			whitelist={availableMode}
		/>

		<p>
			By default, all Terra Draw modes will be added to the control. However, you might want to
			remove some drawing modes from your app.
		</p>

		<SlideToggle name="slide" bind:checked={isOpen}
			>{isOpen ? 'Open' : 'Close'} drawing editor as default</SlideToggle
		>

		<p>
			if you want the drawing tool to be always expanded, simplely remove `render` mode from
			constuctor options, then set `true` to `open` property.
		</p>

		<TabGroup>
			{#each importTypeTabs as tab}
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
					<CodeBlock
						language="shell"
						code={`npm install --save-dev ${data.metadata.packageName}`}
					/>
				{:else if packageManager === 'yarn'}
					<CodeBlock language="shell" code={`yarn add --dev ${data.metadata.packageName}`} />
				{:else if packageManager === 'pnpm'}
					<CodeBlock language="shell" code={`pnpm add --save-dev ${data.metadata.packageName}`} />
				{/if}
			</div>

			<h3 class="h3 pt-6 pb-4">Usage</h3>

			<p>Copy and past the below code.</p>

			<CodeBlock
				language="ts"
				lineNumbers
				code={data.examples.npm
					.replace('{modes}', selectedModes.map((m) => `'${m}'`).join(','))
					.replace('{open}', `${isOpen}`)}
			/>
		</div>

		<div hidden={importTypeTabSet !== 'cdn'}>
			<h3 class="h3 pt-6">Usage</h3>

			<CodeBlock
				language="html"
				lineNumbers
				code={data.examples.cdn
					.replace('{modes}', selectedModes.map((m) => `'${m}'`).join(','))
					.replace('{open}', `${isOpen}`)}
			/>
		</div>

		<h3 class="h3 pt-6">Customization</h3>

		<nav class="list-nav pt-4 pb-6">
			<ul>
				{#each data.customization as custom}
					<li>
						<a href={custom.href}>
							<span class="badge bg-primary-500"><i class="fa-solid fa-arrow-right"></i></span>
							<span class="flex-auto">
								<span class="font-bold">{custom.title}</span> - {custom.description}
							</span>
						</a>
					</li>
				{/each}
			</ul>
		</nav>
	</div>

	<hr />
	<div class="space-y-2 py-4">
		{#each data.metadata.licenses as license}
			<p class="space-x-2">{license}</p>
		{/each}
	</div>
</div>

<style lang="postcss">
</style>
