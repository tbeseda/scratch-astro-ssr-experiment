import { Buffer } from "buffer";
import { promises as fs } from "fs";
import { App } from "@tinyhttp/app";
import { logger } from "@tinyhttp/logger";
import * as Astro from "@astrojs/compiler";
import { renderToString, createContext } from "./lib/render-to-string.js";

const app = new App();
const internalURL = new URL("./node_modules/astro/dist/internal/index.js", import.meta.url).toString();
const indexHtml = `
<h1>Try Astro on the Server</h1>
<p>This hack doesn't really work, but it's fast!</p>
<ul>
	<li><a href="/astro/hello">/astro/hello</a></li>
	<li><a href="/astro/import">/astro/import</a> broken</li>
	<li><a href="/astro/fetch">/astro/fetch</a> broken</li>
</ul>
`;

app
	.use(logger())
	.get("/", (_, res) => void res.send(indexHtml))
	.get("/astro/:view/", async (req, res) => {
		const { view } = req.params;
		const viewUrl = new URL(`./views/${view}.astro`, import.meta.url);
		const viewFile = await fs.readFile(viewUrl.pathname);
		const astroOptions = {
			sourcefile: viewUrl.href,
			sourcemap: false,
			internalURL,
		};

		const astroResult = await Astro.transform(viewFile.toString(), astroOptions);

		const buffer = Buffer.from(astroResult.code);
		const buffer64 = `data:text/javascript;base64,${buffer.toString("base64")}`;
		const { default: Component } = await import(buffer64);
		const html = await renderToString(createContext(), Component, {}, {});

		res.status(200).send(html);
	});

const PORT = 3000;
app.listen(PORT, () => console.log(`Listening on http://localhost:${PORT}`));
