### Project structure

- `<rootDir>/types/`: Global TypeScript type definitions and external library declarations.
- `<rootDir>/src/index.ts`: Main entry point of the application.
- `<rootDir>/src/env.ts`: Environment variables configuration and validation.
- `<rootDir>/src/setup.ts`: Initial project setup and configuration logic.
- `<rootDir>/src/opentelemetry.ts`: OpenTelemetry instrumentation and observability setup.
- `<rootDir>/src/models/`: Core domain models and business logic:
    - `bash.ts`: Logic for executing and managing bash commands.
    - `file.ts`: File system abstractions and operations.
    - `project.ts`: Project-level models and configurations.
    - `content/`: Content processing and factory logic.
    - `llm/`: Large Language Model integration, including providers, tools, and routing.
    - `pipeline/`: Execution pipeline logic, including steps, context, and session management.
- `<rootDir>/src/utils/`: General-purpose utility functions:
    - `common.ts`: Shared utility functions.
    - `meta.ts`: Metadata handling utilities.
    - `stdout.ts`: Standard output formatting and handling.
- `<rootDir>/test/`: Test suites and testing utilities.
- `<rootDir>/coverage/`: Test coverage reports (e.g., Cobertura XML).
