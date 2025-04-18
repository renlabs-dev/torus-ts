"use client";

import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@torus-ts/ui/components/accordion";
import { Button } from "@torus-ts/ui/components/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@torus-ts/ui/components/card";
import { Input } from "@torus-ts/ui/components/input";
import { Label } from "@torus-ts/ui/components/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@torus-ts/ui/components/select";
import { useState } from "react";

// Parameter interface
interface QueryParameter {
  name: string;
  type: string;
  description: string;
}

// Query interface
interface QueryDefinition {
  description: string;
  parameters: QueryParameter[];
}

// Placeholder data structure to simulate API schema
const QUERY_SCHEMA = {
  query: {
    torus0: {
      burn: {
        description: "Query burn information",
        parameters: [
          { name: "account", type: "string", description: "Account address" },
        ],
      },
      transfer: {
        description: "Query transfer information",
        parameters: [
          { name: "from", type: "string", description: "Sender address" },
          { name: "to", type: "string", description: "Recipient address" },
        ],
      },
    },
    system: {
      account: {
        description: "Get account information",
        parameters: [
          { name: "account", type: "string", description: "Account address" },
        ],
      },
    },
  },
  tx: {
    torus0: {
      transfer: {
        description: "Create a transfer transaction",
        parameters: [
          { name: "to", type: "string", description: "Recipient address" },
          { name: "amount", type: "number", description: "Token amount" },
        ],
      },
    },
  },
};

type QueryType = keyof typeof QUERY_SCHEMA;
type PalletType<Q extends QueryType> = keyof (typeof QUERY_SCHEMA)[Q];

export function QueryCard() {
  const [queryType, setQueryType] = useState<QueryType | null>(null);
  const [pallet, setPallet] = useState<string | null>(null);
  const [palletItem, setPalletItem] = useState<string | null>(null);
  const [parameters, setParameters] = useState<Record<string, string>>({});
  const [results, setResults] = useState<string | null>(null);

  // Reset dependent fields when a parent field changes
  const handleQueryTypeChange = (value: QueryType) => {
    setQueryType(value);
    setPallet(null);
    setPalletItem(null);
    setParameters({});
    setResults(null);
  };

  const handlePalletChange = (value: string) => {
    setPallet(value);
    setPalletItem(null);
    setParameters({});
    setResults(null);
  };

  const handlePalletItemChange = (value: string) => {
    setPalletItem(value);
    setParameters({});
    setResults(null);
  };

  const handleParameterChange = (paramName: string, value: string) => {
    setParameters((prev) => ({
      ...prev,
      [paramName]: value,
    }));
  };

  const getAvailablePallets = () => {
    if (!queryType) return [];
    return Object.keys(QUERY_SCHEMA[queryType]);
  };

  const getAvailablePalletItems = () => {
    if (!queryType || !pallet) return [];
    const selectedPallet =
      QUERY_SCHEMA[queryType][pallet as PalletType<typeof queryType>];
    return Object.keys(selectedPallet);
  };

  const getRequiredParameters = (): QueryParameter[] => {
    if (!queryType || !pallet || !palletItem) return [];

    try {
      // Safety checks
      const selectedQueryType = queryType;
      const selectedPallet = pallet as PalletType<typeof selectedQueryType>;

      const palletItems = QUERY_SCHEMA[selectedQueryType][selectedPallet];

      const selectedQuery = (palletItems as Record<string, QueryDefinition>)[
        palletItem
      ];
      if (!selectedQuery) return [];

      return selectedQuery.parameters;
    } catch (error) {
      console.error("Error getting parameters:", error);
      return [];
    }
  };

  const executeQuery = () => {
    // In a real application, this would make an API call
    // For now, just simulate a response
    const queryPath = `api.${queryType}.${pallet}.${palletItem}`;

    const result = {
      query: queryPath,
      parameters: parameters,
      timestamp: new Date().toISOString(),
      result: "Simulated query result data",
    };

    setResults(JSON.stringify(result, null, 2));
  };

  const isQueryComplete = queryType && pallet && palletItem;
  const areParametersComplete = getRequiredParameters().every(
    (param: QueryParameter) => parameters[param.name],
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Torus Query Builder</CardTitle>
          <CardDescription>
            Build and execute queries against the Torus blockchain
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex w-full gap-3">
            <div className="w-full">
              <Label htmlFor="query-type">Query Type</Label>
              <Select
                onValueChange={(value) =>
                  handleQueryTypeChange(value as QueryType)
                }
                value={queryType ?? undefined}
              >
                <SelectTrigger id="query-type">
                  <SelectValue placeholder="Select query type" />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(QUERY_SCHEMA).map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="w-full">
              <Label htmlFor="pallet-type">Pallet</Label>
              <Select
                onValueChange={handlePalletChange}
                value={pallet ?? undefined}
                disabled={!queryType}
              >
                <SelectTrigger id="pallet-type">
                  <SelectValue placeholder="Select pallet" />
                </SelectTrigger>
                <SelectContent>
                  {getAvailablePallets().map((palletName) => (
                    <SelectItem key={palletName} value={palletName}>
                      {palletName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="w-full">
              <Label htmlFor="pallet-item">Pallet Item</Label>
              <Select
                onValueChange={handlePalletItemChange}
                value={palletItem ?? undefined}
                disabled={!queryType || !pallet}
              >
                <SelectTrigger id="pallet-item">
                  <SelectValue placeholder="Select pallet item" />
                </SelectTrigger>
                <SelectContent>
                  {getAvailablePalletItems().map((itemName) => (
                    <SelectItem key={itemName} value={itemName}>
                      {itemName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="parameters">
              <AccordionTrigger>Query Parameters</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 py-4">
                  {getRequiredParameters().map((param: QueryParameter) => (
                    <div key={param.name} className="space-y-2">
                      <Label htmlFor={`param-${param.name}`}>
                        {param.name} ({param.description})
                      </Label>
                      <Input
                        id={`param-${param.name}`}
                        type={param.type === "number" ? "number" : "text"}
                        placeholder={param.description}
                        value={parameters[param.name] ?? ""}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          handleParameterChange(param.name, e.target.value)
                        }
                      />
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
        <CardFooter>
          <Button
            onClick={executeQuery}
            disabled={!isQueryComplete || !areParametersComplete}
          >
            Execute Query
          </Button>
        </CardFooter>
      </Card>

      {/* Results Card */}
      {results && (
        <Card>
          <CardHeader>
            <CardTitle>Query Results</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="p-4 bg-accent rounded-md overflow-auto max-h-96">
              {results}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
