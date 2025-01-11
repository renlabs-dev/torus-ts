"use client";

import {
  Dialog,
  DialogTrigger,
  Button,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  links,
} from "@torus-ts/ui";

import Link from "next/link";

export const tutorialData = [
  <Button asChild variant="link" className="h-5 p-0">
    <Link
      className="text-blue-500"
      target="_blank"
      href={"https://www.youtube.com/watch?v=3JDQFYg0u_A"}
    >
      Install and setup Subwallet
    </Link>
  </Button>,
  <Button asChild variant="link" className="h-5 p-0">
    <Link
      className="text-blue-500"
      target="_blank"
      href={"https://www.youtube.com/watch?v=x63AMYG5uGc"}
    >
      Install and setup PolkadotJS
    </Link>
  </Button>,
  <Button asChild variant="link" className="h-5 p-0">
    <Link
      className="text-blue-500"
      target="_blank"
      href={"https://www.youtube.com/watch?v=l_AQ5KspoDo"}
    >
      Torus Bridge tutorial
    </Link>
  </Button>,
  <p>
    More information on our{" "}
    <Button asChild variant="link" className="h-5 p-0">
      <Link target="_blank" href={links.docs} className="text-blue-500">
        Docs
      </Link>
    </Button>
  </p>,
];

export function GuideDialog() {
  return (
    <Dialog>
      <Button asChild variant="link" className="h-5 w-fit p-0">
        <DialogTrigger>Feeling lost? Get help here!</DialogTrigger>
      </Button>
      <DialogContent className="max-h-[100vh] overflow-auto sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>Feeling Lost?</DialogTitle>
          <DialogDescription>
            We have some links that may be helpful to you.
          </DialogDescription>
        </DialogHeader>
        <div>
          <ul className="flex list-disc flex-col gap-1.5 pl-3 text-sm">
            {tutorialData.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
}
