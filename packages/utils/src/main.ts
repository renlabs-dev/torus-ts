/* eslint-disable @typescript-eslint/no-unused-vars */

import BigNumber from "bignumber.js";
import {
  BaseTaggedBigNumber,
  BN_BRAND_TAG_KEY,
  TaggedBigNumber,
} from "./bignumber";

const MyBigNumber = TaggedBigNumber("MyBigNumber", BigNumber);

const x = MyBigNumber.from(2);

console.log(x);

console.log(x.toFixed(2));

// const test = BaseTaggedBigNumber.from(2);

// console.log(test);
