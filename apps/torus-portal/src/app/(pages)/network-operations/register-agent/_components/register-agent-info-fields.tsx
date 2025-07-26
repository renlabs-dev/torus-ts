import type { Control } from "react-hook-form";

import { AGENT_SHORT_DESCRIPTION_MAX_LENGTH } from "@torus-network/sdk/metadata";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@torus-ts/ui/components/form";
import { Input } from "@torus-ts/ui/components/input";
import { Textarea } from "@torus-ts/ui/components/text-area";

import type { RegisterAgentFormData } from "./register-agent-schema";

interface RegisterAgentInfoTabProps {
  control: Control<RegisterAgentFormData>;
}

export function RegisterAgentInfoFields({
  control,
}: RegisterAgentInfoTabProps) {
  return (
    <>
      <FormField
        control={control}
        name="agentApiUrl"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              API URL{" "}
              <span className="text-sm text-muted-foreground">(Optional)</span>
            </FormLabel>
            <FormControl>
              <Input
                {...field}
                placeholder="e.g. https://my-agent-api.com"
                type="text"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Name</FormLabel>
            <FormControl>
              <Input
                {...field}
                placeholder="e.g. memory-agent"
                type="text"
                required
                maxLength={30}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="shortDescription"
        render={({ field }) => (
          <FormItem className="flex flex-col max-w-3xl">
            <FormLabel>Introduction</FormLabel>
            <FormControl>
              <Textarea
                {...field}
                placeholder="e.g. A memory agent that stores and retrieves data"
                rows={1}
                maxLength={AGENT_SHORT_DESCRIPTION_MAX_LENGTH}
                required
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="body"
        render={({ field }) => (
          <FormItem className="flex flex-col">
            <FormLabel>
              Agent Description / Documentation{" "}
              <span className="text-sm text-muted-foreground">(Optional)</span>
            </FormLabel>
            <FormControl>
              <Textarea
                {...field}
                value={field.value ?? ""}
                placeholder="e.g. This agent stores and retrieves data from a database, this is a detailed description of the agent's functionality."
                rows={5}
                maxLength={3000}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
}
