<script lang="ts">
	import { CodeBlock, RadioGroup, RadioItem, Tab, TabGroup } from '@skeletonlabs/skeleton';
	import type { PageData } from './$types.js';

	export let data: PageData;

	let importTypeTabs = [
		{ label: 'NPM', value: 'npm' },
		{ label: 'CDN', value: 'cdn' }
	];
	let importTypeTabSet: string = importTypeTabs[0].value;

	let packageManager = 'npm';
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

		<a class="btn variant-filled-primary capitalize" href="/demo">
			Open DEMO ({data.metadata.version})
		</a>

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

			<CodeBlock language="ts" lineNumbers code={data.examples.npm} />
		</div>

		<div hidden={importTypeTabSet !== 'cdn'}>
			<h3 class="h3 pt-6">Usage</h3>

			<CodeBlock language="html" lineNumbers code={data.examples.cdn} />
		</div>

		<h3 class="h3 pt-6">Customization</h3>

		<h4 class="h4 pt-6">Get rid of some drawing modes</h4>

		<p>
			By default, all Terra Draw modes will be added to the control. However, you might want to
			remove some drawing modes from your app.
		</p>
		<p>
			The following example is to add <b>Point</b> and <b>Select</b> control to the plugin.
			Furthremore, this example code bring <b>Select</b> mode first while it is shown in the last as
			default.
		</p>

		<CodeBlock
			language="js"
			lineNumbers
			code={`
const drawControl = new MaplibreTerradrawControl({
	modes: [
		'select',
		'point'
	]
});
map.addControl(drawControl, 'top-left');
		`}
		/>

		<h4 class="h4 pt-6">Customise drawing options</h4>

		<p>
			This plugin tries to optimise the better drawing options for each Terra Draw mode. However,
			preconfigured drawing options might not be desired for your app.
		</p>
		<p>
			For example, if you only want to use polygon control,but you don't want users to drag a
			polygon or adding/deleting a node on an edge of a polygon, the following setting can be done.
		</p>

		<CodeBlock
			language="js"
			lineNumbers
			code={`
const drawControl = new MaplibreTerradrawControl({
	// only show polgyon, line and select mode.
	modes: ['polygon', 'linestring', 'select'],
	modeOptions: {
		select: new TerraDrawSelectMode({
			flags: {
				// only update polygon settings for select mode.
				// default settings will be used for other geometry types
				// in this case, line uses default options of the plugin.
				polygon: {
					feature: {
						draggable: false, // users cannot drag to move polygon
						rotateable: true,
						scaleable: true,
						coordinates: {
							midpoints: false, // users cannot add a node on the middle of edge.
							draggable: true,
							deletable: false // users cannot delete a node.
						}
					}
				}
			}
		})
	}
});
map.addControl(drawControl, 'top-left');
		`}
		/>
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
