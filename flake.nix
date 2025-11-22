{
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
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
          # The postgres package provides necessary utils
          pkgs.postgresql_18

          # Atlas Community does not have some features
          # e.g. data.external_schema
          ## Database migration tool
          #pkgs.atlas
        ];
      in
      {
        devShell = pkgs.mkShell {
          inherit nativeBuildInputs buildInputs;
          packages = shellPkgs;

          shellHook = ''
            git config core.hooksPath scripts/git-hooks
          '';
        };
      });
}
