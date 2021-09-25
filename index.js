import { promises as fs } from "fs";
import * as Astro from "@astrojs/compiler";
import { App } from "@tinyhttp/app";
import { logger } from "@tinyhttp/logger";

import { renderToString, createContext } from "./lib/render-to-string.js";

const app = new App();

app
	.use(logger())
	.get("/", (_, res) => void res.send("<h1>Hello World</h1>"))
	.get("/astro/:page/", async (req, res) => {
		const { page } = req.params;
		const astroFileUrl = new URL(`./views/${page}.astro`, import.meta.url);
		const astroFile = await fs.readFile(astroFileUrl.pathname);
		const astroOptions = {
			sourcefile: astroFileUrl.href,
			sourcemap: false,
			internalURL: "astro/internal",
		};
		const pagePath = `./tmp/${page}-${Date.now()}-astro.js`;

		const astroResult = await Astro.transform(astroFile.toString(), astroOptions);

		await fs.writeFile(pagePath, astroResult.code);
		const { default: Component } = await import(pagePath);
		const html = await renderToString(createContext(), Component, {}, {});

		res.status(200).send(html);

		await fs.rm(pagePath);
	});

const PORT = 3000;
app.listen(PORT, () => console.log(`Listening on http://localhost:${PORT}`));
