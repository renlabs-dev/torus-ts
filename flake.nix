{
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
        nativeBuildInputs = [
          # systemd provides libudev for `npm:usb` because of Solana adapter on Hyperlane
          pkgs.systemd
        ];
        buildInputs = [
          pkgs.nodejs_20
          pkgs.pnpm
        ];
        shellPkgs = [
          # # Git LFS
          # pkgs.git-lfs
          # Run project-specific commands
          pkgs.just
          # Run Github actions locally
          pkgs.act
        ];
      in
      {
        devShell = pkgs.mkShell {
          inherit nativeBuildInputs buildInputs;
          packages = shellPkgs;
        };
      }
    );
}
