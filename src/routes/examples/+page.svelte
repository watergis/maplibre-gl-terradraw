<script lang="ts">
	import type { PageData } from './$types.js';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();
</script>

<h3 class="h3 py-5">Examples</h3>

<div class="flex flex-wrap gap-4">
	{#each data.examples as custom}
		<a class="card card-hover sm:w-auto md:max-w-48 lg:max-w-64 xl:max-w-80" href={custom.href}>
			<header class="card-header font-bold min-h-16">{custom.title}</header>
			<section class="card-image p-4">
				<img src={custom.image} alt={custom.title} />
			</section>
			<footer class="card-footer">{custom.description}</footer>
		</a>
	{/each}
</div>
