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
import { FileImage, Globe, Terminal } from "lucide-react";
import Image from "next/image";
import type {
  UpdateAgentForm,
  UpdateAgentFormData,
  UpdateAgentMutation,
} from "./update-agent-dialog-form-schema";
import {
  ACCEPTED_FILE_TYPES,
  MAX_FILE_SIZE,
  updateAgentSchema,
} from "./update-agent-dialog-form-schema";

interface UpdateAgentDialogFormProps {
  agentKey: string;
  updateAgentMutation: UpdateAgentMutation;
  setActiveTab: (tab: string) => void;
  setIsOpen?: (isOpen: boolean) => void;
  form: UpdateAgentForm;
  currentImagePreview?: string | null;
}

export function UpdateAgentDialogForm({
  updateAgentMutation,
  form,
  currentImagePreview,
}: UpdateAgentDialogFormProps) {
  const imageFile = form.watch("imageFile");
  const imageBlobUrl = imageFile ? URL.createObjectURL(imageFile) : null;

  const onSubmit = (data: UpdateAgentFormData) => {
    void updateAgentMutation.mutate({
      ...data,
    });
  };

  const acceptedFileTypesMessage = `File must be ${ACCEPTED_FILE_TYPES.map((aft) => aft.toUpperCase()).join(", ")} format`;

  const onChangeImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      form.setError("imageFile", {
        type: "manual",
        message: `File size must be less than ${(MAX_FILE_SIZE / 1000).toFixed(0)}KB`,
      });
      return;
    }

    if (!ACCEPTED_FILE_TYPES.includes(file.type.split("/")[1] ?? "")) {
      form.setError("imageFile", {
        type: "manual",
        message: acceptedFileTypesMessage,
      });
      return;
    }

    form.clearErrors("imageFile");
    updateAgentMutation.handleImageChange(e);
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
                    <Input
                      {...field}
                      disabled
                      className="bg-muted/50 cursor-not-allowed"
                    />
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
                    <Input
                      {...field}
                      placeholder="Ex.: AI Support Specialist"
                    />
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
                    placeholder="Ex.: An AI assistant that helps users troubleshoot technical problems"
                    maxLength={200}
                  />
                </FormControl>
                <p className="text-xs text-muted-foreground mt-1">
                  {field.value.length || 0}/
                  {updateAgentSchema.shape.shortDescription.maxLength}{" "}
                  characters
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
                </FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="Ex.: ## About This Agent
This agent specializes in providing technical support by analyzing issues and offering step-by-step solutions. It can help with software troubleshooting, guide users through complex processes, and learn from interactions."
                    maxLength={50_000}
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
                    <Input
                      {...field}
                      placeholder="Ex.: https://myagent.example.com"
                    />
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
                    <Input
                      {...field}
                      placeholder="Ex.: https://api.example.com/agent"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="imageFile"
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
                        accept={`image/${ACCEPTED_FILE_TYPES.join(",image/")}`}
                        onChange={onChangeImageFile}
                        className="cursor-pointer"
                      />
                    </FormControl>
                    <p className="text-xs text-muted-foreground mt-1">
                      Square Image (Max 512x512) • Max{" "}
                      {(MAX_FILE_SIZE / 1000).toFixed(0)}KB •{" "}
                      {acceptedFileTypesMessage}
                    </p>
                    <FormMessage />
                  </div>

                  {(field.value ?? currentImagePreview) && (
                    <div className="rounded-md overflow-hidden w-24 h-24 border flex-shrink-0 bg-muted">
                      <Image
                        src={
                          field.value
                            ? (imageBlobUrl ?? "")
                            : (currentImagePreview ?? "")
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
                    <Input
                      {...field}
                      placeholder="Ex.: https://discord.gg/myagent or https://discord.gg/invite/myagent"
                    />
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
                    <Input
                      {...field}
                      placeholder="Ex.: https://twitter.com/myagent or https://x.com/myagent"
                    />
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
                    <Input
                      {...field}
                      placeholder="Ex.: https://github.com/myorg/myagent"
                    />
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
                    <Input {...field} placeholder="Ex.: https://t.me/myagent" />
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
