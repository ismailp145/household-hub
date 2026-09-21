---
name: Generated contract declarations
description: How to recover when generated OpenAPI source is newer than workspace declaration output.
---

After changing the OpenAPI contract and running code generation, force the TypeScript project build if app typechecks still report the previous generated request or response shape.

**Why:** Incremental project references can consider declaration outputs current even when Orval has replaced generated source, leaving consumers on stale `dist` types.

**How to apply:** When generated source contains a field but a consuming package cannot see it, run the codegen command, then `pnpm exec tsc --build --force` before debugging application code.