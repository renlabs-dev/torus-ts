# 🔥 Torus Prediction Swarm Dashboard - Development Setup

This project uses **just** as task runner and **Nix flakes** for environment management, ensuring consistency and reproducibility.

## 🚀 Quick Start

### Prerequisites

**Option 1: Automatic Setup (Recommended)**

```bash
# Install just first (if needed)
curl --proto '=https' --tlsv1.2 -sSf https://just.systems/install.sh | bash -s -- --to ~/bin

# Complete environment setup
just setup-env
```

**Option 2: Manual**

1. **Nix** with flakes enabled
2. **just** (task runner)
3. **direnv** (optional, but recommended)

### Environment Installation

```bash
# Check if everything is installed
just check-nix

# If you have Nix with flakes
just enter-nix
# or
nix develop

# If you have direnv configured
direnv allow
```

### Available Commands

Run `just` to see all available commands:

```bash
just                 # Shows all commands

# Development
just dev            # Start development server
just build          # Build for production
just lint           # Run linter
just install        # Install dependencies
just clean          # Clean node_modules and locks

# Environment setup
just setup-nix      # Install Nix
just setup-flakes   # Enable flakes
just setup-env      # Complete setup
just check-nix      # Check installation
just enter-nix      # Enter Nix shell
```

## 📦 Dependency Management

This project **enforces the use of pnpm** in all commands. npm/yarn commands are automatically redirected to pnpm.

### Adding Dependencies

```bash
just add react-query              # Add dependency
just add-dev @types/node         # Add dev dependency
just remove lodash               # Remove dependency
```

### Check Dependency Status

```bash
just deps           # Show dependency tree
just outdated       # Check outdated packages
just update         # Update all dependencies
```

## 🛠️ Development

### Development Server

```bash
just dev            # Start with turbopack
just dev-node 18    # Start with specific Node version
```

### Quality Checks

```bash
just lint           # Linter with auto-fix
just check          # Type checking without build
just format         # Code formatting
just pre-commit     # Run all checks
```

### Build and Deploy

```bash
just build          # Build for production
just start          # Start production server
just preview        # Build + serve locally
```

## 🔧 Environment Management

### Nix Flake

The `flake.nix` ensures everyone has:

- Node.js v22.14.0
- pnpm 10.3.0
- just
- Development tools

### Environment Variables

The following variables are automatically configured:

```bash
npm_config_package_manager=pnpm    # Force pnpm usage
NEXT_TELEMETRY_DISABLED=1          # Disable telemetry
FORCE_COLOR=1                      # Colored output
NODE_ENV=development               # Development environment
```

### Direnv (Optional)

If you use direnv, the `.envrc` file automatically loads the environment:

```bash
direnv allow    # Once, to allow the .envrc
# After that, the environment is loaded automatically when entering the folder
```

## 🎯 Why Just + Flake?

### Just

- **Simple**: Clean and easy to understand syntax
- **Fast**: Direct execution without overhead
- **Flexible**: Support for parameters and complex recipes
- **Cross-platform**: Works on any system

### Nix Flakes

- **Reproducible**: Same versions on any machine
- **Isolated**: Doesn't interfere with other installations
- **Versioned**: Version control for development environment
- **Declarative**: Environment as code

### Compatibility

The `package.json` scripts still work, but now redirect to `just`:

```bash
npm run dev         # → just dev
pnpm build         # → just build
yarn lint          # → just lint
```

## 🔍 Debug and Information

```bash
just info           # Show environment information
just --list         # List all available commands
just --show COMMAND # Show what a command does
```

## 🚀 First Use (For New Developers)

If you're new to the project and don't have Nix installed:

```bash
# 1. Clone the repository
git clone <repo-url>
cd torus-prediction-swarm-dashboard

# 2. Install just (if you don't have it)
curl --proto '=https' --tlsv1.2 -sSf https://just.systems/install.sh | bash -s -- --to ~/bin

# 3. Complete environment setup
just setup-env

# 4. Restart shell or load profile
source /nix/var/nix/profiles/default/etc/profile.d/nix-daemon.sh

# 5. Check if everything is working
just check-nix

# 6. Enter development environment
just enter-nix

# 7. Install dependencies and start development
just install
just dev
```

## 🔧 Troubleshooting

### Nix is not working

```bash
# Check status
just check-nix

# Reinstall Nix if necessary
just setup-nix

# Reload shell
source /nix/var/nix/profiles/default/etc/profile.d/nix-daemon.sh
```

### Flakes are not enabled

```bash
just setup-flakes
# Restart shell
```

### Problems with direnv

```bash
# Reinstall direnv
just setup-direnv

# Allow the .envrc
direnv allow

# Check if hook is in shell
echo 'eval "$(direnv hook zsh)"' >> ~/.zshrc  # or ~/.bashrc
```

### Cleanup and Maintenance

```bash
just clean          # Remove node_modules and locks
just nix-clean       # Clean Nix store (free up space)
just update-flake    # Update flake dependencies
```

## 🧹 Maintenance Commands

```bash
# Dependency cleanup
just clean          # Remove node_modules and locks
# Then run: just install

# Nix maintenance
just nix-clean      # Clean Nix store (free up space)
just update-flake   # Update flake inputs
just flake-info     # Show flake information
```

---

For more information about just: https://github.com/casey/just
For more information about Nix flakes: https://nixos.wiki/wiki/Flakes
