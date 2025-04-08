/* eslint-disable @typescript-eslint/no-unused-vars */

import BigNumber from "bignumber.js";
import { buildTaggedBigNumberClass } from "./bignumber";

// Example of creating a tagged BigNumber class
const MyBigNumber = buildTaggedBigNumberClass("MyBigNumber", BigNumber);

// Create a sample instance
const exampleNumber = MyBigNumber.make(100);

/**
 * This file is just an example of how to use the BigNumberBrand.
 * It's not actually used in the library.
 */
