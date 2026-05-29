// Template loader: reads YAML template + JSON manifest, merges config

import { readFileSync, existsSync } from "fs";
import { parse as parseYaml } from "yaml";
import { resolve, dirname, join, basename } from "path";

import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const ASSETS_DIR = resolve(dirname(__filename), "..", "assets");

export function loadTemplate(templateName) {
  // Path traversal protection: sanitize template name
  const safeName = basename(templateName).replace(/[^a-zA-Z0-9_-]/g, '');
  if (!safeName) {
    throw new Error(`Invalid template name: ${templateName}`);
  }
  const ymlPath = join(ASSETS_DIR, `${safeName}.yaml`);
  if (!existsSync(ymlPath)) {
    throw new Error(`Template not found: ${ymlPath}`);
  }
  const raw = readFileSync(ymlPath, "utf-8");
  return parseYaml(raw);
}

export function loadManifest(manifestPath) {
  // Path traversal protection for manifest
  const resolvedPath = resolve(manifestPath);
  const workspaceRoot = resolve(dirname(__filename), "..");
  if (!resolvedPath.startsWith(workspaceRoot)) {
    throw new Error(`Manifest path outside workspace: ${manifestPath}`);
  }
  if (!existsSync(resolvedPath)) {
    throw new Error(`Manifest not found: ${resolvedPath}`);
  }
  const raw = readFileSync(resolvedPath, "utf-8");
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
