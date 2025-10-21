import type { BN } from "@polkadot/util";
import type { Option } from "@torus-network/torus-utils";
import { assert } from "tsafe";
import type { Equals, Extends } from "tsafe";
import type z from "zod";
import type { SS58Address } from "../types/address.js";
import { sb_address } from "./address.js";
import { sb_u8a, sb_u8a_fixed_to_bn } from "./bytes.js";
import { sb_array, sb_map } from "./collections.js";
import { sb_basic_enum, sb_enum } from "./enum.js";
import type { HexH256 } from "./hash.js";
import { sb_h256 } from "./hash.js";
import { sb_option, sb_option_default, sb_some } from "./option.js";
import { sb_bigint, sb_bool, sb_null, sb_number } from "./primitives.js";
import { sb_struct } from "./struct.js";
import { sb_string } from "./text.js";

// ==== Primitives ====

function _test_primitives() {
  const _num = sb_number;
  const _bigint = sb_bigint;
  const _string = sb_string;
  const _bool = sb_bool;
  const _null = sb_null;

  type Num = z.infer<typeof _num>;
  type BigInt = z.infer<typeof _bigint>;
  type Str = z.infer<typeof _string>;
  type Bool = z.infer<typeof _bool>;
  type Null = z.infer<typeof _null>;

  assert<Equals<Num, number>>();
  assert<Equals<BigInt, bigint>>();
  assert<Equals<Str, string>>();
  assert<Equals<Bool, boolean>>();
  assert<Equals<Null, null>>();
}

// ==== Structs ====

function _test_struct() {
  const _s1 = sb_struct({
    index: sb_number,
    name: sb_string,
  });

  type S1 = z.infer<typeof _s1>;
  assert<Equals<S1, { index: number; name: string }>>();
}

function _test_nested_struct() {
  const _inner = sb_struct({
    id: sb_number,
    active: sb_bool,
  });

  const _outer = sb_struct({
    metadata: _inner,
    name: sb_string,
    count: sb_bigint,
  });

  type Inner = z.infer<typeof _inner>;
  type Outer = z.infer<typeof _outer>;

  assert<Equals<Inner, { id: number; active: boolean }>>();
  assert<
    Equals<
      Outer,
      { metadata: { id: number; active: boolean }; name: string; count: bigint }
    >
  >();
}

// ==== Enums ====

function _test_enum() {
  const _status = sb_enum({
    Active: sb_struct({ since: sb_number }),
    Inactive: sb_null,
    Pending: sb_string,
  });

  type Status = z.infer<typeof _status>;
  assert<
    Equals<
      Status,
      { Active: { since: number } } | { Inactive: null } | { Pending: string }
    >
  >();
}

function _test_basic_enum() {
  const _direction = sb_basic_enum(["North", "South", "East", "West"] as const);

  type Direction = z.infer<typeof _direction>;
  assert<Equals<Direction, "North" | "South" | "East" | "West">>();
}

function _test_nested_enum() {
  const _inner_enum = sb_enum({
    Success: sb_number,
    Error: sb_string,
  });

  const _outer_enum = sb_enum({
    Result: _inner_enum,
    Pending: sb_null,
  });

  type InnerEnum = z.infer<typeof _inner_enum>;
  type OuterEnum = z.infer<typeof _outer_enum>;

  assert<Equals<InnerEnum, { Success: number } | { Error: string }>>();
  assert<
    Equals<
      OuterEnum,
      { Result: { Success: number } | { Error: string } } | { Pending: null }
    >
  >();
}

// ==== Options ====

function _test_option() {
  const _opt_num = sb_option(sb_number);
  const _opt_struct = sb_option(
    sb_struct({
      id: sb_number,
      name: sb_string,
    }),
  );

  type OptNum = z.infer<typeof _opt_num>;
  type OptStruct = z.infer<typeof _opt_struct>;

  assert<Equals<OptNum, Option<number>>>();
  assert<Equals<OptNum, { None: null } | { Some: number }>>();

  assert<Equals<OptStruct, Option<{ id: number; name: string }>>>();
  assert<
    Equals<OptStruct, { None: null } | { Some: { id: number; name: string } }>
  >();
}

function _test_option_default() {
  const _opt_with_default = sb_option_default(sb_number, 42);
  const _opt_string_default = sb_option_default(sb_string, "default");

  type OptWithDefault = z.infer<typeof _opt_with_default>;
  type OptStringDefault = z.infer<typeof _opt_string_default>;

  assert<Equals<OptWithDefault, number>>();
  assert<Equals<OptStringDefault, string>>();
}

function _test_some() {
  const _some_num = sb_some(sb_number);
  const _some_struct = sb_some(
    sb_struct({
      value: sb_bool,
    }),
  );

  type SomeNum = z.infer<typeof _some_num>;
  type SomeStruct = z.infer<typeof _some_struct>;

  assert<Equals<SomeNum, number>>();
  assert<Equals<SomeStruct, { value: boolean }>>();
}

// ==== Collections ====

function _test_array() {
  const _num_array = sb_array(sb_number);
  const _string_array = sb_array(sb_string);
  const _struct_array = sb_array(
    sb_struct({
      id: sb_number,
      active: sb_bool,
    }),
  );

  type NumArray = z.infer<typeof _num_array>;
  type StringArray = z.infer<typeof _string_array>;
  type StructArray = z.infer<typeof _struct_array>;

  assert<Equals<NumArray, number[]>>();
  assert<Equals<StringArray, string[]>>();
  assert<Equals<StructArray, { id: number; active: boolean }[]>>();
}

function _test_map() {
  const _str_num_map = sb_map(sb_string, sb_number);
  const _num_struct_map = sb_map(
    sb_number,
    sb_struct({
      name: sb_string,
      count: sb_bigint,
    }),
  );

  type StrNumMap = z.infer<typeof _str_num_map>;
  type NumStructMap = z.infer<typeof _num_struct_map>;

  assert<Equals<StrNumMap, Map<string, number>>>();
  assert<Equals<NumStructMap, Map<number, { name: string; count: bigint }>>>();
}

function _test_nested_collections() {
  const _nested_array = sb_array(sb_array(sb_number));
  const _map_of_arrays = sb_map(sb_string, sb_array(sb_number));
  const _array_of_maps = sb_array(sb_map(sb_string, sb_number));

  type NestedArray = z.infer<typeof _nested_array>;
  type MapOfArrays = z.infer<typeof _map_of_arrays>;
  type ArrayOfMaps = z.infer<typeof _array_of_maps>;

  assert<Equals<NestedArray, number[][]>>();
  assert<Equals<MapOfArrays, Map<string, number[]>>>();
  assert<Equals<ArrayOfMaps, Map<string, number>[]>>();
}

// ==== Hash Types ====

function _test_hash() {
  const _h256 = sb_h256;

  type H256 = z.infer<typeof _h256>;
  type HexH256Type = HexH256;

  assert<Equals<H256, HexH256Type>>();
  assert<Extends<H256, `0x${string}`>>();
  assert<Extends<HexH256Type, string>>();
}

// ==== Address Types ====

function _test_address() {
  const _addr = sb_address;

  type Address = z.infer<typeof _addr>;

  assert<Equals<Address, SS58Address>>();
  assert<Extends<SS58Address, string>>();
}

// ==== Bytes Types ====

function _test_bytes() {
  const _u8a = sb_u8a;
  const _u8a_to_bn = sb_u8a_fixed_to_bn;

  type U8a = z.infer<typeof _u8a>;
  type U8aToBn = z.infer<typeof _u8a_to_bn>;

  assert<Equals<U8a, Uint8Array>>();
  assert<Equals<U8aToBn, BN>>();
}

// ==== Complex Compositions ====

function _test_permission_structure() {
  // Example: A complex permission structure using multiple parsers
  const _permission = sb_struct({
    id: sb_h256,
    grantor: sb_address,
    recipient: sb_option(sb_address),
    constraints: sb_array(
      sb_struct({
        constraint_type: sb_basic_enum([
          "Amount",
          "Time",
          "Frequency",
        ] as const),
        value: sb_bigint,
      }),
    ),
    status: sb_enum({
      Active: sb_struct({ since: sb_number }),
      Revoked: sb_struct({
        reason: sb_string,
        revoked_at: sb_number,
      }),
      Expired: sb_null,
    }),
    metadata: sb_option(sb_map(sb_string, sb_string)),
  });

  type Permission = z.infer<typeof _permission>;

  assert<
    Equals<
      Permission,
      {
        id: HexH256;
        grantor: SS58Address;
        recipient: Option<SS58Address>;
        constraints: {
          constraint_type: "Amount" | "Time" | "Frequency";
          value: bigint;
        }[];
        status:
          | { Active: { since: number } }
          | { Revoked: { reason: string; revoked_at: number } }
          | { Expired: null };
        metadata: Option<Map<string, string>>;
      }
    >
  >();
}

function _test_nested_enums_with_options() {
  // Example: Nested enum with optional data
  const _response = sb_enum({
    Success: sb_struct({
      data: sb_option(sb_array(sb_number)),
      timestamp: sb_number,
    }),
    Error: sb_enum({
      ValidationError: sb_array(sb_string),
      NetworkError: sb_string,
      InternalError: sb_null,
    }),
    Pending: sb_option(
      sb_struct({
        estimated_completion: sb_number,
      }),
    ),
  });

  type Response = z.infer<typeof _response>;

  assert<
    Equals<
      Response,
      | { Success: { data: Option<number[]>; timestamp: number } }
      | {
          Error:
            | { ValidationError: string[] }
            | { NetworkError: string }
            | { InternalError: null };
        }
      | { Pending: Option<{ estimated_completion: number }> }
    >
  >();
}

function _test_recursive_structure() {
  // Example: Tree-like structure with recursive nesting
  const _node_inner = sb_struct({
    id: sb_string,
    value: sb_number,
    children: sb_array(
      sb_struct({
        id: sb_string,
        value: sb_number,
      }),
    ),
  });

  const _tree = sb_struct({
    root: _node_inner,
    metadata: sb_map(sb_string, sb_option(sb_bigint)),
  });

  type NodeInner = z.infer<typeof _node_inner>;
  type Tree = z.infer<typeof _tree>;

  assert<
    Equals<
      NodeInner,
      {
        id: string;
        value: number;
        children: { id: string; value: number }[];
      }
    >
  >();

  assert<
    Equals<
      Tree,
      {
        root: {
          id: string;
          value: number;
          children: { id: string; value: number }[];
        };
        metadata: Map<string, Option<bigint>>;
      }
    >
  >();
}
