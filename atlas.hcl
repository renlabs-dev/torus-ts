// npx drizzle-kit export --dialect postgresql --schema packages/db/src/schema.ts
data "external_schema" "drizzle" {
    program = [ 
        "npx",
        "drizzle-kit",
        "export",
        "--dialect",
        "postgresql",
        "--schema",
        "packages/db/src/schema.ts",
    ]
}

env "local" {
    dev = "docker://postgres/16/dev"
    schema {
        src = data.external_schema.drizzle.url
    }
    migration {
        dir = "file://atlas/migrations"
    }
    vars = {
        search_path = "public"
    }
    exclude = ["drizzle"]
}
