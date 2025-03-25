import { STAKE_DATA_SCHEMA } from "@torus-network/sdk";
import fetch from "node-fetch";
import SuperJSON from "superjson";

const result = await fetch("http://localhost:3000/api/stake-out");
const data = await result.text();

const parsedData = SuperJSON.parse(data);
const stakeOutData = STAKE_DATA_SCHEMA.parse(parsedData);

console.log(stakeOutData.perAddr);
console.log("total: ", stakeOutData.total);
