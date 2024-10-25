import React from "react";
import { ArrowPathIcon } from "@heroicons/react/16/solid";

export default function Loader() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center lg:h-auto">
      <h1 className="text-2xl text-white">Loading...</h1>
      <ArrowPathIcon className="ml-2 animate-spin" color="#FFF" width={20} />
    </div>
  );
}
