export async function renderAstroComponent(component) {
	let template = "";

	for await (const value of component) {
		if (value || value === 0) {
			template += value;
		}
	}

	return template;
}

export async function renderToString(result, componentFactory, props, children = {}) {
	const Component = await componentFactory(result, props, children);
	let template = await renderAstroComponent(Component);
	return template;
}

export async function renderPage(result, Component, props, children) {
	const template = await renderToString(result, Component, props, children);
	const styles = Array.from(result.styles).map((style) => `<style>${style}</style>`);
	const scripts = Array.from(result.scripts);
	return template.replace("</head>", styles.join("\n") + scripts.join("\n") + "</head>");
}

export const createContext = () => {
	return {
		styles: new Set(),
		scripts: new Set(),
		/** This function returns the `Astro` faux-global */
		createAstro(props) {
			// const site = location;
			const url = new URL("http://localhost:3000/");
			// const canonicalURL = getCanonicalURL(pathname, astroConfig.buildOptions.site || origin)
			return {
				isPage: true,
				site: url,
				request: { url, canonicalURL: url },
				props,
			};
		},
	};
};
