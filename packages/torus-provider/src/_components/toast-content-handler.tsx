export const renderWaitingForValidation = (hash: string) => (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      gap: "0.5rem",
      color: "hsl(240 5% 64.9%)",
    }}
  >
    <p>Processing transaction block.</p>
    <a
      style={{
        color: "white",
        textDecoration: "underline",
        fontSize: "0.875rem",
        lineHeight: "1.25rem",
      }}
      target="_blank"
      href={`https://polkadot.js.org/apps/?rpc=wss%3A%2F%2Ftestnet.api.communeai.net#/explorer/query/${hash}`}
    >
      View on block explorer
    </a>
  </div>
);

export const renderSuccessfulyFinalized = (
  transactionType: string,
  hash: string,
) => (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      gap: "0.5rem",
      color: "hsl(240 5% 64.9%)",
    }}
  >
    <p>{transactionType} was finalized successfully.</p>
    <a
      style={{
        color: "white",
        textDecoration: "underline",
        fontSize: "0.875rem",
        lineHeight: "1.25rem",
      }}
      target="_blank"
      href={`https://polkadot.js.org/apps/?rpc=wss%3A%2F%2Ftestnet.api.communeai.net#/explorer/query/${hash}`}
    >
      View on block explorer
    </a>
  </div>
);

export const renderFinalizedWithError = (msg: string, hash: string) => (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      gap: "0.5rem",
      color: "hsl(240 5% 64.9%)",
    }}
  >
    <p>{msg}</p>
    <a
      style={{
        color: "white",
        textDecoration: "underline",
        fontSize: "0.875rem",
        lineHeight: "1.25rem",
      }}
      target="_blank"
      href={`https://polkadot.js.org/apps/?rpc=wss%3A%2F%2Ftestnet.api.communeai.net#/explorer/query/${hash}`}
    >
      View on block explorer
    </a>
  </div>
);
