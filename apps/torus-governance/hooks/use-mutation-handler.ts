import { useToast } from "@torus-ts/ui/hooks/use-toast";
import { tryAsync } from "@torus-network/torus-utils/try-catch";

interface MutationOptions {
  success?: string;
  error?: string;
  onSuccess?: () => Promise<void> | void;
}

interface MutationResult<T> {
  success: boolean;
  data?: T;
  error?: Error;
}

interface MutationFn<TData, TResult> {
  mutateAsync: (data: TData) => Promise<TResult>;
}

/**
 * Custom hook for handling mutations with consistent error handling
 * @param mutation The TRPC mutation to wrap
 * @returns A function to execute the mutation with error handling
 */
export function useMutationHandler<TData, TResult>(
  mutation: MutationFn<TData, TResult>,
) {
  const { toast } = useToast();

  const executeMutation = async (
    data: TData,
    options: MutationOptions = {},
  ): Promise<MutationResult<TResult>> => {
    const { success: successMessage, error: errorMessage, onSuccess } = options;

    const [error, result] = await tryAsync(mutation.mutateAsync(data));

    if (error !== undefined) {
      toast.error(errorMessage);
      return { success: false, error: error };
    }

    if (successMessage) {
      toast.success(successMessage);
    }

    // Execute additional operations if provided
    if (onSuccess) {
      // Handle both void and Promise<void> returns
      const onSuccessResult = onSuccess();

      // Only use tryAsync if it returns a Promise
      if (onSuccessResult instanceof Promise) {
        const [onSuccessError] = await tryAsync(onSuccessResult);

        if (onSuccessError !== undefined) {
          toast.error("Error performing follow-up operations");
          return { success: false, error: onSuccessError, data: result };
        }
      }
    }

    return { success: true, data: result };
  };

  return executeMutation;
}
