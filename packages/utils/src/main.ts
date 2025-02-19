/* eslint-disable @typescript-eslint/no-unused-vars */

import {
  BigNumberBrand,
  BN_BRAND_TAG_KEY,
  buildTaggedBigNumberClass,
} from "./bignumber";
import BigNumber from "bignumber.js";

const MyBigNumber = buildTaggedBigNumberClass("MyBigNumber", BigNumber);

const x = MyBigNumber.from(2);

console.log(x);

console.log(x.toFixed(2));

// const test = BaseTaggedBigNumber.from(2);

// console.log(test);
