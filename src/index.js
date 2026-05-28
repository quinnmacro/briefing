// CLI entry point: node src/index.js --template <name> --manifest <path> --output <path>

import { resolve } from "path";
import { loadTemplate, loadManifest, mergeConfig } from "./template-loader.js";
import { renderAll } from "./renderer.js";
import { assembleDocument, packToFile } from "./assembler.js";

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    if (argv[i].startsWith("--")) {
      const key = argv[i].replace("--", "");
      args[key] = argv[i + 1];
      i++;
    }
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv);

  const templateName = args.template || "gaofang-reference";
  const manifestPath = args.manifest || "output/manifest.json";
  const outputPath = args.output || "output/briefing.docx";

  console.log(`Loading template: ${templateName}`);
  const template = loadTemplate(templateName);

  console.log(`Loading manifest: ${manifestPath}`);
  const manifest = loadManifest(resolve(manifestPath));

  console.log("Merging config...");
  const config = mergeConfig(template, manifest);

  console.log("Rendering content...");
  const contentElements = renderAll(manifest, config);

  console.log("Assembling document...");
  const doc = assembleDocument(config, contentElements);

  console.log(`Writing output: ${outputPath}`);
  await packToFile(doc, resolve(outputPath));

  console.log(`OK: ${resolve(outputPath)}`);
}

main().catch(err => {
  console.error("Error:", err.message);
  process.exit(1);
});