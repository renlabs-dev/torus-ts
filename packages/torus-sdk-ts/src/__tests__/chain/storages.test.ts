import { describe, expect, it } from "vitest";
import { queryProposals } from "../../chain/governance/governance-storage.js";
import { getApi } from "../../testing/getApi.js";

describe("Chain Storage Queries", () => {
  it("successfully queries governance proposals", async () => {
    const api = await getApi();

    const proposals = await queryProposals(api);

    // Should return an array (may be empty if no proposals exist)
    expect(Array.isArray(proposals)).toBe(true);

    // If proposals exist, validate structure
    if (proposals.length > 0) {
      const firstProposal = proposals[0]!;

      // Validate proposal structure matches schema
      expect(typeof firstProposal.id).toBe("number");
      expect(typeof firstProposal.proposer).toBe("string");
      expect(typeof firstProposal.expirationBlock).toBe("number");
      expect(typeof firstProposal.creationBlock).toBe("number");
      expect(typeof firstProposal.metadata).toBe("string");
      expect(typeof firstProposal.proposalCost).toBe("bigint");

      // Validate proposal data variants
      expect(firstProposal.data).toBeDefined();
      expect(typeof firstProposal.data).toBe("object");

      // Should have one of the expected proposal data variants
      const dataVariants = [
        "GlobalParams",
        "GlobalCustom",
        "TransferDaoTreasury",
        "Emission",
      ];
      const hasValidVariant = dataVariants.some(
        (variant) => variant in firstProposal.data,
      );
      expect(hasValidVariant).toBe(true);

      // // If it's a GlobalParams proposal, validate the updated schema structure
      // if ("GlobalParams" in firstProposal.data) {
      //   const globalParams = firstProposal.data.GlobalParams;

      //   expect(typeof globalParams.minNameLength).toBe("number");
      //   expect(typeof globalParams.maxNameLength).toBe("number");
      //   expect(typeof globalParams.minWeightControlFee).toBe("number");
      //   expect(typeof globalParams.minStakingFee).toBe("number");
      //   expect(typeof globalParams.dividendsParticipationWeight).toBe("number");
      //   expect(typeof globalParams.proposalCost).toBe("bigint");

      //   // Validate namespace pricing config structure
      //   expect(globalParams.namespacePricingConfig).toBeDefined();
      //   expect(typeof globalParams.namespacePricingConfig.depositPerByte).toBe(
      //     "bigint",
      //   );
      //   expect(typeof globalParams.namespacePricingConfig.baseFee).toBe(
      //     "bigint",
      //   );
      //   expect(typeof globalParams.namespacePricingConfig.countMidpoint).toBe(
      //     "number",
      //   );
      //   expect(typeof globalParams.namespacePricingConfig.feeSteepness).toBe(
      //     "number",
      //   );
      //   expect(
      //     typeof globalParams.namespacePricingConfig.maxFeeMultiplier,
      //   ).toBe("number");
      // }

      // If it's a TransferDaoTreasury proposal, validate structure
      if ("TransferDaoTreasury" in firstProposal.data) {
        const treasuryTransfer = firstProposal.data.TransferDaoTreasury;

        expect(typeof treasuryTransfer.account).toBe("string");
        expect(treasuryTransfer.account.length).toBeGreaterThan(0);
        expect(typeof treasuryTransfer.amount).toBe("bigint");
        expect(treasuryTransfer.amount > 0n).toBe(true);
      }

      // If it's an Emission proposal, validate structure
      if ("Emission" in firstProposal.data) {
        const emission = firstProposal.data.Emission;

        expect(typeof emission.recyclingPercentage).toBe("number");
        expect(emission.recyclingPercentage >= 0).toBe(true);
        expect(emission.recyclingPercentage <= 100).toBe(true);

        expect(typeof emission.treasuryPercentage).toBe("number");
        expect(emission.treasuryPercentage >= 0).toBe(true);
        expect(emission.treasuryPercentage <= 100).toBe(true);

        expect(typeof emission.incentivesRatio).toBe("number");
        expect(emission.incentivesRatio >= 0).toBe(true);
        expect(emission.incentivesRatio <= 100).toBe(true);
      }

      // Validate proposal status structure
      expect(firstProposal.status).toBeDefined();
      expect(typeof firstProposal.status).toBe("object");

      // Should have one of the expected status variants
      const statusVariants = ["Open", "Accepted", "Refused", "Expired"];
      const hasValidStatus = statusVariants.some(
        (variant) => variant in firstProposal.status,
      );
      expect(hasValidStatus).toBe(true);

      // If status is Open, validate voting data
      if ("Open" in firstProposal.status) {
        const openStatus = firstProposal.status.Open;

        expect(Array.isArray(openStatus.votesFor)).toBe(true);
        expect(Array.isArray(openStatus.votesAgainst)).toBe(true);
        expect(typeof openStatus.stakeFor).toBe("bigint");
        expect(typeof openStatus.stakeAgainst).toBe("bigint");

        // Validate vote addresses are properly formatted SS58 addresses
        openStatus.votesFor.forEach((address) => {
          expect(typeof address).toBe("string");
          expect(address.length).toBeGreaterThan(0);
        });

        openStatus.votesAgainst.forEach((address) => {
          expect(typeof address).toBe("string");
          expect(address.length).toBeGreaterThan(0);
        });
      }

      console.log(`Found ${proposals.length} proposal(s) with valid structure`);
    } else {
      console.log(
        "No proposals found on chain - test validates empty array handling",
      );
    }
  });
});
