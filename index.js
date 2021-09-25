import { Buffer } from "buffer";
import { promises as fs } from "fs";
import { App } from "@tinyhttp/app";
import { logger } from "@tinyhttp/logger";
import * as Astro from "@astrojs/compiler";
import { renderToString, createContext } from "./lib/render-to-string.js";

const app = new App();
const internalURL = new URL("./node_modules/astro/dist/internal/index.js", import.meta.url).toString();

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
			internalURL,
		};

		const astroResult = await Astro.transform(astroFile.toString(), astroOptions);

		const buffer = Buffer.from(astroResult.code);
		const buffer64 = `data:text/javascript;base64,${buffer.toString("base64")}`;
		const { default: Component } = await import(buffer64);
		const html = await renderToString(createContext(), Component, {}, {});

		res.status(200).send(html);
	});

const PORT = 3000;
app.listen(PORT, () => console.log(`Listening on http://localhost:${PORT}`));
