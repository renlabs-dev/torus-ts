data "external_schema" "drizzle_webapps" {
    program = [
        "npx",
        "drizzle-kit",
        "export",
        "--dialect",
        "postgresql",
        "--schema",
        "packages/db/src/schema/webapps.ts",
    ]
}

data "external_schema" "drizzle_prediction_swarm" {
    program = [
        "npx",
        "drizzle-kit",
        "export",
        "--dialect",
        "postgresql",
        "--schema",
        "packages/db/src/schema/prediction-swarm.ts",
    ]
}

data "external_schema" "drizzle_apostle_swarm" {
    program = [
        "npx",
        "drizzle-kit",
        "export",
        "--dialect",
        "postgresql",
        "--schema",
        "packages/db/src/schema/apostle-swarm.ts",
    ]
}

env "webapps" {
    dev = "docker://postgres/18/dev-webapps"
    schema {
        src = data.external_schema.drizzle_webapps.url
    }
    migration {
        dir = "file://atlas/migrations/webapps"
    }
    vars = {
        search_path = "public"
    }
    exclude = ["drizzle"]
}

env "prediction_swarm" {
    dev = "docker://postgres/18/dev-prediction-swarm"
    schema {
        src = data.external_schema.drizzle_prediction_swarm.url
    }
    migration {
        dir = "file://atlas/migrations/prediction_swarm"
    }
    vars = {
        search_path = "public"
    }
    exclude = ["drizzle"]
}

env "apostle_swarm" {
    dev = "docker://postgres/18/dev-apostle-swarm"
    schema {
        src = data.external_schema.drizzle_apostle_swarm.url
    }
    migration {
        dir = "file://atlas/migrations/apostle_swarm"
    }
    vars = {
        search_path = "public"
    }
    exclude = ["drizzle"]
}

env "local" {
    dev = "postgres://postgres:postgres@localhost:5432/torus-ts-db?sslmode=disable"
    schema {
        src = data.external_schema.drizzle_apostle_swarm.url
    }
    migration {
        dir = "file://atlas/migrations/apostle_swarm"
    }
    vars = {
        search_path = "public"
    }
    exclude = ["drizzle"]
}

lint {
  non_linear {
    error = true
  }
}
