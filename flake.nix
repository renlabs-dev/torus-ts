{
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-25.05";
    flake-utils.url = "github:numtide/flake-utils";

    git-hooks.url = "github:cachix/git-hooks.nix";
    git-hooks.inputs.nixpkgs.follows = "nixpkgs";
  };

  outputs = { self, nixpkgs, flake-utils, git-hooks }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
        lib = pkgs.lib;
        nativeBuildInputs = lib.optionals pkgs.stdenv.isLinux [
          # `systemd` provides libudev for `npm:usb` because of Solana adapter on
          # Hyperlane, we should enable it only on Linux
          pkgs.systemd
        ];
        buildInputs = [
          # Node.js
          pkgs.nodejs_20
          pkgs.pnpm
        ];
        shellPkgs = [
          # Run project-specific commands
          pkgs.just
          # Run Github actions locally
          pkgs.act
          # Git is our choice of source control :)
          pkgs.git

          # Atlas Community does not have some features
          # e.g. data.external_schema
          ## Database migration tool
          #pkgs.atlas
        ];
      in
      {
        checks = {
          git-checks = git-hooks.lib.${system}.run {
            src = ./.;
            hooks = {
              push = {
                enable = true;
                name = "Test it all";
                entry = "just check-test";
                pass_filenames = false;
                stages = [ "pre-push" ];
              };
            };
          };
        };

        devShell = pkgs.mkShell {
          inherit nativeBuildInputs buildInputs;
          packages = shellPkgs;

          shellHook = ''
            ${self.checks.${system}.git-checks.shellHook}
          '';
        };
      });
}
