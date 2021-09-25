import { promises as fs } from "fs";

import * as Astro from "@astrojs/compiler";
import { App } from "@tinyhttp/app";
import { logger } from "@tinyhttp/logger";

import { renderToString, createContext } from "./lib/render-to-string.js";

const app = new App();

app
	.use(logger())
	.get("/", (_, res) => void res.send("<h1>Hello World</h1>"))
	.get("/astro/:page/", (req, res) => {
		const { page } = req.params;
		const astroFilePath = new URL(`./views/${page}.astro`, import.meta.url);
		const astroFile = await fs.readFile(astroFilePath);
		const astroString = astroFile.toString();

		res.status(200).send(astroString);
	});

app.listen(3000, () => console.log("Started on http://localhost:3000"));
