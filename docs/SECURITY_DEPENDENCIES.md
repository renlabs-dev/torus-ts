# Dependency Security Guide

This document explains how to use the secure dependency installation system for the Torus project.

## Overview

The project uses Snyk to check for vulnerabilities in dependencies before installation, protecting against supply chain attacks and malicious packages.

## Initial Setup

### 1. Install Snyk CLI

```sh
npm install -g snyk
```

### 2. Authenticate with Snyk (once)

```sh
just snyk-auth
```

This will open your browser for authentication. You can create a free Snyk account.

## Available Commands

### Check if Snyk is installed

```sh
just snyk-check
```

### Check project dependencies for vulnerabilities

```sh
# Full scan of all dependencies - checks ALL severity levels (LOW to CRITICAL)
just snyk-scan

# Quick scan - checks HIGH/CRITICAL vulnerabilities only
just snyk-quick
```

### Test a package before installing

```sh
just snyk-test react@18.2.0
just snyk-test lodash
```

### Add a dependency with security checks

```sh
# Add regular dependency
just add react@18.2.0

# Add development dependency
just add vitest --dev

# With pnpm flags
just add typescript -D -w
```

**What happens:**
1. ✅ Checks for vulnerabilities with Snyk
2. ✅ Only installs if there are no HIGH or CRITICAL vulnerabilities
3. ✅ Uses `--ignore-scripts` to prevent malicious script execution
4. ❌ Aborts installation if vulnerabilities are found

### Add multiple packages at once

```sh
just add-multiple "react react-dom @types/react" --dev
```

## Secure Installation of Existing Dependencies

The `just install` command is already configured for security:

```sh
just install
```

- Uses `--ignore-scripts`: doesn't execute installation scripts (preinstall, postinstall)
- Uses `--frozen-lockfile`: doesn't update the lockfile

## Severity Levels

Snyk categorizes vulnerabilities into four levels:
- **LOW**: Minor vulnerabilities
- **MEDIUM**: Moderate vulnerabilities
- **HIGH**: High severity vulnerabilities
- **CRITICAL**: Critical severity vulnerabilities

**Installation behavior:**
- `just add` blocks packages with **HIGH** or **CRITICAL** vulnerabilities
- **MEDIUM** and **LOW** vulnerabilities generate warnings but don't block installation

**Scanning behavior:**
- `just snyk-scan` reports **ALL** levels (LOW to CRITICAL)
- `just snyk-quick` reports only **HIGH** and **CRITICAL**

## Usage Examples

### Add new library

```sh
# Check first
just snyk-test zustand

# If it passes, add it
just add zustand
```

### Add development library

```sh
just add eslint-plugin-react --dev
```

### Test specific version

```sh
just snyk-test axios@1.6.0
just add axios@1.6.0
```

## Troubleshooting

### Package blocked by vulnerability

If a package is blocked:

1. View detailed report:
   ```sh
   snyk test <package>
   ```

2. Options:
   - Use a newer version that fixes the vulnerability
   - Find a more secure alternative
   - If CRITICAL, **DO NOT INSTALL**

### Bypass (not recommended)

If you really need to install without verification:

```sh
pnpm add <package> --ignore-scripts
```

**⚠️ Only use if you have absolute certainty about the package's security!**

## Best Practices

1. **Always use `just add`** instead of `pnpm add` directly
2. **Never run scripts** from unknown packages (`--ignore-scripts`)
3. **Check versions**: prefer fixed versions over wide ranges
4. **Review dependencies**: use `just snyk-test` before updating
5. **Monitor regularly**: run `snyk monitor` for continuous monitoring

## Recent Supply Chain Attacks

The system protects against:
- **Malicious packages**: malicious code in the package
- **Typosquatting**: packages with names similar to popular ones
- **Dependency confusion**: packages with same name in different registries
- **Postinstall scripts**: scripts that execute on installation
- **Known vulnerabilities**: cataloged CVEs

## CI/CD Integration

### GitHub Actions

The project includes a security workflow (`.github/workflows/security-check.yml`) that runs automatically on PRs:

**What it checks:**
- ✅ Vulnerabilities with Snyk
- ✅ Dependency audit with pnpm audit
- ✅ Lockfile integrity
- ✅ Typosquatting attempts
- ✅ Malicious scripts (via --ignore-scripts)

**Required configuration:**
1. Add `SNYK_TOKEN` to GitHub secrets
   - Get it at: https://app.snyk.io/account
   - Go to Settings → Secrets → Actions
   - Add: `SNYK_TOKEN`

### Run locally

```sh
# Check all vulnerabilities
pnpm audit --prod

# Full scan with Snyk
snyk test --all-projects

# Monitor project continuously
snyk monitor
```

## Safe Build Scripts

If you need to run scripts from a specific dependency:

```sh
# Run scripts only from a specific package
pnpm rebuild <package-name>

# Example: rebuild puppeteer (needs to download Chromium)
pnpm rebuild puppeteer
```

**⚠️ Only do this if:**
- You trust the package 100%
- You've verified the scripts' code
- It's absolutely necessary

## Additional Resources

- [Snyk Documentation](https://docs.snyk.io/)
- [npm Security Best Practices](https://docs.npmjs.com/packages-and-modules/securing-your-code)
- [OWASP Dependency Check](https://owasp.org/www-project-dependency-check/)
- [Socket.dev - Supply Chain Security](https://socket.dev/)

## Support

For questions about dependency security, consult the project's security team.
