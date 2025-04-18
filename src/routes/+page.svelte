<script lang="ts">
	import {
		AvailableModes,
		debounce,
		type AreaUnit,
		type DistanceUnit,
		type TerradrawMode
	} from '$lib';
	import { Segment, Tabs } from '@skeletonlabs/skeleton-svelte';
	import type { PageData } from './$types';
	import CodeBlock from './CodeBlock.svelte';
	import DemoController from './DemoController.svelte';
	import DemoMap from './DemoMap.svelte';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	let year = new Date().getFullYear();

	let importTypeTabs = [
		{ label: 'NPM', value: 'npm' },
		{ label: 'CDN', value: 'cdn' }
	];
	let importTypeTabSet: string = $state(importTypeTabs[0].value);

	let packageManager = $state('npm');

	let updateDemo = $state(false);

	let controlType: 'default' | 'measure' = $state('default');
	let isOpen: 'open' | 'close' | undefined = $state('open');
	let selectedModes: TerradrawMode[] = $state(JSON.parse(JSON.stringify(AvailableModes)));

	let selectedFeature: string = $state('');
	let distanceUnit: DistanceUnit = $state('kilometers');
	let distancePrecision: number = $state(2);
	let areaUnit: AreaUnit = $state('metric');
	let areaPrecision: number = $state(2);
	let computeElevation: 'enabled' | 'disabled' = $state('enabled');

	let searchQuery = $state('');
	let examples = $state(JSON.parse(JSON.stringify(data.examples)));

	const handleMeasureChange = (
		type: 'distanceUnit' | 'distancePrecision' | 'areaUnit' | 'areaPrecision' | 'computeElevation',
		value: string | number | number[]
	) => {
		if (type === 'distanceUnit') {
			distanceUnit = value as DistanceUnit;
		} else if (type === 'distancePrecision') {
			distancePrecision = value as number;
		} else if (type === 'areaUnit') {
			areaUnit = value as AreaUnit;
		} else if (type === 'areaPrecision') {
			areaPrecision = value as number;
		} else if (type === 'computeElevation') {
			computeElevation = value as 'enabled' | 'disabled';
		}
	};

	const handleSearchExamples = debounce(() => {
		if (searchQuery.length === 0) {
			examples = JSON.parse(JSON.stringify(data.examples));
			return;
		}

		const filteredExamples = data.examples.filter(
			(example: { title: string; description: string }) => {
				const query = searchQuery.toLowerCase();
				return (
					example.title.toLowerCase().includes(query) ||
					example.description.toLowerCase().includes(query)
				);
			}
		);

		examples = filteredExamples;
	}, 1000);
</script>

<div class="snap-y overflow-y-scroll h-full">
	<section id="demo" class="demo-container grid grid-cols-[auto_1fr] snap-start">
		<aside class="sidebar col-span-1 h-screen p-4 w-sm overflow-y-auto hidden md:block">
			<DemoController
				bind:controlType
				bind:isOpen
				bind:selectedModes
				bind:selectedFeature
				bind:distanceUnit
				bind:distancePrecision
				bind:areaUnit
				bind:areaPrecision
				bind:computeElevation
				onchange={() => {
					updateDemo = !updateDemo;
				}}
				onMeasureChange={handleMeasureChange}
			></DemoController>

			<div class="flex justify-center mt-6">
				<button
					class="btn btn-lg preset-filled capitalize"
					onclick={() => {
						document.getElementById('getting-started')?.scrollIntoView({ behavior: 'smooth' });
					}}
				>
					Getting started
				</button>
			</div>
		</aside>

		<main class="map col-span-2 md:col-span-1">
			{#key updateDemo}
				<DemoMap
					styles={data.styles}
					modes={selectedModes}
					{controlType}
					isOpen={isOpen === 'open'}
					geojson={data.geojson}
					bind:selectedFeature
					bind:distanceUnit
					bind:distancePrecision
					bind:areaUnit
					bind:areaPrecision
					bind:computeElevation
				></DemoMap>
			{/key}

			<button
				class="md:hidden absolute bottom-4 left-1/2 -translate-x-1/2 z-10 btn btn-base preset-filled"
				onclick={() => {
					document.getElementById('getting-started')?.scrollIntoView({ behavior: 'smooth' });
				}}
			>
				Getting started
			</button>
		</main>
	</section>

	<section id="getting-started" class="px-4 snap-start">
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
								<CodeBlock
									lang="console"
									code={`pnpm add --save-dev ${data.metadata.packageName}`}
								/>
							{:else if packageManager === 'bun'}
								<CodeBlock
									lang="console"
									code={`bun install --save-dev ${data.metadata.packageName}`}
								/>
							{/if}
						</div>

						<h3 class="h3 pt-6 pb-4">Usage</h3>

						<p>Copy and paste the below code.</p>

						{#key updateDemo}
							<CodeBlock
								lang="js"
								code={data.codes.npm
									.replace(
										/MaplibreTerradrawControl/g,
										controlType === 'default'
											? 'MaplibreTerradrawControl'
											: 'MaplibreMeasureControl'
									)
									.replace('{modes}', selectedModes.map((m) => `'${m}'`).join(','))
									.replace('{open}', isOpen === 'open' ? 'true' : 'false')}
							/>
						{/key}
					</Tabs.Panel>
					<Tabs.Panel value="cdn">
						<h3 class="h3 pt-6">Usage</h3>

						{#key updateDemo}
							<CodeBlock
								lang="html"
								code={data.codes.cdn
									.replace(
										/MaplibreTerradrawControl\(/g,
										controlType === 'default'
											? 'MaplibreTerradrawControl('
											: 'MaplibreMeasureControl('
									)
									.replace('{modes}', selectedModes.map((m) => `'${m}'`).join(','))
									.replace('{open}', isOpen === 'open' ? 'true' : 'false')}
							/>
						{/key}
					</Tabs.Panel>
				{/snippet}
			</Tabs>
		</div>
	</section>

	<section id="api-doc" class="px-4 snap-end">
		<h3 class="h3 pt-6">API Documentation</h3>

		<p class="py-4">
			See <a
				href="https://watergis.github.io/maplibre-gl-terradraw"
				class="text-blue-800 dark:text-surface-50 visited:text-purple-800 dark:visited:text-error-400"
				>Plugin API documentation</a
			>
		</p>
	</section>
	<section id="examples" class="px-4 snap-start">
		<h3 class="h3 pt-6">Examples</h3>

		<div class="py-4">
			<input
				class="input mb-4"
				type="search"
				placeholder="Search examples..."
				bind:value={searchQuery}
				oninput={handleSearchExamples}
			/>

			<div class="flex flex-wrap gap-4">
				{#each examples as custom (custom.title)}
					<a
						class="card preset-filled-surface-100-900 border-[1px] border-surface-200-800 card-hover divide-surface-200-800 block overflow-hidden sm:w-auto md:max-w-48 lg:max-w-64 xl:max-w-80"
						href={custom.href}
						data-sveltekit-preload-data="off"
					>
						<header class="aspect-[21/9] w-full">
							<img class="preview-image pt-2" src={custom.image} alt={custom.title} />
						</header>
						<article class="space-y-4 p-4">
							<div>
								<h2 class="h6">{custom.title}</h2>
							</div>
							<p class="description">
								{custom.description}
							</p>
						</article>
					</a>
				{/each}
			</div>
		</div>
	</section>

	<footer class="bg-surface-50 dark:bg-surface-900 p-4">
		<p class="text-center w-full">
			<a
				class="text-blue-800 dark:text-surface-50 visited:text-purple-800 dark:visited:text-error-400"
				href={data.metadata.contact}
				target="_blank"
			>
				©{year}
				{data.metadata.author}
			</a>
		</p>
	</footer>
</div>

<style lang="postcss">
	.demo-container {
		position: relative;
		width: 100%;
		height: 100%;

		.sidebar {
			height: 100%;
		}
		.map {
			height: 100%;
		}
	}

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
