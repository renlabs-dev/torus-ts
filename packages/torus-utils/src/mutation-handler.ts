import { tryAsync } from "./try-catch.js";

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

interface ToastInterface {
  success: (message: string) => void;
  error: (message: string) => void;
}

/**
 * Function for handling mutations with consistent error handling
 *
 * @param mutation - The TRPC mutation to wrap
 * @param toast - The toast interface for notifications
 * @returns A function to execute the mutation with error handling
 */
export function createMutationHandler<TData, TResult>(
  mutation: MutationFn<TData, TResult>,
  toast: ToastInterface,
) {
  const executeMutation = async (
    data: TData,
    options: MutationOptions = {},
  ): Promise<MutationResult<TResult>> => {
    const { success: successMessage, error: errorMessage, onSuccess } = options;

    const [error, result] = await tryAsync(mutation.mutateAsync(data));

    if (error !== undefined) {
      toast.error(errorMessage ?? "An error occurred");
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
          toast.error(onSuccessError.message);
          return { success: false, error: onSuccessError, data: result };
        }
      }
    }

    return { success: true, data: result };
  };

  return executeMutation;
}
