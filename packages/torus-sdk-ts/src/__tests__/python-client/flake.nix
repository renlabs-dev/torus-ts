{
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
    poetry2nix.url = "github:nix-community/poetry2nix";
  };

  outputs = { self, nixpkgs, flake-utils, poetry2nix }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
        p2n = poetry2nix.lib.mkPoetry2Nix { inherit pkgs; };
      in
      {
        devShells.default = pkgs.mkShell {
          packages = [
            pkgs.python3
            pkgs.poetry
            pkgs.curl  # for debugging HTTP requests
          ];
          shellHook = ''
            echo "🐍 Python Agent Test Environment"
            echo "Available commands:"
            echo "  poetry install        - Install dependencies"
            echo "  poetry run python test_agent.py - Run the test"
          '';
        };
        
        packages.default = p2n.mkPoetryApplication {
          projectDir = ./.;
          python = pkgs.python3;
        };
      }
    );
}