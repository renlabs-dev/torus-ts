/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import JSONBigInt from "json-bigint";
import fetch from "node-fetch";

const result = await fetch("http://localhost:3000/api/stake-out");

const JSONBig = JSONBigInt({
  useNativeBigInt: true,
  alwaysParseAsBig: true,
  strict: true,
});

const data = await JSONBig.parse(await result.text());

console.log(data.perAddr);

console.log("total: ", data.total);
