import { STAKE_DATA_SCHEMA } from "@torus-network/sdk";
import { tryAsync, trySync } from "@torus-network/torus-utils/try-catch";
import fetch from "node-fetch";
import SuperJSON from "superjson";

async function getStakeOutData() {
  const fetchLink = "http://localhost:3000/api/stake-out";
  const [fetchError, result] = await tryAsync(fetch(fetchLink));

  // Fetching the stakeOutData
  if (fetchError !== undefined) {
    console.log("Error fetching stakeOutData:", fetchError);
    return null;
  }

  // Parsing the stakeOutData
  const [textError, data] = await tryAsync(result.text());
  if (textError !== undefined) {
    console.log("Failed to read the response text:", textError);
    return null;
  }

  // Parsing with JSON
  const [parseError, parsedData] = trySync(SuperJSON.parse(data));
  if (parseError !== undefined) {
    console.log("Failed to parse JSON data:", parseError);
    return null;
  }

  // Validating the data with schema
  const [schemaError, stakeOutData] = trySync(() =>
    STAKE_DATA_SCHEMA.parse(parsedData),
  );
  if (schemaError !== undefined) {
    console.log("Failed to validate data schema:", schemaError);
    return null;
  }

  console.log(stakeOutData.perAddr);
  console.log("total: ", stakeOutData.total);
  return stakeOutData;
}

getStakeOutData().catch(console.error);
