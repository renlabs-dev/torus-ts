{
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let pkgs = nixpkgs.legacyPackages.${system}; in
      {
        devShell = pkgs.mkShell {
          buildInputs = [
            # Git
            pkgs.git-lfs
            # Node.js
            pkgs.nodejs_20
            pkgs.pnpm
            # Run project-specific commands
            pkgs.just
            # Run Github actions locally
            pkgs.act
          ];
        };
      }
    );
}
