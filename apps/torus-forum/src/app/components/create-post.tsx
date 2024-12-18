"use client";

import { useCallback, useState } from "react";
import MarkdownPreview from "@uiw/react-markdown-preview";
import { z } from "zod";

import { toast } from "@torus-ts/query-provider/use-toast";
import { useTorus } from "@torus-ts/torus-provider";
import { Checkbox } from "@torus-ts/ui";

import type { Category } from "./filters";
import { api } from "~/trpc/react";
import { cairo } from "~/utils/fonts";
import { CategoriesSelector } from "./filters";

const postSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
});

interface CreatePostProps {
  categories: Category[];
  handleModal: () => void;
}

export const CreatePost: React.FC<CreatePostProps> = (props) => {
  const { categories, handleModal } = props;

  const utils = api.useUtils();
  const { mutate: createPost, isPending } = api.forum.createPost.useMutation({
    onSuccess: async () => {
      toast.success("Post created successfully");
      handleCleanStates();
      await utils.forum.all.invalidate();
      handleModal();
    },
  });

  const { isAccountConnected, selectedAccount } = useTorus();

  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null,
  );
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const [editMode, setEditMode] = useState(true);
  const [isAnon, setIsAnon] = useState(false);

  function toggleEditMode(): void {
    setEditMode(!editMode);
  }

  const handleCategoryChange = useCallback(
    (category: Category | null) => {
      if (category?.id === selectedCategory?.id) return;
      setSelectedCategory(category);
      console.log(selectedCategory);
    },
    [selectedCategory],
  );

  const handleIsAnonCheckbox = () => {
    setIsAnon(!isAnon);
  };

  function HandleSubmit(event: React.FormEvent<HTMLFormElement>): void {
    event.preventDefault();

    const result = postSchema.safeParse({
      title,
      content,
    });
    if (!result.success || !selectedAccount?.address) return;

    // TODO: Implement check for minimum balance required to create a post

    createPost({
      title,
      content,
      userKey: selectedAccount.address,
      isAnonymous: isAnon,
      categoryId: selectedCategory?.id ?? 1,
    });
  }

  const handleCleanStates = () => {
    setTitle("");
    setContent("");
    setIsAnon(false);
    setSelectedCategory(null);
    setEditMode(true);
  };
  return (
    <form onSubmit={HandleSubmit}>
      <div className="mt-4 flex flex-col gap-4">
        <div className="flex justify-between">
          <div className="flex gap-2">
            <button
              className={`border px-4 py-1 ${editMode ? "border-green-500 bg-green-500/5 text-green-500" : "border-gray-500 text-gray-400"} hover:border-green-600 hover:bg-green-600/5 hover:text-green-600`}
              onClick={toggleEditMode}
              type="button"
            >
              Edit
            </button>
            <button
              className={`border px-4 py-1 ${!editMode ? "border-green-500 bg-green-500/5 text-green-500" : "border-gray-500 text-gray-400"} hover:border-green-600 hover:bg-green-600/5 hover:text-green-600`}
              onClick={toggleEditMode}
              type="button"
            >
              Preview
            </button>
          </div>
          <div className="flex items-center">
            <CategoriesSelector
              categories={categories}
              onCategoryChange={handleCategoryChange}
              selectedCategory={selectedCategory}
              defaultCategoryName="Select post category"
            />
          </div>
        </div>
        <div className="flex flex-col">
          {/* TODO: Take off this nested ternary statement */}
          {editMode ? (
            <div className="flex flex-col gap-3">
              <input
                className="w-full bg-white/10 p-3 text-white"
                onChange={(e) => {
                  setTitle(e.target.value);
                }}
                placeholder="Your post title here..."
                type="text"
                value={title}
              />
              <textarea
                className="w-full bg-white/10 p-3 text-white"
                onChange={(e) => {
                  setContent(e.target.value);
                }}
                placeholder="here... (Markdown supported / HTML tags are not supported)"
                rows={5}
                value={content}
              />
            </div>
          ) : (
            <div className="py-10">
              {content ? (
                <MarkdownPreview
                  className={`${cairo.className} max-h-[40vh] overflow-auto`}
                  source={`# ${title}\n${content}`}
                  style={{
                    backgroundColor: "transparent",
                    color: "white",
                  }}
                />
              ) : (
                "Nothing to preview"
              )}
            </div>
          )}
        </div>
        {editMode && (
          <div className="mb-6 flex items-center space-x-2">
            <Checkbox
              className="border-green-500"
              id="anonymous"
              onCheckedChange={handleIsAnonCheckbox}
              checked={isAnon}
            />
            <label
              htmlFor="anonymous"
              className="cursor-pointer text-sm font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Post anonymously
            </label>
          </div>
        )}

        <div className="flex flex-col gap-1">
          <button
            className="flex w-full justify-center text-nowrap border border-green-500 bg-green-600/5 px-6 py-2.5 font-semibold text-green-500 transition duration-200 hover:border-green-400 hover:bg-green-500/15 disabled:cursor-not-allowed disabled:border-gray-600/50 disabled:bg-transparent disabled:text-gray-600/50 disabled:hover:bg-transparent"
            disabled={
              !isAccountConnected || !title || !content || !selectedAccount
            }
            type="submit"
          >
            {isPending ? "Uploading..." : "Submit post"}
          </button>
        </div>
      </div>
    </form>
  );
};
