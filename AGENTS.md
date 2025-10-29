# Repository Guidelines

## Project Structure & Module Organization
- `src/SQLBox` — class library root.
  - `Entities/` data contracts (e.g., `AskOptions.cs`, `TableDoc.cs`).
  - `Facade/` high‑level API (`SqlGen`) and builder configuration.
  - `Infrastructure/` core abstractions, defaults, and providers
    (`Defaults/`, `Providers/` for MSSQL, MySQL, PostgreSQL, Sqlite, ODBC; optional `ExtensionsAI/`).
  - `Prompts/` reserved for prompt templates.
- Tests are not yet present; add under `tests/SQLBox.Tests/`.

## Build, Test, and Development Commands
- Requires .NET 10 SDK (RC) and `dotnet` CLI.
- Restore and build solution: `dotnet restore` then `dotnet build SQLBox.sln -c Debug`.
- Run tests (when added): `dotnet test -c Debug`.
- Optional: enable Extensions.AI adapters (define symbol):
  `dotnet build src/SQLBox/SQLBox.csproj -c Release -p:DefineConstants=EXTENSIONS_AI`.
- Pack NuGet (library): `dotnet pack src/SQLBox/SQLBox.csproj -c Release -o ./.nupkg`.

## Coding Style & Naming Conventions
- C# with file‑scoped namespaces; nullable enabled; implicit usings.
- Indentation: 4 spaces; braces on same line as declaration.
- Naming: PascalCase for types/methods/properties, camelCase for locals/params,
  private fields `_camelCase`, interfaces `I*`, async methods `*Async`.
- DTOs use `record` where appropriate; prefer `sealed` where possible.
- Run formatter before PR: `dotnet format src/SQLBox/SQLBox.csproj`.

## Testing Guidelines
- Framework: xUnit. Place tests in `tests/SQLBox.Tests`.
- File names `*Tests.cs`; class tests `ClassNameTests`.
- Use fakes for `IDbConnectionFactory`; avoid real DB in unit tests.
- Run with `dotnet test`; consider coverage via `coverlet.collector` if needed.

## Commit & Pull Request Guidelines
- Commits: imperative subject (≤72 chars), meaningful body when needed. Conventional Commits welcome (`feat:`, `fix:`, `docs:`…).
- PRs must include: clear description, linked issues, test coverage for changes, and notes on SQL/dialect impact. Add examples (input → generated SQL) when touching `Facade/` or validators.

## Security & Configuration Tips
- Do not commit secrets/connection strings; use env vars or user‑secrets.
- `ExecutorSandbox` is SELECT/EXPLAIN‑only; keep `AskOptions.AllowWrite = false` unless intentionally enabled with strict safeguards.
- When enabling `ExtensionsAI`, add the `Microsoft.Extensions.AI` package and define `EXTENSIONS_AI`.

