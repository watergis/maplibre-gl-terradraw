<script lang="ts">
	import {
		CodeBlock,
		InputChip,
		RadioGroup,
		RadioItem,
		Tab,
		TabGroup
	} from '@skeletonlabs/skeleton';
	import type { PageData } from './$types';
	import { onMount } from 'svelte';
	import { AvailableMeasureModes, AvailableModes } from '$lib';

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
	let availableMeasureMode: string[] = AvailableMeasureModes as unknown as string[];
	let selectedModes: string[] = $state([]);
	let isOpen: boolean | undefined = $state();

	let packageManager = $state('npm');
	let controlType: 'default' | 'measure' | undefined = $state();
	let demoUrl = $derived(
		selectedModes.length === 0
			? ''
			: `/demo?modes=${(controlType
					? selectedModes
					: selectedModes.filter((x) => x !== 'point')
				).join(',')}&open=${isOpen}&measure=${controlType === 'default' ? 'false' : 'true'}`
	);

	onMount(() => {
		controlType = 'default';
		isOpen = true;
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

		<RadioGroup active="variant-filled-primary" hover="hover:variant-soft-primary">
			<RadioItem bind:group={controlType} name="justify" value={'default'}>
				Default Control
			</RadioItem>
			<RadioItem bind:group={controlType} name="justify" value={' measure'}>
				Measure Control
			</RadioItem>
		</RadioGroup>

		<h4 class="h4 pt-6">Choose options for demo</h4>
		<p>Your chosen options are automatically applied at the demo and the below usage code.</p>

		<InputChip
			name="terradraw-modes"
			placeholder="{selectedModes.length === 0
				? 'Select at least a mode. '
				: ''}Select TerraDraw modes to be added"
			bind:value={selectedModes}
			whitelist={controlType === 'default' ? availableMode : availableMeasureMode}
		/>

		<p>
			By default, all Terra Draw modes will be added to the control. However, you might want to
			remove some drawing modes from your app.
		</p>

		<h4 class="h4 pt-6">Choose default open mode</h4>

		<RadioGroup active="variant-filled-primary" hover="hover:variant-soft-primary">
			<RadioItem bind:group={isOpen} name="justify" value={true}>Open as default</RadioItem>
			<RadioItem bind:group={isOpen} name="justify" value={false}>Close as default</RadioItem>
		</RadioGroup>

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
				<RadioItem bind:group={packageManager} name="justify" value={'bun'}>bun</RadioItem>
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
				{:else if packageManager === 'bun'}
					<CodeBlock
						language="shell"
						code={`bun install --save-dev ${data.metadata.packageName}`}
					/>
				{/if}
			</div>

			<h3 class="h3 pt-6 pb-4">Usage</h3>

			<p>Copy and paste the below code.</p>

			<CodeBlock
				language="ts"
				lineNumbers
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
					.replace('{open}', `${isOpen}`)}
			/>
		</div>

		<div hidden={importTypeTabSet !== 'cdn'}>
			<h3 class="h3 pt-6">Usage</h3>

			<CodeBlock
				language="html"
				lineNumbers
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
					.replace('{open}', `${isOpen}`)}
			/>
		</div>

		<h3 class="h3 pt-6">API Documentation</h3>

		<p class="py-4">
			The plugin <span class="font-bold">API documentation</span> is available
			<a
				href="https://watergis.github.io/maplibre-gl-terradraw"
				class="text-blue-600 visited:text-purple-600">here</a
			>.
		</p>

		<h3 class="h3 pt-6">
			<a href="/examples" class="text-blue-600 visited:text-purple-600">Examples</a>
		</h3>

		<div class="py-4">
			<div class="flex flex-wrap gap-4">
				{#each data.examples as custom}
					<a
						class="card card-hover sm:w-auto md:max-w-48 lg:max-w-64 xl:max-w-80"
						href={custom.href}
					>
						<header class="card-header font-bold min-h-16">{custom.title}</header>
						<section class="card-image p-4">
							<img class="preview-image" src={custom.image} alt={custom.title} />
						</section>
						<footer class="card-footer"><p class="description">{custom.description}</p></footer>
					</a>
				{/each}
			</div>
		</div>
	</div>

	<hr />
	<div class="space-y-2 py-4">
		{#each data.metadata.licenses as license}
			<p class="space-x-2">{license}</p>
		{/each}
	</div>
</div>

<style lang="postcss">
	.preview-image {
		max-height: 130px;
		margin: 0 auto;
	}
	.description {
		display: -webkit-box;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 3;
		overflow: hidden;
	}
</style>
