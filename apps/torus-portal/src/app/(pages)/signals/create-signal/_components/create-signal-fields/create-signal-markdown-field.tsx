import {
  FormControl,
  FormItem,
  FormLabel,
  FormMessage,
} from "@torus-ts/ui/components/form";
import { MarkdownView } from "@torus-ts/ui/components/markdown-view";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@torus-ts/ui/components/tabs";
import { Textarea } from "@torus-ts/ui/components/text-area";

export function CreateSignalMarkdownField({
  field,
}: {
  field: {
    value: string;
  };
}) {
  return (
    <FormItem>
      <FormLabel>Description</FormLabel>
      <FormControl>
        <Tabs defaultValue="edit" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="edit">Edit</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>
          <TabsContent value="edit">
            <Textarea
              maxLength={2000}
              placeholder="e.g. We need a bridge between Discord and X to facilitate communication between the two platformss."
              className="min-h-[200px] resize-none"
              {...field}
            />
          </TabsContent>
          <TabsContent value="preview">
            <div className="min-h-[200px] rounded-md border p-3 bg-muted/50">
              {field.value ? (
                <MarkdownView
                  source={field.value}
                  className="prose prose-sm dark:prose-invert max-w-none"
                />
              ) : (
                <p className="text-muted-foreground text-sm">
                  No content to preview. Switch to Edit tab to add content.
                </p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </FormControl>
      <FormMessage />
    </FormItem>
  );
}
