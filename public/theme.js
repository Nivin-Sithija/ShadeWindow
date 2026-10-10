(() => {
	const key = 'shadewindow-theme';
	let theme = 'light';
	try {
		if (localStorage.getItem(key) === 'dark') theme = 'dark';
	} catch {
		// The toggle still works when browser storage is unavailable.
	}

	function apply(next) {
		theme = next;
		document.documentElement.dataset.theme = theme;
		document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#142432' : '#edf8ff');
		const button = document.getElementById('theme-toggle');
		if (button) {
			button.textContent = theme === 'dark' ? '☀ Light mode' : '☾ Dark mode';
			button.setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`);
			button.setAttribute('aria-pressed', String(theme === 'dark'));
		}
	}

	apply(theme);
	document.addEventListener('DOMContentLoaded', () => {
		apply(theme);
		document.getElementById('theme-toggle').addEventListener('click', () => {
			apply(theme === 'dark' ? 'light' : 'dark');
			try { localStorage.setItem(key, theme); } catch {}
		});
	});
	window.addEventListener('storage', event => {
		if (event.key === key) apply(event.newValue === 'dark' ? 'dark' : 'light');
	});
})();
