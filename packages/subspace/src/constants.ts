// THIS FILE IS FOR CONSTANTS
// IT HAS A TO-DO ON TOP OF IT
// RIGHT NOW, IT IS ALL HARD CODED BUT SOME OF THE INFORMATION HERE SHOULD BE DINAMIC
// THIS IS JUST A SIMPLIFICATION FOR NOW

export interface ConstantsType {
  TIME: {
    // One minute in seconds
    ONE_MINUTE: number;
    // One hour in seconds
    ONE_HOUR: number;
    // One day in seconds
    ONE_DAY: number;
    // One week in seconds
    ONE_WEEK: number;
    // One block in seconds (8 seconds)
    BLOCK_TIME_SECONDS: number;
    // Blocktime in milliseconds (block time * 1000)
    BLOCK_TIME_MILLISECONDS: number;
    // Last block stale time in miliseconds
    LAST_BLOCK_STALE_TIME: number;
    // Proposals stale time in miliseconds
    PROPOSALS_STALE_TIME: number;
    // Stake stale time in miliseconds
    STAKE_STALE_TIME: number;
  };
  EMISSION: {
    // Decimals of the emission token
    DECIMALS: number;
    // Nano halving interval
    NANO_HALVING_INTERVAL: bigint;
    // Nano max supply
    NANO_MAX_SUPPLY: bigint;
    // Nano block emission
    NANO_BLOCK_EMISSION: bigint;
    // Halving interval
    HALVING_INTERVAL: number;
    // Max supply
    MAX_SUPPLY: number;
    // Block emission in numbers
    BLOCK_EMISSION: number;
  };
  WEIGHTS: {
    // Default min allowed weights is set to 1
    DEFAULT_MIN_ALLOWED_WEIGHTS: number;
    // Default max allowed weights is set to 420
    DEFAULT_MAX_ALLOWED_WEIGHTS: number;
  };
  ECONOMY: {
    // Default emission recycling percentage is set to 1 (100%)
    DEFAULT_EMISSION_RECYCLING_PERCENTAGE: number;
    // Default incentives ratio is set to 0.3 (30%)
    DEFAULT_INCENTIVES_RATIO: number;
  };
}

/**
 * Global constants object for better organization and maintainability.
 */
export const CONSTANTS = {
  TIME: {
    /** One minute in seconds */
    ONE_MINUTE: 60,

    /** One hour in seconds */
    ONE_HOUR: 60 * 60,

    /** One day in seconds */
    ONE_DAY: 60 * 60 * 24,

    /** One week in seconds */
    ONE_WEEK: 60 * 60 * 24 * 7,

    /** Average time (in seconds) for a new block to be produced */
    BLOCK_TIME_SECONDS: 8,

    /** Average block time in milliseconds */
    BLOCK_TIME_MILLISECONDS: 8 * 1000,

    /**
     * Time to consider the last block query stale.
     * Originally calculated as `block_time / 2` (4s), but changed to full block time (8s)
     * for user experience improvements.
     */
    LAST_BLOCK_STALE_TIME: 8 * 1000,

    /**
     * Time to consider proposals query state stale.
     * Proposals do not change frequently but should be visible quickly.
     * One minute in JavaScript time is in milliseconds, so we multiply by 1000.
     */
    PROPOSALS_STALE_TIME: 60 * 1000, // 1 minute (arbitrary)

    /**
     * Time to consider stake query state stale.
     * Stake movements are rare and usually marginal but can impact voting.
     * Five minutes in JavaScript time is in milliseconds, so we multiply by 1000.
     */
    STAKE_STALE_TIME: 5 * 60 * 1000, // 5 minutes (arbitrary)
  },

  EMISSION: {
    /** Decimals of the emission token */
    DECIMALS: 18,
    /** Halving interval in nano units */
    NANO_HALVING_INTERVAL: 144000000000000000000000000n,

    /** Maximum token supply in nano units */
    NANO_MAX_SUPPLY: 144000000000000000000000000n,

    /** Block emission rate in nano units */
    NANO_BLOCK_EMISSION: 5925925925925925925n,

    /** Halving interval converted from nano units to a readable number */
    HALVING_INTERVAL: 144000000.0,
    // Value converted from nano: 144000000.000000000000000000

    /** Maximum supply converted from nano units to a readable number */
    MAX_SUPPLY: 144000000.0,
    // Value converted from nano: 144000000.000000000000000000

    /** Block emission rate converted from nano units to a readable number */
    BLOCK_EMISSION: 5.925925926,
    // Value converted from nano: 5.925925925925925925
  },

  WEIGHTS: {
    /** Minimum allowed weights (u16 type) */
    DEFAULT_MIN_ALLOWED_WEIGHTS: 1,

    /** Maximum allowed weights (u16 type) */
    DEFAULT_MAX_ALLOWED_WEIGHTS: 420,
  },

  ECONOMY: {
    /** Default percentage for emission recycling */
    DEFAULT_EMISSION_RECYCLING_PERCENTAGE: 1,

    /**
     * Default incentives ratio.
     * This value is known to behave strangely as the chain provides 0.5,
     * but querying shows 0.3.
     */
    DEFAULT_INCENTIVES_RATIO: 0.3,
  },
};
