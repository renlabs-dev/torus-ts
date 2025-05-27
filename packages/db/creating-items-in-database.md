# Creating Items in the Database with Drizzle Schema, Requesting through tRPC, and Frontend Integration

This documentation covers how to create items in the database using the Drizzle
schema, request them through tRPC, and create GET and POST methods for frontend
interaction.

If you get any TypeScript errors, make sure to delete the `node_modules` and
cache related folders and run `pnpm i` again.

## Schema Definition

First, we define the schema for the module in `packages/db/src/schema.ts`.

```ts
// Test Table
export const moduleTest = createTable("module_test", {
  id: serial("id").primaryKey(),
  weight: integer("weight").default(0),
  createdAt: timestamp("created_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

// Schema for inserting a new module
export const moduleTestPostSchema = createInsertSchema(moduleTest, {
  weight: z.number().int().min(0).max(100),
}).omit({
  id: true,
  createdAt: true,
});
```

Remember to run `pnpm db:push` to push the schema to the database.

## API Router

Next, we define the API routes using tRPC, in this case since we are creating a new module, we will create a new router file in `packages/api/src/router/module-test.ts`.

```ts
export const moduleTestRouter = {
  // Get the latest module
  getLatest: publicProcedure.query(({ ctx }) => {
    return ctx.db.query.moduleTest.findFirst({
      orderBy: (weight, { desc }) => [desc(weight.createdAt)],
    });
  }),
  // Post a new module
  create: publicProcedure
    .input(moduleTestPostSchema)
    .mutation(async ({ ctx, input }) => {
      // simulate a slow db call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      await ctx.db.insert(moduleTest).values({
        weight: input.weight,
      });
    }),
} satisfies TRPCRouterRecord;
```

## Root API Router

We then combine the individual routers into a root router in `packages/api/src/root.ts`.

```ts
export const appRouter = createTRPCRouter({
  moduleTest: moduleTestRouter, // We add the moduleTestRouter here
  module: moduleRouter,
});
```

## Frontend Integration

### Main Page Component

We create the main page component in `apps/torus-allocator/src/app/page.tsx`.

```ts
export default function Page() {
  return <CrudShowcase />;
}

async function CrudShowcase() {
  const latestModule = await api.moduleTest.getLatest();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center text-white">
      {latestModule ? (
        <>
          <p className="truncate">Most recent module:</p>
          <p className="truncate">ID: {latestModule.id}</p>
          <p className="truncate">WEIGHT: {latestModule.weight}</p>
        </>
      ) : (
        <p>No modules found</p>
      )}

      <CreateWeight />
    </main>
  );
}
```

### Create Weight Component

Lastly, we create a form component for adding new items in
`apps/torus-allocator/src/app/components/create-module-test.tsx`.

```ts
export function CreateWeight() {
  const router = useRouter();
  const [weight, setWeight] = useState<number>(0);

  const createWeight = api.moduleTest.create.useMutation({
    onSuccess: () => {
      router.refresh();
      setWeight(0);
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        createWeight.mutate({ weight });
      }}
      className="flex flex-col gap-2"
    >
      <input
        type="number"
        placeholder="Weight"
        value={weight}
        onChange={(e) => setWeight(Number(e.target.value))}
        className="w-full bg-gray-600/50 px-4 py-2 text-white"
      />
      <button
        type="submit"
        className=" bg-white/10 px-10 py-3 font-semibold transition hover:bg-white/20"
        disabled={createWeight.isPending}
      >
        {createWeight.isPending ? "Submitting..." : "Submit"}
      </button>
    </form>
  );
}
```

## Summary

1. **Define the Schema**: Use Drizzle schema to define the data structure and validation.
2. **Create API Routes**: Set up tRPC routes for creating and retrieving items.
3. **Combine Routers**: Integrate individual routers into a root router.
4. **Frontend Integration**: Create components to display and add items via the API.

This setup allows seamless creation and retrieval of items from the database, with frontend components interacting with the API through tRPC.
