// Template loader: reads YAML template + JSON manifest, merges config

import { readFileSync, existsSync } from "fs";
import { parse as parseYaml } from "yaml";
import { resolve, dirname, join } from "path";

import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const ASSETS_DIR = resolve(dirname(__filename), "..", "assets");

export function loadTemplate(templateName) {
  const ymlPath = join(ASSETS_DIR, `${templateName}.yaml`);
  if (!existsSync(ymlPath)) {
    throw new Error(`Template not found: ${ymlPath}`);
  }
  const raw = readFileSync(ymlPath, "utf-8");
  return parseYaml(raw);
}

export function loadManifest(manifestPath) {
  if (!existsSync(manifestPath)) {
    throw new Error(`Manifest not found: ${manifestPath}`);
  }
  const raw = readFileSync(manifestPath, "utf-8");
  return JSON.parse(raw);
}

export function mergeConfig(template, manifest) {
  return {
    ...template,
    document: {
      ...template.document,
      title: manifest.title || template.document?.title,
      subtitle: manifest.subtitle || template.document?.subtitle,
      version: manifest.version,
      date: manifest.date,
    },
    chapters: manifest.chapters || template.chapters || [],
  };
}