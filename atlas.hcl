data "external_schema" "drizzle" {
    program = [ 
    "npx",
    "drizzle-kit",
    "export",
    ]
}

env "local" {
dev = "docker://postgres/17/dev?search_path=public"
schema {
    src = data.external_schema.drizzle.url
}
migration {
    dir = "file://atlas/migrations"
}
exclude = ["drizzle"]
}