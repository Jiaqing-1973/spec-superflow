// scripts/guard/checks/artifacts-exist.mjs — check that all planning artifacts are present and non-empty
import fs from 'node:fs';
import path from 'node:path';

/**
 * Check that all 4 planning artifacts exist and are non-empty,
 * and that the specs/ directory has at least one spec file.
 */
export function checkArtifactsExist(changeDir) {
  const failures = [];
  const required = ['proposal.md', 'design.md', 'tasks.md'];

  for (const file of required) {
    const filePath = path.join(changeDir, file);
    if (!fs.existsSync(filePath)) {
      failures.push(`${file}: missing`);
    } else if (fs.readFileSync(filePath, 'utf-8').trim().length === 0) {
      failures.push(`${file}: empty`);
    }
  }

  const specsDir = path.join(changeDir, 'specs');
  if (!fs.existsSync(specsDir) || fs.readdirSync(specsDir).length === 0) {
    failures.push('specs/: missing or empty');
  }

  return { pass: failures.length === 0, failures };
}