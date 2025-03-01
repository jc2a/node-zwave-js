// @ts-check

/// <reference path="types.d.ts" />

const { ConfigManager } = require("@zwave-js/config");
const JSONC = require("comment-json");
const fs = require("node:fs/promises");
const { formatWithDprint } = require("./utils.cjs");

/**
 * @param {{github: Github, context: Context}} param
 */
async function main(param) {
	// const { github, context } = param;

	const cm = new ConfigManager();
	await cm.loadDeviceIndex();

	const idParts = process.env.id.split(":");
	const manufacturerId = parseInt(idParts[0], 16);
	const productType = parseInt(idParts[1], 16);
	const productId = parseInt(idParts[2], 16);
	const firmwareVersion = idParts[3];

	// Parse the given flags while preserving comments
	// We need to format the flags because someone might have forgotten quotes
	const flags = JSONC.parse(
		formatWithDprint("file.json", `{${process.env.flag}}`),
	);

	const device = await cm.lookupDevice(
		manufacturerId,
		productType,
		productId,
		firmwareVersion,
	);
	const filename = device && device.filename;
	if (filename) {
		// Read file as JSONC
		let content = await fs.readFile(filename, "utf8");
		const json = JSONC.parse(content);

		// Add the flags
		if (!json.compat) json.compat = {};
		JSONC.assign(json.compat, flags);

		// And save it again
		content = JSONC.stringify(json, undefined, "\t");
		content = formatWithDprint(filename, content);
		await fs.writeFile(filename, content, "utf8");
	}
}
module.exports = main;
