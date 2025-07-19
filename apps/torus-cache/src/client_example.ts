import { STAKE_DATA_SCHEMA } from "@torus-network/sdk/cached-queries";
import { BasicLogger } from "@torus-network/torus-utils/logger";
import { tryAsync, trySync } from "@torus-network/torus-utils/try-catch";
import fetch from "node-fetch";
import SuperJSON from "superjson";

const log = BasicLogger.create({ name: "client_example" });

async function getStakeOutData() {
  const fetchLink = "http://localhost:3000/api/stake-out";
  const fetchRes = await tryAsync(fetch(fetchLink));

  const fetchErrorMsg = () => "Failed to fetch stakeOutData:";
  if (log.ifResultIsErr(fetchRes, fetchErrorMsg)) return null;
  const [_fetchErr, result] = fetchRes;

  const textErrorMsg = () => "Failed to read the response text:";
  const resultTextRes = await tryAsync(result.text());
  if (log.ifResultIsErr(resultTextRes, textErrorMsg)) return null;
  const [_textErr, data] = resultTextRes;

  const parseErrorMsg = () => "Failed to parse JSON data:";
  const parsedDataRes = trySync(SuperJSON.parse(data));
  if (log.ifResultIsErr(parsedDataRes, parseErrorMsg)) return null;
  const [_parseErr, parsedData] = parsedDataRes;

  const schemaErrorMsg = () => "Failed to validate data schema:";
  const stakeOutDataRes = trySync(() => STAKE_DATA_SCHEMA.parse(parsedData));
  if (log.ifResultIsErr(stakeOutDataRes, schemaErrorMsg)) return null;
  const [_schemaErr, stakeOutData] = stakeOutDataRes;

  console.log(stakeOutData.perAddr);
  console.log("total: ", stakeOutData.total);
  return stakeOutData;
}

getStakeOutData().catch(console.error);
