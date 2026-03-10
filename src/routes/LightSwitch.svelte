<script lang="ts">
	import IconMoon from '@lucide/svelte/icons/moon';
	import IconSun from '@lucide/svelte/icons/sun';

	let isDark = $state(false);

	const localStorageKey = 'light-dark-mode';

	$effect(() => {
		const prefersDark = localStorage.getItem(localStorageKey) === 'dark';
		isDark = prefersDark === true;
	});

	const onCheckedChange = (event: { isDark: boolean }) => {
		const mode = event.isDark ? 'dark' : 'light';
		document.documentElement.setAttribute('data-mode', mode);
		localStorage.setItem(localStorageKey, mode);
		isDark = event.isDark;
	};
</script>

<button
	type="button"
	class="btn hover:preset-tonal px-1 md:px-2"
	onclick={() => {
		isDark = !isDark;
		onCheckedChange({ isDark });
	}}
>
	<span>
		{#if isDark}
			<IconMoon />
		{:else}
			<IconSun />
		{/if}
	</span>
</button>
