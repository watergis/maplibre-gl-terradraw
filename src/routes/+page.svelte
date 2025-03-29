<script lang="ts">
	// import { AvailableModes } from '$lib';
	// import { Segment, Tabs, TagsInput } from '@skeletonlabs/skeleton-svelte';
	// import { onMount } from 'svelte';
	// import type { PageData } from './$types';
	// import CodeBlock from './CodeBlock.svelte';

	// interface Props {
	// 	data: PageData;
	// }

	// let { data }: Props = $props();

	// let year = new Date().getFullYear();

	// let importTypeTabs = [
	// 	{ label: 'NPM', value: 'npm' },
	// 	{ label: 'CDN', value: 'cdn' }
	// ];
	// let importTypeTabSet: string = $state(importTypeTabs[0].value);

	// let availableMode: string[] = AvailableModes as unknown as string[];
	// let selectedModes: string[] = $state([]);
	// let isOpen: 'open' | 'close' | undefined = $state();

	// let packageManager = $state('npm');
	// let controlType: 'default' | 'measure' | undefined = $state();
	// let openValue = $derived(isOpen === 'open' ? 'true' : 'false');
	// let demoUrl = $derived(
	// 	selectedModes.length === 0
	// 		? ''
	// 		: `/demo?modes=${(controlType
	// 				? selectedModes
	// 				: selectedModes.filter((x) => x !== 'point')
	// 			).join(',')}&open=${openValue}&measure=${controlType === 'default' ? 'false' : 'true'}`
	// );

	// onMount(() => {
	// 	controlType = 'default';
	// 	isOpen = 'open';
	// 	if (selectedModes.length === 0) {
	// 		selectedModes = ['render', ...availableMode.filter((m) => m !== 'render')];
	// 	}
	// });
</script>

test

<!-- <div class="px-4">
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
			class="btn preset-filled capitalize"
			href={demoUrl}
			tabindex={selectedModes.length === 0 ? 0 : -1}
		>
			Open DEMO ({data.metadata.version})
		</a>

		<h4 class="h4 pt-6">Choose control type</h4>
		<p>
			Default control is MaplibreTerradrawControl. If you want to use measure control, enable to
			choose MaplibreMeasureControl.
		</p>

		<Segment
			name="control-type"
			value={controlType}
			onValueChange={(e) => (controlType = e.value as 'default' | 'measure')}
		>
			<Segment.Item value="default">Default Control</Segment.Item>
			<Segment.Item value="measure">Measure Control</Segment.Item>
		</Segment>

		<h4 class="h4 pt-6">Choose options for demo</h4>
		<p>Your chosen options are automatically applied at the demo and the below usage code.</p>
		<p>
			By default, all Terra Draw modes will be added to the control. However, you might want to
			remove some drawing modes from your app.
		</p>

		{#key controlType}
			<TagsInput
				name="terradraw-modes"
				placeholder="{selectedModes.length === 0
					? 'Select at least a mode. '
					: ''}Select TerraDraw modes to be added"
				value={selectedModes}
				onValueChange={(e) => (selectedModes = e.value)}
				validate={(details) => availableMode.includes(details.inputValue)}
			/>
		{/key}

		<h4 class="h4 pt-6">Choose default open mode</h4>

		<Segment
			name="is-open"
			value={isOpen}
			onValueChange={(e) => (isOpen = e.value as 'open' | 'close')}
		>
			<Segment.Item value="open">Open as default</Segment.Item>
			<Segment.Item value="close">Close as default</Segment.Item>
		</Segment>

		<p>
			if you want the drawing tool to be always expanded, simplely remove `render` mode from
			constuctor options, then set `true` to `open` property.
		</p>

		<Tabs value={importTypeTabSet} onValueChange={(e) => (importTypeTabSet = e.value)}>
			{#snippet list()}
				{#each importTypeTabs as tab (tab.value)}
					<Tabs.Control value={tab.value}>{tab.label}</Tabs.Control>
				{/each}
			{/snippet}
			{#snippet content()}
				<Tabs.Panel value="npm">
					<h3 class="h3 pt-6 pb-4">Install</h3>
					<p>Getting start with installing the package</p>

					<Segment
						name="package-manager"
						value={packageManager}
						onValueChange={(e) => (packageManager = e.value as string)}
					>
						<Segment.Item value="npm">npm</Segment.Item>
						<Segment.Item value="yarn">yarn</Segment.Item>
						<Segment.Item value="pnpm">pnpm</Segment.Item>
						<Segment.Item value="bun">bun</Segment.Item>
					</Segment>

					<div class="pt-2">
						{#if packageManager === 'npm'}
							<CodeBlock
								lang="console"
								code={`npm install --save-dev ${data.metadata.packageName}`}
							/>
						{:else if packageManager === 'yarn'}
							<CodeBlock lang="console" code={`yarn add --dev ${data.metadata.packageName}`} />
						{:else if packageManager === 'pnpm'}
							<CodeBlock lang="console" code={`pnpm add --save-dev ${data.metadata.packageName}`} />
						{:else if packageManager === 'bun'}
							<CodeBlock
								lang="console"
								code={`bun install --save-dev ${data.metadata.packageName}`}
							/>
						{/if}
					</div>

					<h3 class="h3 pt-6 pb-4">Usage</h3>

					<p>Copy and paste the below code.</p>

					<CodeBlock
						lang="js"
						code={data.codes.npm
							.replace(
								/MaplibreTerradrawControl/g,
								controlType === 'default' ? 'MaplibreTerradrawControl' : 'MaplibreMeasureControl'
							)
							.replace(
								'{modes}',
								(controlType === 'default'
									? selectedModes.map((m) => `'${m}'`)
									: selectedModes.filter((x) => x !== 'point').map((m) => `'${m}'`)
								).join(',')
							)
							.replace('{open}', openValue)}
					/>
				</Tabs.Panel>
				<Tabs.Panel value="cdn">
					<h3 class="h3 pt-6">Usage</h3>

					<CodeBlock
						lang="html"
						code={data.codes.cdn
							.replace(
								/MaplibreTerradrawControl\(/g,
								controlType === 'default' ? 'MaplibreTerradrawControl(' : 'MaplibreMeasureControl('
							)
							.replace(
								'{modes}',
								(controlType === 'default'
									? selectedModes.map((m) => `'${m}'`)
									: selectedModes.filter((x) => x !== 'point').map((m) => `'${m}'`)
								).join(',')
							)
							.replace('{open}', openValue)}
					/>
				</Tabs.Panel>
			{/snippet}
		</Tabs>

		<h3 class="h3 pt-6">API Documentation</h3>

		<p class="py-4">
			The plugin <span class="font-bold">API documentation</span> is available
			<a
				href="https://watergis.github.io/maplibre-gl-terradraw"
				class="text-blue-600 visited:text-purple-600">here</a
			>.
		</p>

		<h3 class="h3 pt-6">Examples</h3>

		<div class="py-4">
			<div class="flex flex-wrap gap-4">
				{#each data.examples as custom (custom.title)}
					<a
						class="card preset-filled-surface-100-900 border-[1px] border-surface-200-800 card-hover divide-surface-200-800 block overflow-hidden sm:w-auto md:max-w-48 lg:max-w-64 xl:max-w-80"
						href={custom.href}
					>
						<header class="aspect-[21/9] w-full">
							<img class="preview-image pt-2" src={custom.image} alt={custom.title} />
						</header>
						<article class="space-y-4 p-4">
							<div>
								<h2 class="h6">{custom.title}</h2>
							</div>
							<p class="description opacity-60">
								{custom.description}
							</p>
						</article>
					</a>
				{/each}
			</div>
		</div>
	</div>
</div> -->

<!-- <footer class="bg-gray-200 p-4">
	<p class="text-center w-full">
		<a class="text-blue-600 visited:text-purple-600" href={data.metadata.contact} target="_blank">
			©{year}
			{data.metadata.author}
		</a>
	</p>
</footer> -->

<style lang="postcss">
	/* .preview-image {
		max-height: 130px;
		margin: 0 auto;
	}
	.description {
		display: -webkit-box;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 3;
		overflow: hidden;
	} */
</style>
