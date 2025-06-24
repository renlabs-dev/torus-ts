# TODO: Implement Changeset Workflow for Package Publishing

This document outlines the tasks needed to properly implement changesets for managing versions and publishing `@torus-network/sdk` and `@torus-network/torus-utils` packages.

## Current State

- ✅ Changesets is installed (`@changesets/cli@^2.29.5`)
- ✅ Basic configuration exists in `.changeset/config.json`
- ✅ Packages are linked together in changeset config
- ✅ Just commands exist: `changeset-add` and `changeset-version`
- ❌ No automated release workflow
- ❌ Manual publish process without version management

## Tasks

### 1. Configuration Updates

- [ ] Update `.changeset/config.json` to set `"access": "public"` (currently "restricted")
- [ ] Verify `"baseBranch": "dev"` is correct for your workflow
- [ ] Consider if `"updateInternalDependencies": "patch"` is the right strategy

### 2. Update Publishing Commands

- [ ] Replace current `just publish` command with proper changeset workflow:

  ```sh
  publish:
    pnpm run -F "@torus-network/sdk" -F "@torus-network/torus-utils" build
    pnpm changeset publish
  ```

- [ ] Add command for creating release PR:

  ```sh
  release-pr:
    pnpm changeset version
    git add .
    git commit -m "chore: version packages"
  ```

### 3. GitHub Actions Workflow

- [ ] Create `.github/workflows/release.yml` with:
  - Trigger on push to `dev` branch
  - Check for changesets
  - Create automated PR with version bumps
  - On merge, publish to npm
- [ ] Add NPM_TOKEN secret to GitHub repository settings
- [ ] Consider using [changesets/action](https://github.com/changesets/action)

### 4. Package Configuration Verification

- [ ] Ensure both packages have proper `files` field in package.json
- [ ] Verify `exports` field points to built files (dist/)
- [ ] Confirm `publishConfig.access: "public"` is set
- [ ] Add `repository` field to package.json files

### 5. Documentation

- [ ] Create `RELEASING.md` with step-by-step release process
- [ ] Document changeset types (patch/minor/major) and when to use each
- [ ] Add contributing guidelines about creating changesets
- [ ] Update main README with badge for npm versions

### 6. Development Workflow

- [ ] Train team on changeset workflow:
  1. Make changes
  2. Run `just changeset-add` before creating PR
  3. Choose version bump type
  4. Write meaningful change description
  5. Commit changeset with PR
- [ ] Consider pre-commit hook to check for changesets

### 7. Testing the Workflow

- [ ] Do a dry run with a patch release
- [ ] Test that inter-dependencies update correctly
- [ ] Verify git tags are created properly
- [ ] Ensure CHANGELOGs are formatted well
- [ ] Test publishing to npm registry

### 8. Advanced Considerations

- [ ] Set up prerelease workflow for testing major changes
- [ ] Configure snapshot releases for testing
- [ ] Consider automated dependency updates
- [ ] Set up release notifications (Discord/Slack)

## Example Changeset Workflow

```sh
# During development
just changeset-add
# Select packages, version bump, write summary

# When ready to release
just changeset-version
# Review changes, commit

# Publish
just publish
# Or via CI/CD after PR merge
```

## Resources

- [Changesets Documentation](https://github.com/changesets/changesets)
- [Changesets GitHub Action](https://github.com/changesets/action)
- [Semantic Versioning](https://semver.org/)

## Notes

- The SDK and utils packages are linked, so they'll always publish together
- Current versions: both at 0.1.7
- Remember to build before publishing
- Consider the impact on downstream consumers when making breaking changes
