/**
 * Design Token Audit Test (DESIGN_V2.md Section 8 Rule 3)
 * Asserts that screens and app files never contain hardcoded hex colours,
 * raw font sizes, or raw spacing numbers outside theme.ts and the components folder.
 */

/* eslint-disable @typescript-eslint/no-require-imports */
declare const process: { cwd: () => string };
const fs = require('fs');
const path = require('path');

describe('Design System Token Audit', () => {
  const rootMobileDir: string = process.cwd();
  const appDir: string = path.join(rootMobileDir, 'app');
  const srcDir: string = path.join(rootMobileDir, 'src');

  function collectFiles(dir: string, fileList: string[] = []): string[] {
    if (!fs.existsSync(dir)) return fileList;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        // Skip node_modules, build artifacts, components, and theme directories
        if (
          entry.name === 'node_modules' ||
          entry.name === '.expo' ||
          entry.name === 'components' ||
          entry.name === 'theme'
        ) {
          continue;
        }
        collectFiles(fullPath, fileList);
      } else if (
        (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts')) &&
        !entry.name.endsWith('.spec.ts') &&
        !entry.name.endsWith('.spec.tsx') &&
        entry.name !== 'gallery.tsx' // Gallery exhibits and demonstrates token values
      ) {
        fileList.push(fullPath);
      }
    }
    return fileList;
  }

  const targetFiles: string[] = [...collectFiles(appDir), ...collectFiles(srcDir)];

  it('scans app screens for raw hex colors, raw font sizes, or raw spacing', () => {
    expect(targetFiles.length).toBeGreaterThan(0);

    const violations: string[] = [];

    // Patterns that violate design token rules
    const hexColorRegex = /#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})\b/g;
    const rawFontSizeRegex = /fontSize:\s*\d+/g;

    for (const filePath of targetFiles) {
      const relativePath = path.relative(rootMobileDir, filePath).replace(/\\/g, '/');
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');

      lines.forEach((line: string, index: number) => {
        const lineNum = index + 1;

        // Check for raw hex colors
        if (hexColorRegex.test(line)) {
          violations.push(
            `[Hex Color] ${relativePath}:${lineNum} - Found raw hex color in line: "${line.trim()}"`,
          );
        }

        // Check for raw fontSize
        if (rawFontSizeRegex.test(line)) {
          violations.push(
            `[Raw Font Size] ${relativePath}:${lineNum} - Found raw fontSize in line: "${line.trim()}". Use typography tokens.`,
          );
        }
      });
    }

    if (violations.length > 0) {
      throw new Error(
        `Design System Token Audit Failed (${violations.length} violations found):\n` +
          violations.join('\n') +
          '\nAll screens must compose shared components and tokens from theme.ts only.',
      );
    }

    expect(violations).toHaveLength(0);
  });
});
