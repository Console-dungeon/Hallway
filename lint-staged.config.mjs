import path from "node:path";

/*
 * Runs on `git commit` (via .husky/pre-commit) for staged files only.
 *
 * ESLint runs once from the repo root with `v10_config_lookup_from_file`: each file is linted
 * with the eslint.config.js closest to it, so web gets Next rules and api gets Node rules.
 * This flag becomes the default behavior in ESLint 10 – drop it after upgrading.
 */

const root = import.meta.dirname;
const codeFile = /\.(c|m)?(j|t)sx?$/;
// Only apps/* and packages/* have ESLint configs; root files get Prettier only
const hasEslintConfig = (file) =>
  /^(apps|packages)\//.test(path.relative(root, file));
const quote = (files) => files.map((file) => JSON.stringify(file)).join(" ");

export default (stagedFiles) => {
  const lintable = stagedFiles.filter(
    (file) => codeFile.test(file) && hasEslintConfig(file),
  );

  // Commands in the array run in sequence: ESLint fixes first, then Prettier formats
  return [
    ...(lintable.length > 0
      ? [
          `eslint --flag v10_config_lookup_from_file --fix --max-warnings=0 --no-warn-ignored ${quote(lintable)}`,
        ]
      : []),
    `prettier --write --ignore-unknown ${quote(stagedFiles)}`,
  ];
};
