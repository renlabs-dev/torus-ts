import Link from "next/link";
import {
  ArrowLongLeftIcon,
  ArrowLongRightIcon,
} from "@heroicons/react/20/solid";

import { DocSidebar } from "../../components/doc-sidebar";
import { tutorials } from "./tutorials";

export default function Docs({ params }: { params: { slug: string } }) {
  const prefix = `/docs`;

  const activeTutorial = tutorials.findIndex(
    (tutorial) => tutorial.tutorialId === params.slug[0],
  );

  if (!tutorials[activeTutorial]) {
    return null;
  }

  const activeContent = tutorials[activeTutorial].contents.findIndex(
    (content) => content.href === params.slug[1],
  );

  function getPreviousContent() {
    if (tutorials[activeTutorial]?.contents[activeContent - 1])
      return {
        id: tutorials[activeTutorial]?.tutorialId,
        content: tutorials[activeTutorial].contents[activeContent - 1],
      };
    if (activeTutorial > 0) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const contentLength = tutorials[activeTutorial - 1]!.contents.length;

      return {
        id: tutorials[activeTutorial - 1]?.tutorialId,
        content: tutorials[activeTutorial - 1]?.contents[contentLength - 1],
      };
    }
    return null;
  }

  function getNextContent() {
    if (tutorials[activeTutorial]?.contents[activeContent + 1])
      return {
        id: tutorials[activeTutorial]?.tutorialId,
        content: tutorials[activeTutorial]?.contents[activeContent + 1],
      };
    if (tutorials[activeTutorial + 1]) {
      return {
        id: tutorials[activeTutorial + 1]?.tutorialId,
        content: tutorials[activeTutorial + 1]?.contents[0],
      };
    }
    return null;
  }

  const previousContent = getPreviousContent();
  const nextContent = getNextContent();
  return (
    <section className="mx-auto h-max w-full">
      <DocSidebar
        activeContent={activeContent}
        activeTutorial={activeTutorial}
        params={params}
        prefix={prefix}
      />

      <div className="flex h-[calc(100svh-118px)] w-full animate-fade-up flex-col items-center overflow-y-scroll pt-6 md:pt-10 lg:h-[calc(100svh-123px)] lg:pl-[19.5rem]">
        <div className="prose prose-invert flex w-full max-w-[100%] flex-col px-8 sm:max-w-[80%] xl:max-w-[70%] 2xl:max-w-screen-2xl">
          <div className="mb-6 flex w-full">
            <Link
              className="text-titleDark flex rounded-xl text-center text-sm font-medium no-underline hover:underline"
              href={`https://github.com/renlabs-dev/commune-page/blob/main/app/docs/%5B...slug%5D/tutorials/${params.slug[1]}.mdx`}
              target="_blank"
            >
              <span>Edit this doc</span>
            </Link>
          </div>

          {Boolean(tutorials[activeTutorial].contents[activeContent]) &&
            tutorials[activeTutorial].contents[activeContent]?.component}

          <div className="mb-10 mt-20 flex w-full max-w-[100%] justify-between text-base">
            {Boolean(previousContent) && (
              <Link
                className="flex flex-col items-start rounded-2xl p-2 text-left text-gray-400 transition ease-in-out hover:border-gray-300 hover:text-gray-200"
                href={`${prefix}/${previousContent?.id}/${previousContent?.content?.href}`}
              >
                <span className="text-white">
                  {previousContent?.content?.name}
                </span>
                <span className="text-titleDark flex text-xs">
                  <ArrowLongLeftIcon className="mr-2" width={14} />
                  Previous
                </span>
              </Link>
            )}
            {Boolean(nextContent) && (
              <Link
                className="ml-auto flex flex-col items-end rounded-2xl p-2 text-end text-gray-400 transition ease-in-out hover:border-gray-300 hover:text-gray-200"
                href={`${prefix}/${nextContent?.id}/${nextContent?.content?.href}`}
              >
                <span className="text-white">{nextContent?.content?.name}</span>
                <span className="text-titleDark flex text-xs">
                  Next
                  <ArrowLongRightIcon className="ml-2" width={14} />
                </span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
