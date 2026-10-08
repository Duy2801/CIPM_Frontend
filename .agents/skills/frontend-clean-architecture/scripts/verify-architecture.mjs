#!/usr/bin/env node

/**
 * verify-architecture.mjs
 * Zero-dependency architectural quality gate validator for Frontend Clean Architecture.
 *
 * Usage:
 *   node .agents/skills/frontend-clean-architecture/scripts/verify-architecture.mjs [targetDir] [--strict]
 */

import fs from "fs";
import path from "path";

const targetDir = process.argv[2] && !process.argv[2].startsWith("--")
  ? path.resolve(process.argv[2])
  : path.resolve(process.cwd(), "src");

const isStrict = process.argv.includes("--strict");

if (!fs.existsSync(targetDir)) {
  console.log(`[verify-architecture] Target directory does not exist: ${targetDir}`);
  process.exit(0);
}

const PHYSICAL_COLORS = [
  "slate", "gray", "zinc", "neutral", "stone",
  "red", "orange", "amber", "yellow", "lime", "green",
  "emerald", "teal", "cyan", "sky", "blue", "indigo",
  "violet", "purple", "fuchsia", "pink", "rose"
];

// Regex for physical color classes like text-red-500, bg-blue-600, border-emerald-400
const COLOR_CLASS_REGEX = new RegExp(
  `\\b(bg|text|border|ring|fill|stroke|shadow)-(${PHYSICAL_COLORS.join("|")})-(50|100|200|300|400|500|600|700|800|900|950)(\\/\\d+)?\\b`,
  "g"
);

const CROSS_FEATURE_IMPORT_REGEX = /from\s+['"](@\/features\/([^/'"]+)\/(?!index|api|contracts|public)[^'"]+)['"]/g;

let totalFilesChecked = 0;
const issues = {
  useClientInPageOrLayout: [],
  crossFeaturePrivateImports: [],
  hardcodedPhysicalColors: []
};

function walkDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === "node_modules" || entry.name === ".next" || entry.name === "dist") {
      continue;
    }
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkDir(fullPath);
    } else if (/\.(tsx|jsx|ts|js)$/.test(entry.name)) {
      checkFile(fullPath);
    }
  }
}

function checkFile(filePath) {
  totalFilesChecked++;
  const relPath = path.relative(process.cwd(), filePath).replace(/\\/g, "/");
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n");

  // 1. Check root "use client" on App Router page.tsx / layout.tsx
  const isAppRoute = /\/app\/(.+)\/(page|layout)\.(tsx|jsx)$/.test(relPath);
  if (isAppRoute) {
    const hasUseClient = lines.slice(0, 10).some(line => line.includes('"use client"') || line.includes("'use client'"));
    if (hasUseClient) {
      issues.useClientInPageOrLayout.push({
        file: relPath,
        message: 'Avoid placing "use client" at page/layout root. Push client interactivity to leaf components.'
      });
    }
  }

  // 2. Check cross-feature private imports
  const currentFeatureMatch = relPath.match(/\/features\/([^/]+)\//);
  const currentFeature = currentFeatureMatch ? currentFeatureMatch[1] : null;

  let match;
  while ((match = CROSS_FEATURE_IMPORT_REGEX.exec(content)) !== null) {
    const importedFeature = match[2];
    if (currentFeature && importedFeature !== currentFeature) {
      issues.crossFeaturePrivateImports.push({
        file: relPath,
        importPath: match[1],
        message: `Cross-feature private import: "${currentFeature}" imports private internal from "${importedFeature}". Use public barrel or contract.`
      });
    }
  }

  // 3. Check hardcoded physical colors in feature files (excluding config, ui primitives, or legacy css)
  if (relPath.includes("/features/") && (relPath.endsWith(".tsx") || relPath.endsWith(".jsx"))) {
    lines.forEach((line, index) => {
      // Skip commented lines
      if (line.trim().startsWith("//") || line.trim().startsWith("/*")) return;
      const matches = line.match(COLOR_CLASS_REGEX);
      if (matches) {
        issues.hardcodedPhysicalColors.push({
          file: relPath,
          line: index + 1,
          matches: Array.from(new Set(matches))
        });
      }
    });
  }
}

console.log(`\n🔍 [Frontend Clean Architecture Verification]`);
console.log(`   Scanning: ${targetDir}`);

walkDir(targetDir);

console.log(`   Checked: ${totalFilesChecked} files.\n`);

let hasErrors = false;

// 1. App Router RSC boundary
if (issues.useClientInPageOrLayout.length > 0) {
  console.log(`⚠️  [RSC Boundary Warning] Page/Layout with "use client":`);
  issues.useClientInPageOrLayout.forEach(item => {
    console.log(`   - ${item.file}: ${item.message}`);
  });
  console.log("");
}

// 2. Cross-feature private imports
if (issues.crossFeaturePrivateImports.length > 0) {
  hasErrors = true;
  console.log(`❌ [Architecture Boundary Violation] Cross-feature private imports:`);
  issues.crossFeaturePrivateImports.forEach(item => {
    console.log(`   - ${item.file} -> ${item.importPath}`);
  });
  console.log("");
}

// 3. Hardcoded physical colors
if (issues.hardcodedPhysicalColors.length > 0) {
  console.log(`ℹ️  [Design Token Recommendation] Hardcoded physical Tailwind colors in features:`);
  const displayed = issues.hardcodedPhysicalColors.slice(0, 10);
  displayed.forEach(item => {
    console.log(`   - ${item.file}:${item.line} -> [${item.matches.join(", ")}] (Prefer semantic tokens: brand, primary, destructive, muted)`);
  });
  if (issues.hardcodedPhysicalColors.length > 10) {
    console.log(`   ... and ${issues.hardcodedPhysicalColors.length - 10} more occurrences.`);
  }
  console.log("");
}

if (hasErrors && isStrict) {
  console.log(`❌ Architecture verification failed with violations in strict mode.\n`);
  process.exit(1);
} else {
  console.log(`✅ Architecture verification completed successfully.\n`);
  process.exit(0);
}
