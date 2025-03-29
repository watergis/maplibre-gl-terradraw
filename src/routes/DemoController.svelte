<script lang="ts">
	import { Accordion, Segment, TagsInput } from '@skeletonlabs/skeleton-svelte';
	import { AvailableModes, type TerradrawMode } from '../lib';

	interface Props {
		controlType: 'default' | 'measure';
		isOpen: 'open' | 'close' | undefined;
		selectedModes: TerradrawMode[];
		onchange: () => void;
	}

	let {
		controlType = $bindable('default'),
		isOpen = $bindable('open'),
		selectedModes = $bindable(JSON.parse(JSON.stringify(AvailableModes))),
		onchange = () => {}
	}: Props = $props();

	let accordionValue = $state(['control-type']);
</script>

<Accordion value={accordionValue} onValueChange={(e) => (accordionValue = e.value)} collapsible>
	<Accordion.Item value="control-type">
		{#snippet control()}
			<p class="font-bold uppercase">Control type</p>
		{/snippet}
		{#snippet panel()}
			<p class="pb-4">
				Default control is MaplibreTerradrawControl. If you want to use measure control, enable to
				choose MaplibreMeasureControl.
			</p>

			<Segment
				name="control-type"
				value={controlType}
				onValueChange={(e) => {
					controlType = e.value as 'default' | 'measure';
					onchange();
				}}
			>
				<Segment.Item value="default">Default Control</Segment.Item>
				<Segment.Item value="measure">Measure Control</Segment.Item>
			</Segment>
		{/snippet}
	</Accordion.Item>
</Accordion>

<Accordion value={accordionValue} onValueChange={(e) => (accordionValue = e.value)} collapsible>
	<Accordion.Item value="mode-selection">
		{#snippet control()}
			<p class="font-bold uppercase">Mode selection</p>
		{/snippet}
		{#snippet panel()}
			<p class="pb-4">
				Your chosen options are automatically applied at the demo and the below usage code.
			</p>
			<p class="pb-4">
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
					onValueChange={(e) => {
						selectedModes = e.value as TerradrawMode[];
						onchange();
					}}
					validate={(details) => AvailableModes.includes(details.inputValue as TerradrawMode)}
				/>
			{/key}
		{/snippet}
	</Accordion.Item>
</Accordion>

<Accordion value={accordionValue} onValueChange={(e) => (accordionValue = e.value)} collapsible>
	<Accordion.Item value="open-as-default">
		{#snippet control()}
			<p class="font-bold uppercase">Open as default</p>
		{/snippet}
		{#snippet panel()}
			<p class="pb-4">
				if you want the drawing tool to be always expanded, simplely remove `render` mode from
				constuctor options, then set `true` to `open` property.
			</p>
			<Segment
				name="is-open"
				value={isOpen}
				onValueChange={(e) => {
					isOpen = e.value as 'open' | 'close';
					onchange();
				}}
			>
				<Segment.Item value="open">Open as default</Segment.Item>
				<Segment.Item value="close">Close as default</Segment.Item>
			</Segment>
		{/snippet}
	</Accordion.Item>
</Accordion>
