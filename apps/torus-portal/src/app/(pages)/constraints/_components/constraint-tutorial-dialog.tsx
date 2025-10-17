"use client";

import { Badge } from "@torus-ts/ui/components/badge";
import { Button } from "@torus-ts/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@torus-ts/ui/components/dialog";
import { ScrollArea } from "@torus-ts/ui/components/scroll-area";
import { HelpCircle, Lightbulb, Network, Settings } from "lucide-react";
import { useState } from "react";

export function ConstraintTutorialDialog() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="shadow-lg">
          <HelpCircle className="mr-1 h-4 w-4" />
          Constraints Tutorial
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[80vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Lightbulb className="h-6 w-6" />
            Constraint Node Flow Tutorial
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-8 py-4 pr-4">
            {/* Overview Section */}
            <section className="space-y-4">
              <h3 className="flex items-center gap-2 text-xl font-semibold">
                <Network className="h-5 w-5" />
                What are Constraints?
              </h3>
              <div className="bg-accent rounded-lg border p-4">
                <div className="text-sm leading-relaxed">
                  Constraints are conditional rules that govern when and how
                  emission permissions can be executed. They act as programmable
                  logic gates that must evaluate to{" "}
                  <Badge variant="secondary">true</Badge> before a permission
                  can distribute emissions to target accounts.
                </div>
              </div>
            </section>

            {/* How It Works Section */}
            <section className="space-y-4">
              <h3 className="flex items-center gap-2 text-xl font-semibold">
                <Settings className="h-5 w-5" />
                How the Node Flow Works
              </h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-3">
                  <h4 className="font-medium text-green-400">Visual Builder</h4>
                  <ul className="text-muted-foreground space-y-2 text-sm">
                    <li>• Drag and connect nodes to build logic</li>
                    <li>• Real-time visual feedback</li>
                    <li>• Automatic layout organization</li>
                    <li>• No coding required</li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <h4 className="font-medium text-blue-400">Live Validation</h4>
                  <ul className="text-muted-foreground space-y-2 text-sm">
                    <li>• Instant constraint validation</li>
                    <li>• Type checking on connections</li>
                    <li>• Error highlighting</li>
                    <li>• Preview constraint output</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Node Types Section */}
            <section className="space-y-4">
              <h3 className="text-xl font-semibold">Constraint Node Types</h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-lg border p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <div className="h-3 w-3 rounded bg-green-500"></div>
                    <h4 className="font-medium">Boolean Nodes</h4>
                  </div>
                  <p className="text-muted-foreground mb-3 text-sm">
                    Logical operations that combine multiple conditions
                  </p>
                  <div className="flex flex-wrap items-end gap-2 space-y-2">
                    <Badge variant="secondary">AND</Badge>
                    <Badge variant="secondary">OR</Badge>
                    <Badge variant="secondary">NOT</Badge>
                  </div>
                </div>

                <div className="rounded-lg border p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <div className="h-3 w-3 rounded bg-blue-500"></div>
                    <h4 className="font-medium">Number Nodes</h4>
                  </div>
                  <p className="text-muted-foreground mb-3 text-sm">
                    Numerical comparisons and calculations
                  </p>
                  <div className="flex flex-wrap items-end gap-2 space-y-2">
                    <Badge variant="secondary">Greater Than</Badge>
                    <Badge variant="secondary">Less Than</Badge>
                    <Badge variant="secondary">Equal To</Badge>
                  </div>
                </div>

                <div className="rounded-lg border p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <div className="h-3 w-3 rounded bg-purple-500"></div>
                    <h4 className="font-medium">Permission Node</h4>
                  </div>
                  <p className="text-muted-foreground mb-3 text-sm">
                    Creates a link between your selected permission and the
                    constraint you are building
                  </p>
                  <div className="flex flex-wrap items-end gap-2 space-y-2">
                    <Badge variant="secondary">Permission ID</Badge>
                  </div>
                </div>

                <div className="rounded-lg border p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <div className="h-3 w-3 rounded bg-orange-500"></div>
                    <h4 className="font-medium">Base Nodes</h4>
                  </div>
                  <p className="text-muted-foreground mb-3 text-sm">
                    Foundation nodes for constraint structure
                  </p>
                  <div className="flex flex-wrap items-end gap-2 space-y-2">
                    <Badge variant="secondary">Root Boolean</Badge>
                    <Badge variant="secondary">Input Values</Badge>
                    <Badge variant="secondary">Constants</Badge>
                  </div>
                </div>
              </div>
            </section>

            {/* Common Patterns Section */}
            <section className="space-y-4">
              <h3 className="text-xl font-semibold">
                Common Constraint Patterns
              </h3>
              <div className="space-y-4">
                <div className="bg-accent rounded-lg p-4">
                  <h4 className="mb-2 font-medium">Time-based Constraints</h4>
                  <p className="text-muted-foreground text-sm">
                    Restrict execution to specific time periods or after certain
                    blocks
                  </p>
                  <code className="bg-border mt-2 block rounded px-2 py-1 text-xs">
                    block_number &gt; 1000000 AND day_of_week = "Monday"
                  </code>
                </div>

                <div className="bg-accent rounded-lg p-4">
                  <h4 className="mb-2 font-medium">Usage Limits</h4>
                  <p className="text-muted-foreground text-sm">
                    Limit how many times a permission can be executed
                  </p>
                  <code className="bg-border mt-2 block rounded px-2 py-1 text-xs">
                    execution_count &lt; 10
                  </code>
                </div>

                <div className="bg-accent rounded-lg p-4">
                  <h4 className="mb-2 font-medium">Conditional Logic</h4>
                  <p className="text-muted-foreground text-sm">
                    Complex conditions combining multiple factors
                  </p>
                  <code className="bg-border mt-2 block rounded px-2 py-1 text-xs">
                    (balance &gt; 1000 AND execution_count &lt; 5) OR is_weekend
                    = true
                  </code>
                </div>
              </div>
            </section>

            {/* Step by Step Guide */}
            <section className="space-y-4">
              <h3 className="text-xl font-semibold">Step-by-Step Guide</h3>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-500 text-sm font-medium text-white">
                    1
                  </div>
                  <div>
                    <h4 className="font-medium">Select a Permission</h4>
                    <p className="text-muted-foreground text-sm">
                      Choose the stream permission you want to add constraints
                      to from the dropdown
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-500 text-sm font-medium text-white">
                    2
                  </div>
                  <div>
                    <h4 className="font-medium">Build Your Logic</h4>
                    <p className="text-muted-foreground text-sm">
                      Connect nodes by dragging from output ports to input
                      ports. Start with the root boolean node
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-500 text-sm font-medium text-white">
                    3
                  </div>
                  <div>
                    <h4 className="font-medium">Test with Examples</h4>
                    <p className="text-muted-foreground text-sm">
                      Load pre-built examples to understand common patterns and
                      modify them for your needs
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-500 text-sm font-medium text-white">
                    4
                  </div>
                  <div>
                    <h4 className="font-medium">Create Constraint</h4>
                    <p className="text-muted-foreground text-sm">
                      Once your logic is complete, click "Create This
                      Constraint" to deploy it to the blockchain
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Tips Section */}
            <section className="space-y-4">
              <h3 className="text-xl font-semibold">Pro Tips</h3>
              <div className="rounded-lg border border-yellow-800 bg-yellow-950 p-4">
                <ul className="space-y-2 text-sm">
                  <li>
                    • Start simple - build basic constraints first, then add
                    complexity
                  </li>
                  <li>• Use examples as templates for common use cases</li>
                  <li>
                    • Test your logic thoroughly before creating the constraint
                  </li>
                  <li>
                    • Remember: constraints must evaluate to TRUE for execution
                    to proceed
                  </li>
                  <li>
                    • You can combine multiple constraint types for
                    sophisticated logic
                  </li>
                </ul>
              </div>
            </section>
          </div>
        </ScrollArea>

        <div className="flex w-full justify-end border-t pt-4">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setIsOpen(false)}
          >
            Got it, let's build!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
