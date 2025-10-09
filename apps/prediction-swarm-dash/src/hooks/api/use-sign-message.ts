"use client";

import { useMutation } from "@tanstack/react-query";

interface SignMessageRequest {
  message: string;
}

interface SignMessageResponse {
  signature: string;
  address: string;
}

import { internalApiFetch } from "@/lib/fetch";

export async function signMessageAPI(
  params: SignMessageRequest,
): Promise<SignMessageResponse> {
  return internalApiFetch<SignMessageResponse>("/api/sign-message", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export function useSignMessage() {
  return useMutation({
    mutationFn: signMessageAPI,
  });
}
