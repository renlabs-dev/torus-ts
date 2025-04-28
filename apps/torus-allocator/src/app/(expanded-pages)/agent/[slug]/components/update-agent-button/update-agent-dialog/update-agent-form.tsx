import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@torus-ts/ui/components/form";
import { Input } from "@torus-ts/ui/components/input";
import { Separator } from "@torus-ts/ui/components/separator";
import { Textarea } from "@torus-ts/ui/components/text-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@torus-ts/ui/components/tooltip";
import { FileImage, Globe, MessageCircle, Terminal } from "lucide-react";
import Image from "next/image";
import type { useForm } from "react-hook-form";
import type {
  UpdateAgentFormData,
  UpdateAgentMutation,
} from "./update-agent-form-schema";
import { updateAgentSchema } from "./update-agent-form-schema";

interface UpdateAgentFormProps {
  agentKey: string;
  updateAgentMutation: UpdateAgentMutation;
  setActiveTab: (tab: string) => void;
  setIsOpen?: (isOpen: boolean) => void;
  form: ReturnType<typeof useForm<UpdateAgentFormData>>;
  imageFile: File | null;
}

export function UpdateAgentForm({
  updateAgentMutation,
  form,
  imageFile,
}: UpdateAgentFormProps) {
  const onSubmit = (data: UpdateAgentFormData) => {
    void updateAgentMutation.mutate({
      ...data,
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Basic Information</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    Name <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Agent Name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    Title <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Agent Title" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="shortDescription"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  Short Description <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Brief description of your agent (max 200 characters)"
                    maxLength={200}
                  />
                </FormControl>
                <p className="text-xs text-muted-foreground mt-1">
                  {field.value.length || 0}/
                  {updateAgentSchema.shape.shortDescription.maxLength} characters
                </p>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  Description <span className="text-red-500">*</span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger className="cursor-help">
                        <MessageCircle className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="w-[250px] text-sm">
                          Supports Markdown formatting for rich content
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="Full description with markdown support"
                    maxLength={5000}
                    rows={6}
                    className="resize-y"
                  />
                </FormControl>
                <p className="text-xs text-muted-foreground mt-1">
                  {field.value.length || 0}/
                  {updateAgentSchema.shape.description.maxLength} characters
                </p>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Separator />

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Technical Information</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="website"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Globe className="h-4 w-4" /> Website URL
                  </FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="https://..." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="apiUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Terminal className="h-4 w-4" /> API Endpoint URL
                  </FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="https://..." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="imageUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <FileImage className="h-4 w-4" /> Agent Icon
                </FormLabel>
                <div className="flex flex-col sm:flex-row gap-4 items-start">
                  <div className="flex-1 w-full">
                    <FormControl>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                          updateAgentMutation.handleImageChange &&
                          updateAgentMutation.handleImageChange(e)
                        }
                        className="cursor-pointer"
                      />
                    </FormControl>
                    <p className="text-xs text-muted-foreground mt-1">
                      Recommended size: 256x256px
                    </p>
                    <FormMessage />
                  </div>

                  {(field.value ?? imageFile) && (
                    <div className="rounded-md overflow-hidden w-24 h-24 border flex-shrink-0 bg-muted">
                      <Image
                        src={
                          field.value ??
                          (imageFile ? URL.createObjectURL(imageFile) : "")
                        }
                        alt="Agent Icon Preview"
                        className="w-full h-full object-cover"
                        width={256}
                        height={256}
                      />
                    </div>
                  )}
                </div>
              </FormItem>
            )}
          />
        </div>

        <Separator />

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Social Links</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="socials.discord"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    Discord
                  </FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="https://discord.gg/..." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="socials.twitter"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    Twitter
                  </FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="https://twitter.com/..." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="socials.github"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    GitHub
                  </FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="https://github.com/..." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="socials.telegram"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    Telegram
                  </FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="https://t.me/..." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Social links are optional but recommended to help users connect with
            your project
          </p>
        </div>
      </form>
    </Form>
  );
}