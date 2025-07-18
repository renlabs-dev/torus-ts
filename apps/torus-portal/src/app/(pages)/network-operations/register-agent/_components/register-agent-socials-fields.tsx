import type { Control } from "react-hook-form";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@torus-ts/ui/components/form";
import { Input } from "@torus-ts/ui/components/input";

import type { RegisterAgentFormData } from "./register-agent-schema";

interface RegisterAgentSocialsTabProps {
  control: Control<RegisterAgentFormData>;
}

export function RegisterAgentSocialsFields({
  control,
}: RegisterAgentSocialsTabProps) {
  return (
    <>
      <div className="flex flex-col gap-4 md:flex-row md:gap-4">
        <FormField
          control={control}
          name="twitter"
          render={({ field }) => (
            <FormItem className="flex flex-col flex-1">
              <FormLabel>X/Twitter</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="x.com/agent-profile"
                  type="text"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="github"
          render={({ field }) => (
            <FormItem className="flex flex-col flex-1">
              <FormLabel>Github</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="github.com/agent-repository"
                  type="text"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:gap-4">
        <FormField
          control={control}
          name="discord"
          render={({ field }) => (
            <FormItem className="flex flex-col flex-1">
              <FormLabel>Discord</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="discord.gg/agent-server"
                  type="text"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="telegram"
          render={({ field }) => (
            <FormItem className="flex flex-col flex-1">
              <FormLabel>Telegram</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="t.me/agent-profile"
                  type="text"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={control}
        name="website"
        render={({ field }) => (
          <FormItem className="flex flex-col">
            <FormLabel>Website</FormLabel>
            <FormControl>
              <Input
                {...field}
                placeholder="www.agent-website.com"
                type="text"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
}
