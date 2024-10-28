/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import fetch from "node-fetch";
import SuperJSON from "superjson";

import { STAKE_DATA_SCHEMA } from "@torus-ts/types";

// TODO: use `superjson` instead of `json-bigint`

const result = await fetch("http://localhost:3000/api/stake-out");
const data = await result.text();

const parsedData = SuperJSON.parse(data);
const stakeOutData = STAKE_DATA_SCHEMA.parse(parsedData);

console.log(stakeOutData.perAddr);
console.log("total: ", stakeOutData.total);
