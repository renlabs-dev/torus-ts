{
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-24.11";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
        # lib = pkgs.lib;

        buildInputs = [
          # Node.js
          pkgs.nodejs_22
        ];
        shellPkgs = [
          # Run project-specific commands
          pkgs.just
          # Run Github actions locally
          pkgs.act
        ];
      in
      {
        devShell = pkgs.mkShell {
          inherit buildInputs;
          packages = shellPkgs;
        };
      });
}
