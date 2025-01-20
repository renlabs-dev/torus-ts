import { Button, Card } from "@torus-ts/ui";
import { useGovernance } from "~/context/governance-provider";
import { CreateCadreCandidates } from "../agent-application/create-cadre-candidates";

export const CuratorNotAuthenticated = (props: {
  authenticateUser: () => Promise<void>;
}) => {
  const { authenticateUser } = props;
  const { isUserCadre, isUserCadreCandidate, selectedAccount } =
    useGovernance();

  if (!isUserCadre && !isUserCadreCandidate && selectedAccount)
    return (
      <Card className="py-8">
        <div className="flex flex-col items-center justify-center gap-4">
          <h1 className="font-bold">
            This content is only avaiable to Curators.
          </h1>
          <CreateCadreCandidates />
        </div>
      </Card>
    );

  if (isUserCadre)
    return (
      <Card className="py-8">
        <div className="flex flex-col items-center justify-center gap-1">
          <h1 className="font-bold">You are not authenticated.</h1>
          <p className="">Please sign in to view this page.</p>
          <Button
            variant="default"
            className="mt-4 px-4 py-2"
            onClick={() => authenticateUser()}
          >
            Sign in
          </Button>
        </div>
      </Card>
    );

  if (isUserCadreCandidate)
    return (
      <Card className="py-8">
        <div className="flex flex-col items-center justify-center gap-1">
          <h1 className="font-bold">
            Your candidacy has not been approved yet
          </h1>
          <p className="">
            Unfortunately, you are not allowed to view this content.
          </p>
        </div>
      </Card>
    );
};
