import type { CSSProperties } from "react";

const divStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "0.5rem",
  color: "hsl(240 5% 64.9%)",
};

const linkStyle: CSSProperties = {
  color: "white",
  textDecoration: "underline",
  fontSize: "0.875rem",
  cursor: "pointer",
};

const getExplorerLink = ({
  wsEndpoint,
  hash,
}: {
  wsEndpoint: string;
  hash: string;
}) => `https://polkadot.js.org/apps/?rpc=${wsEndpoint}#/explorer/query/${hash}`;

export const renderWaitingForValidation = (
  hash: string,
  wsEndpoint: string,
) => (
  <div style={divStyle}>
    <p>Validating transaction in block.</p>
    <a
      style={linkStyle}
      target="_blank"
      href={getExplorerLink({ wsEndpoint, hash })}
      rel="noreferrer"
    >
      View on block explorer
    </a>
  </div>
);

export const renderSuccessfulyFinalized = (
  transactionType: string,
  hash: string,
  wsEndpoint: string,
) => (
  <div style={divStyle}>
    <p>{transactionType} completed successfully</p>
    <a
      style={linkStyle}
      target="_blank"
      href={getExplorerLink({ wsEndpoint, hash })}
      rel="noreferrer"
    >
      View on block explorer
    </a>
  </div>
);

export const renderFinalizedWithError = (
  msg: string,
  hash: string,
  wsEndpoint: string,
) => (
  <div style={divStyle}>
    <p>{msg}</p>
    <a
      style={linkStyle}
      target="_blank"
      href={getExplorerLink({ wsEndpoint, hash })}
      rel="noreferrer"
    >
      View on block explorer
    </a>
  </div>
);
