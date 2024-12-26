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

const POLKADOT_JS_EXPLORER_URL = {
  dev: "https://polkadot.js.org/apps/?rpc=wss%3A%2F%2Ftestnet.api.communeai.net#/explorer/query",
  prod: "https://polkadot.js.org/apps/?rpc=wss%3A%2F%2Fapi.communeai.net#/explorer/query",
};

export const renderWaitingForValidation = (hash: string) => (
  <div style={divStyle}>
    <p>Processing transaction block.</p>
    <a
      style={linkStyle}
      target="_blank"
      href={`${POLKADOT_JS_EXPLORER_URL.dev}/${hash}`}
    >
      View on block explorer
    </a>
  </div>
);

export const renderSuccessfulyFinalized = (
  transactionType: string,
  hash: string,
) => (
  <div style={divStyle}>
    <p>{transactionType} was finalized successfully.</p>
    <a
      style={linkStyle}
      target="_blank"
      href={`https://polkadot.js.org/apps/?rpc=wss%3A%2F%2Ftestnet.api.communeai.net#/explorer/query/${hash}`}
    >
      View on block explorer
    </a>
  </div>
);

export const renderFinalizedWithError = (msg: string, hash: string) => (
  <div style={divStyle}>
    <p>{msg}</p>
    <a
      style={linkStyle}
      target="_blank"
      href={`https://polkadot.js.org/apps/?rpc=wss%3A%2F%2Ftestnet.api.communeai.net#/explorer/query/${hash}`}
    >
      View on block explorer
    </a>
  </div>
);
