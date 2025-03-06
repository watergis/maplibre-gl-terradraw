<script lang="ts">
	import type { PageData } from './$types';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();
</script>

<h3 class="h3 py-5">Examples</h3>

<div class="flex flex-wrap gap-4">
	{#each data.examples as custom (custom.title)}
		<a class="card card-hover sm:w-auto md:max-w-48 lg:max-w-64 xl:max-w-80" href={custom.href}>
			<header class="card-header font-bold min-h-16">{custom.title}</header>
			<section class="card-image p-4">
				<img class="preview-image" src={custom.image} alt={custom.title} />
			</section>
			<footer class="card-footer"><p class="description">{custom.description}</p></footer>
		</a>
	{/each}
</div>

<style lang="postcss">
	.preview-image {
		max-height: 130px;
		margin: 0 auto;
	}
	.description {
		display: -webkit-box;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 4;
		overflow: hidden;
	}
</style>
