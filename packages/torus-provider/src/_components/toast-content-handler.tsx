export const getExplorerLink = ({
  wsEndpoint,
  hash,
}: {
  wsEndpoint: string;
  hash: string;
}) => `https://polkadot.js.org/apps/?rpc=${wsEndpoint}#/explorer/query/${hash}`;
