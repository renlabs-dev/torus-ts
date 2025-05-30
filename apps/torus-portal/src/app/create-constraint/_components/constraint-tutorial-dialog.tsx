"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@torus-ts/ui/components/dialog";
import { Button } from "@torus-ts/ui/components/button";
import { Badge } from "@torus-ts/ui/components/badge";
import { HelpCircle, Lightbulb, Settings, Network } from "lucide-react";
import { ScrollArea } from "@torus-ts/ui/components/scroll-area";

export function ConstraintTutorialDialog() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="shadow-lg">
          <HelpCircle className="h-4 w-4 mr-1" />
          Constraints Tutorial
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
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
              <h3 className="text-xl font-semibold flex items-center gap-2">
                <Network className="h-5 w-5" />
                What are Constraints?
              </h3>
              <div className="bg-accent p-4 rounded-lg border">
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
              <h3 className="text-xl font-semibold flex items-center gap-2">
                <Settings className="h-5 w-5" />
                How the Node Flow Works
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="font-medium text-green-400">Visual Builder</h4>
                  <ul className="text-sm space-y-2 text-muted-foreground">
                    <li>• Drag and connect nodes to build logic</li>
                    <li>• Real-time visual feedback</li>
                    <li>• Automatic layout organization</li>
                    <li>• No coding required</li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <h4 className="font-medium text-blue-400">Live Validation</h4>
                  <ul className="text-sm space-y-2 text-muted-foreground">
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-3 h-3 rounded bg-green-500"></div>
                    <h4 className="font-medium">Boolean Nodes</h4>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Logical operations that combine multiple conditions
                  </p>
                  <div className="space-y-2 flex flex-wrap gap-2 items-end">
                    <Badge variant="secondary">AND</Badge>
                    <Badge variant="secondary">OR</Badge>
                    <Badge variant="secondary">NOT</Badge>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-3 h-3 rounded bg-blue-500"></div>
                    <h4 className="font-medium">Number Nodes</h4>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Numerical comparisons and calculations
                  </p>
                  <div className="space-y-2 flex flex-wrap gap-2 items-end">
                    <Badge variant="secondary">Greater Than</Badge>
                    <Badge variant="secondary">Less Than</Badge>
                    <Badge variant="secondary">Equal To</Badge>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-3 h-3 rounded bg-purple-500"></div>
                    <h4 className="font-medium">Permission Node</h4>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Creates a link between your selected permission and the
                    constraint you are building
                  </p>
                  <div className="space-y-2 flex flex-wrap gap-2 items-end">
                    <Badge variant="secondary">Permission ID</Badge>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-3 h-3 rounded bg-orange-500"></div>
                    <h4 className="font-medium">Base Nodes</h4>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Foundation nodes for constraint structure
                  </p>
                  <div className="space-y-2 flex flex-wrap gap-2 items-end">
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
                <div className="bg-accent p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Time-based Constraints</h4>
                  <p className="text-sm text-muted-foreground">
                    Restrict execution to specific time periods or after certain
                    blocks
                  </p>
                  <code className="text-xs bg-border px-2 py-1 rounded mt-2 block">
                    block_number &gt; 1000000 AND day_of_week = "Monday"
                  </code>
                </div>

                <div className="bg-accent p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Usage Limits</h4>
                  <p className="text-sm text-muted-foreground">
                    Limit how many times a permission can be executed
                  </p>
                  <code className="text-xs bg-border px-2 py-1 rounded mt-2 block">
                    execution_count &lt; 10
                  </code>
                </div>

                <div className="bg-accent p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Conditional Logic</h4>
                  <p className="text-sm text-muted-foreground">
                    Complex conditions combining multiple factors
                  </p>
                  <code className="text-xs bg-border px-2 py-1 rounded mt-2 block">
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
                  <div
                    className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center
                      justify-center text-sm font-medium"
                  >
                    1
                  </div>
                  <div>
                    <h4 className="font-medium">Select a Permission</h4>
                    <p className="text-sm text-muted-foreground">
                      Choose the emission permission you want to add constraints
                      to from the dropdown
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div
                    className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center
                      justify-center text-sm font-medium"
                  >
                    2
                  </div>
                  <div>
                    <h4 className="font-medium">Build Your Logic</h4>
                    <p className="text-sm text-muted-foreground">
                      Connect nodes by dragging from output ports to input
                      ports. Start with the root boolean node
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div
                    className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center
                      justify-center text-sm font-medium"
                  >
                    3
                  </div>
                  <div>
                    <h4 className="font-medium">Test with Examples</h4>
                    <p className="text-sm text-muted-foreground">
                      Load pre-built examples to understand common patterns and
                      modify them for your needs
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div
                    className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center
                      justify-center text-sm font-medium"
                  >
                    4
                  </div>
                  <div>
                    <h4 className="font-medium">Create Constraint</h4>
                    <p className="text-sm text-muted-foreground">
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
              <div className="bg-yellow-950 p-4 rounded-lg border border-yellow-800">
                <ul className="text-sm space-y-2">
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

        <div className="flex justify-end pt-4 border-t w-full">
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
