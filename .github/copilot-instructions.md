# Copilot Instructions

## TypeScript: No unnecessary type annotations

Omit explicit type annotations (return types, variables, etc.) when TypeScript can infer them. When a type cannot be inferred and you need to constrain a value, prefer `satisfies` over an explicit annotation so the literal type is preserved.

## TypeScript: Colocate types with their consumers

Define types in the file where they are used. When a type is used by multiple files, promote it to the nearest shared parent module. Avoid creating dedicated `*.types.ts` files.

## TypeScript: JSDoc for exported symbols

Exported symbols must have a JSDoc comment (enforced by `jsdoc/require-jsdoc`). For functions, write only a description and optionally `@example` blocks when they add clarity. Do not include `@param` or `@returns` tags — TypeScript already provides that information via IntelliSense.

For functions and React components, use a multi-line JSDoc block.

For React components, document each prop with a JSDoc comment on the prop's type definition (not with `@param`). Describe what the prop does; omit the type since TypeScript already provides it.

## Pre-commit check

Run `pnpm run lgtm` before committing and fix any errors.
