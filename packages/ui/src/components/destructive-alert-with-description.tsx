"use client";

import { Ban } from "lucide-react";

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@torus-ts/ui/components/alert";

interface DestructiveAlertWithDescriptionProps {
  title: string;
  description: string;
}

export function DestructiveAlertWithDescription(
  props: DestructiveAlertWithDescriptionProps,
) {
  return (
    <Alert variant="destructive" className="animate-delay animate-fade">
      <Ban className="h-4 w-4" />
      <AlertTitle>{props.title}</AlertTitle>
      <AlertDescription>{props.description}</AlertDescription>
    </Alert>
  );
}
