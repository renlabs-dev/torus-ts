"use client";

import { useCallback, useState } from "react";
import { z } from "zod";

import { toast } from "@torus-ts/providers/use-toast";
import { useTorus } from "@torus-ts/torus-provider";
import { Checkbox } from "@torus-ts/ui";

import type { Category } from "./filters";
import { api } from "~/trpc/react";
import { CategoriesSelector } from "./filters";

interface FormErrors {
  title?: string | null;
  href?: string | null;
}

interface CreatePostProps {
  categories: Category[];
  handleModal: () => void;
}

export const CreateExternalPost: React.FC<CreatePostProps> = (props) => {
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
  const [href, setHref] = useState("");
  const [error, setError] = useState<FormErrors>({
    title: null,
    href: null,
  });

  const [isAnon, setIsAnon] = useState(false);

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
    setError({});

    const postSchema = z.object({
      title: z.string().min(1, "Title is required"),
      href: z
        .string()
        .url(
          `Your URL must have the following format "https://www.example.com"`,
        )
        .min(1, "External post URL is required"),
    });

    const result = postSchema.safeParse({
      title,
      href,
    });

    if (!result.success) {
      const fieldErrors: FormErrors = {};

      result.error.errors.forEach((err) => {
        if (err.path.length > 0) {
          const fieldName = err.path[0] as keyof FormErrors;
          fieldErrors[fieldName] = err.message;
        }
      });

      setError(fieldErrors);
      return;
    }

    if (!selectedAccount?.address) return;

    createPost({
      title,
      href,
      userKey: selectedAccount.address,
      isAnonymous: isAnon,
      categoryId: selectedCategory?.id ?? 1,
    });
  }

  const handleCleanStates = () => {
    setTitle("");
    setHref("");
    setIsAnon(false);
    setSelectedCategory(null);
  };

  return (
    <form onSubmit={HandleSubmit}>
      <div className="mt-4 flex flex-col gap-4">
        <div className="flex justify-between">
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
          <div className="flex flex-col gap-3">
            <input
              className="w-full bg-white/10 p-3 text-white"
              onChange={(e) => {
                setTitle(e.target.value);
              }}
              placeholder="Your external post title here..."
              type="text"
              min={1}
              value={title}
            />
            {error.title && <p className="text-red-400">{error.title}</p>}
            <input
              className="w-full bg-white/10 p-3 text-white"
              onChange={(e) => {
                setHref(e.target.value);
              }}
              placeholder="https://example.com"
              value={href}
            />
            {error.href && <p className="text-red-400">{error.href}</p>}
          </div>
        </div>
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

        <div className="flex flex-col gap-1">
          <button
            className="flex w-full justify-center text-nowrap border border-green-500 bg-green-600/5 px-6 py-2.5 font-semibold text-green-500 transition duration-200 hover:border-green-400 hover:bg-green-500/15 disabled:cursor-not-allowed disabled:border-gray-600/50 disabled:bg-transparent disabled:text-gray-600/50 disabled:hover:bg-transparent"
            disabled={
              !isAccountConnected ||
              isPending ||
              !title ||
              !href ||
              !selectedAccount
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
