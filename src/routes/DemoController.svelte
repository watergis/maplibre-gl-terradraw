<script lang="ts">
	import { AvailableModes, type AreaUnit, type DistanceUnit, type TerradrawMode } from '$lib';
	import IconPlus from '@lucide/svelte/icons/plus';
	import IconX from '@lucide/svelte/icons/x';
	import { Accordion, Segment, Slider, TagsInput } from '@skeletonlabs/skeleton-svelte';
	import { untrack } from 'svelte';
	import CodeBlock from './CodeBlock.svelte';

	interface Props {
		controlType: 'default' | 'measure';
		isOpen: 'open' | 'close' | undefined;
		selectedModes: TerradrawMode[];
		selectedFeature: string;
		distanceUnit: DistanceUnit;
		distancePrecision: number;
		areaUnit: AreaUnit;
		areaPrecision: number;
		computeElevation: 'enabled' | 'disabled';
		onchange: () => void;
		onMeasureChange: (
			type:
				| 'distanceUnit'
				| 'distancePrecision'
				| 'areaUnit'
				| 'areaPrecision'
				| 'computeElevation',
			value: string | number | number[]
		) => void;
	}

	let {
		controlType = $bindable('default'),
		isOpen = $bindable('open'),
		selectedModes = $bindable(JSON.parse(JSON.stringify(AvailableModes))),
		selectedFeature = $bindable(''),
		distanceUnit = $bindable('kilometers'),
		distancePrecision = $bindable(2),
		areaUnit = $bindable('metric'),
		areaPrecision = $bindable(2),
		computeElevation = $bindable('enabled'),
		onchange = () => {},
		onMeasureChange = () => {}
	}: Props = $props();

	let accordionValue = $state(['control-type']);
	let measureAccordionValue = $state([
		'distance-unit',
		'area-unit',
		'distance-precision',
		'area-precision',
		'compute-elevation'
	]);

	$effect(() => {
		if (selectedFeature) {
			untrack(() => {
				if (selectedFeature.length > 0) {
					accordionValue = [
						...accordionValue.filter((v) => v !== 'selected-feature'),
						'selected-feature'
					];
				} else {
					accordionValue = accordionValue.filter((v) => v !== 'selected-feature');
				}
			});
		}
	});
</script>

<Accordion value={accordionValue} onValueChange={(e) => (accordionValue = e.value)} multiple>
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

					if (controlType === 'default') {
						accordionValue = accordionValue.filter((v) => v !== 'measure-option');
					} else {
						accordionValue = [
							...accordionValue.filter((v) => v !== 'measure-option'),
							'measure-option'
						];
					}
				}}
			>
				<Segment.Item value="default">Default Control</Segment.Item>
				<Segment.Item value="measure">Measure Control</Segment.Item>
			</Segment>
		{/snippet}
	</Accordion.Item>

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
				editable={false}
			/>

			<nav class="flex flex-row mt-2 gap-2">
				<button
					type="button"
					class="btn preset-filled-primary-500"
					disabled={selectedModes.length === AvailableModes.length}
					onclick={() => {
						selectedModes = [
							...selectedModes,
							...AvailableModes.filter((m) => !selectedModes.includes(m))
						];
						onchange();
					}}
				>
					<IconPlus />
					<span>Add all</span>
				</button>
				<button
					type="button"
					class="btn preset-filled-error-500"
					disabled={selectedModes.length === 0}
					onclick={() => {
						selectedModes = [];
						onchange();
					}}
				>
					<IconX />
					<span>Delete all</span>
				</button>
			</nav>

			{#if selectedModes.length < AvailableModes.length}
				{@const selectSize = AvailableModes.filter((m) => !selectedModes.includes(m)).length}
				<select
					class="select rounded-container mt-2"
					size={selectSize === 1 ? selectSize + 1 : selectSize > 5 ? 5 : selectSize}
					onclick={(e) => {
						if (!(e.target && 'value' in e.target)) return;
						const selected = e.target.value as TerradrawMode;
						selectedModes.push(selected);
						onchange();
					}}
				>
					{#each AvailableModes.filter((m) => !selectedModes.includes(m)) as mode (mode)}
						<option value={mode}>{mode}</option>
					{/each}
				</select>
			{/if}
		{/snippet}
	</Accordion.Item>

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

	{#if selectedFeature.length > 0}
		<Accordion.Item value="selected-feature">
			{#snippet control()}
				<p class="font-bold uppercase">Selected feature</p>
			{/snippet}
			{#snippet panel()}
				<div class="p-2">
					<p class="text-black">
						For Polygon, use <b>ctrl+s</b> to resize the feature, and use <b>ctrl+r</b> to rotate the
						feature.
					</p>
				</div>
				<div class="code-block">
					<CodeBlock lang="js" code={selectedFeature} base="max-h-64 overflow-y-auto "></CodeBlock>
				</div>
			{/snippet}
		</Accordion.Item>
	{/if}

	{#if controlType === 'measure'}
		<Accordion.Item value="measure-option">
			{#snippet control()}
				<p class="font-bold uppercase">Measure control options</p>
			{/snippet}
			{#snippet panel()}
				<Accordion
					value={measureAccordionValue}
					onValueChange={(e) => (measureAccordionValue = e.value)}
					multiple
				>
					<Accordion.Item value="distance-unit">
						{#snippet control()}
							<p class="font-bold uppercase italic">Distance unit</p>
						{/snippet}
						{#snippet panel()}
							<Segment
								value={distanceUnit}
								onValueChange={(e) => {
									distanceUnit = e.value as DistanceUnit;
									onMeasureChange('distanceUnit', distanceUnit);
								}}
							>
								{#each ['kilometers', 'miles', 'degrees', 'radians'] as unit (unit)}
									<Segment.Item value={unit}>
										{#if unit === 'miles'}
											mi
										{:else if unit === 'degrees'}
											°
										{:else if unit === 'radians'}
											rad
										{:else}
											km
										{/if}
									</Segment.Item>
								{/each}
							</Segment>
						{/snippet}
					</Accordion.Item>
					<Accordion.Item value="area-unit">
						{#snippet control()}
							<p class="font-bold uppercase italic">Area unit</p>
						{/snippet}
						{#snippet panel()}
							<Segment
								value={areaUnit}
								onValueChange={(e) => {
									areaUnit = e.value as AreaUnit;
									onMeasureChange('areaUnit', areaUnit);
								}}
							>
								{#each ['metric', 'imperial'] as unit (unit)}
									<Segment.Item value={unit}>
										{unit}
									</Segment.Item>
								{/each}
							</Segment>
						{/snippet}
					</Accordion.Item>
					<Accordion.Item value="distance-precision">
						{#snippet control()}
							<p class="font-bold uppercase italic">Measure precision</p>
						{/snippet}
						{#snippet panel()}
							<div class="py-4">
								<div class="flex justify-between items-center mb-4">
									<div class="font-bold">Distance precision (Line)</div>
									<div class="text-xs">{distancePrecision}</div>
								</div>
								<Slider
									name="range-slider"
									value={[distancePrecision]}
									min={0}
									max={10}
									step={1}
									markers={[0, 5, 10]}
									onValueChange={(e) => {
										distancePrecision = e.value[0] as number;
										onMeasureChange('distancePrecision', distancePrecision);
									}}
								></Slider>
								<div class="flex justify-between items-center mt-8 mb-4">
									<div class="font-bold">Area precision (Polygon)</div>
									<div class="text-xs">{areaPrecision}</div>
								</div>
								<Slider
									name="range-slider"
									value={[areaPrecision]}
									min={0}
									max={10}
									step={1}
									markers={[0, 5, 10]}
									onValueChange={(e) => {
										areaPrecision = e.value[0] as number;
										onMeasureChange('areaPrecision', areaPrecision);
									}}
								></Slider>
							</div>
						{/snippet}
					</Accordion.Item>
					<Accordion.Item value="compute-elevation">
						{#snippet control()}
							<p class="font-bold uppercase italic">Compute elevation</p>
						{/snippet}
						{#snippet panel()}
							<Segment
								value={computeElevation}
								onValueChange={(e) => {
									computeElevation = e.value as 'enabled' | 'disabled';
									onMeasureChange('computeElevation', computeElevation);
								}}
							>
								{#each ['enabled', 'disabled'] as option (option)}
									<Segment.Item value={option}>
										{option}
									</Segment.Item>
								{/each}
							</Segment>
						{/snippet}
					</Accordion.Item>
				</Accordion>
			{/snippet}
		</Accordion.Item>
	{/if}
</Accordion>
