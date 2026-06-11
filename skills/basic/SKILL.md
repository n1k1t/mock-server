---
name: mock-server-basic
description: Skill for package @n1k1t/mock-server to work with basic mock server entities (server, operators, expectations, containers, forwarding, cache)
---

# Mock Server Basic Skill

Instructions for managing core mock server entities: server, operators, expectations, containers, forwarding, and cache.

## When to Use

Use this skill when you need to:
1. Initialize or configure a `MockServer` instance.
2. Create expectations to intercept and simulate HTTP/WS traffic.
3. Use operators (`$`) for complex matching and data manipulation.
4. Manage persistent data using Containers or request-scoped State.
5. Configure request forwarding with optional caching.

## Mock Server Utilities

### Expectation Operators ($)

Operators define how to match requests and transform responses:
- `$.has(location, { $path, ... })`: Checks existence at location. Supports `$value`, `$match` (minimatch), `$regExp`, and `$exec`.
- `$.set(location, { $value, ... })`: Sets a value at location.
- `$.merge(location, { $value, ... })`: Merges an object into the location.
- `$.remove(location, { $path, ... })`: Removes value at location.
- `$.and([...])`, `$.or([...])`, `$.not(...)`: Logical grouping.
- `$.if({ $condition, $then, $else })`: Conditional execution.
- `$.switch({ $cases, $default })`: Switch-case execution.
- `$.exec(fn)`: Custom logic. Returns boolean in `match` mode, modifies context in `manipulate` mode.

### Operator Locations

Common locations for operations:
- `incoming.path`, `incoming.method`, `incoming.query`, `incoming.headers`, `incoming.data`
- `outgoing.status`, `outgoing.headers`, `outgoing.data`
- `container`, `state`, `cache`, `seed`, `error`

### Operator Context

When using `$exec`, the context object (usually the second argument) provides powerful utilities and data access:

- **`context`**: The full request/response context.
  - `incoming`: Input data (immutable in match mode).
    - `path`: The request URL path.
    - `method`: HTTP method (GET, POST, etc.).
    - `query`: Object containing query parameters.
    - `headers`: Object containing request headers.
    - `data`: Parsed JSON/XML request body.
    - `raw`: Raw details of request.
      - `data`: Buffer of request data.
  - `outgoing`: Output data (target for manipulation).
    - `status`: HTTP status code.
    - `headers`: Response headers.
    - `data`: Response body object (serialized to JSON/XML).
    - `stream`: Observable for WebSocket messages.
    - `raw`: Raw details of response.
      - `data`: Buffer of response data.
  - `storage`: Interface to manage [Containers](#container-methods).
  - `container`: The currently bound container (if any).
  - `cache`: Configuration for forwarding cache.
    - `isEnabled`: Whether caching is enabled for this request.
    - `prefix`: Redis key prefix.
    - `key`: Custom cache key (string or object).
    - `ttl`: Time to live in seconds.
    - `hasRead`: (Internal) Whether cache was read.
    - `hasWritten`: (Internal) Whether cache was written.
- **`state`**: The unique [Request State](#state--seeds). Persistent only for the duration of the current request.
- **`mode`**: The execution phase: `'match'` (deciding if expectation applies) or `'manipulate'` (preparing the response).
- **`logger`**: A scoped logger for debugging (`info`, `error`, `warn`).
- **`faker`**: Full `@faker-js/faker` instance for generating mock data.
- **`_`**: Lodash utility library.
- **`d`**: Dayjs instance for date/time manipulation.
- **`rx`**: RxJS exports for advanced WebSocket stream control.

### Container Methods

Accessible via `context.storage`:
- `provide({ key, payload, ttl })`: Find or create container.
- `register({ key, payload, ttl })`: Force create/overwrite container.
- `container.assign(payload | fn)`: Shallow merge.
- `container.merge(payload | fn)`: Deep merge.
- `container.bind(key)`: Add an alias key to the container.
- `container.unbind()`: Delete the container.

## Usage Examples

### Complex Expectations with `$and`

```ts
await server.client.createExpectation(({ $ }) => ({
  schema: {
    request: $.and([
      $.has('incoming.path', { $value: '/api/user' }),
      $.has('incoming.method', { $value: 'POST' }),
      $.has('incoming.headers', '$path', 'content-type', { $value: 'application/json' }),
    ]),
    response: $.set('outgoing.data', { $value: { status: 'success' } }),
  },
}));
```

### Custom Logic with `$exec`

```ts
await server.client.createExpectation(({ $ }) => ({
  schema: {
    request: $.has('incoming.path', { $exec: (path) => path.startsWith('/api/data') }),
    response: $.set('outgoing.data', {
      $exec: (payload, { _, d, faker }) => ({
        id: faker.string.uuid(),
        timestamp: d().format(),
        values: _.range(3).map(() => _.random(1, 100)),
      }),
    }),
  },
}));

// Full control via context
await server.client.createExpectation(({ $ }) => ({
  schema: {
    request: $.exec(({ context, mode }) => mode === 'match' && context.incoming.path === '/api/custom'),
    response: $.set('outgoing.data', { $value: { status: 'custom' } }),
  },
}));
```

### Dynamic Response Manipulation

```ts
await server.client.createExpectation(({ $ }) => ({
  schema: {
    request: $.has('incoming.path', { $value: '/api/profile' }),
    response: $.set('outgoing.data', {
      $exec: (payload, { context }) => ({
        id: context.incoming.query.userId,
        debug: context.incoming.headers['x-debug'] === 'true' ? { timestamp: Date.now() } : undefined
      })
    }),
  },
}));
```

### Binary Data and Files

```ts
import { readFile } from 'fs/promises';
import { TextDecoder } from 'util';

await server.client.createExpectation(({ $ }) => ({
  schema: {
    request: $.has('incoming.path', { $value: '/api/download' }),
    response: $.and([
      $.set('outgoing.headers', '$path', 'content-type', { $value: 'application/pdf' }),
      $.set('outgoing.data', { $exec: () => readFile('./document.pdf') }),
    ]),
  },
}));

// Processing incoming raw data with specific encoding
await server.client.createExpectation(({ $ }) => ({
  schema: {
    request: $.exec(({ context }) => {
      const rawData = context.incoming.raw.data;
      if (!rawData) return false;
      const decoded = new TextDecoder('windows-1251').decode(rawData);
      return decoded.includes('привет');
    }),
    response: $.set('outgoing.data', { $value: { status: 'decoded' } }),
  },
}));
```

### XML Support

```ts
await server.client.createExpectation(({ $ }) => ({
  schema: {
    request: $.and([
      $.has('incoming.path', { $matchAnyOf: ['/api/user*'] }),
      $.exec(({ context }) => context.incoming.headers['content-type'] === 'application/xml'),
    ]),
    response: $.and([
      $.set('outgoing.headers', '$path', 'content-type', { $value: 'application/xml' }),
      $.set('outgoing.data', { $value: { user: { info: { '#text': 'John Doe', '@_id': 123 } } } }),
    ]),
  },
}));
```

### Simulating Network Errors

```ts
await server.client.createExpectation(({ $ }) => ({
  schema: {
    request: $.has('incoming.path', { $value: '/api/error' }),
    response: $.set('error', { $value: 'ECONNRESET' }),
  },
}));
```

### Disabled by Default

```ts
await server.client.createExpectation(({ $ }) => ({
  isEnabled: false,
  schema: {
    request: $.has('incoming.path', { $value: '/api/hidden' }),
    response: $.set('outgoing.data', { $value: { message: 'Activate me in GUI' } }),
  },
}));
```

### Type Safety

```ts
interface MyContext {
  incoming: { query: { userId: string } };
  outgoing: { data: { id: string; name: string } };
}

await server.client.createExpectation<MyContext>(({ $ }) => ({
  schema: {
    request: $.has('incoming.query', { $exec: (q) => q.userId === '123' }),
    response: $.set('outgoing.data', { $exec: (p, { faker }) => ({ id: '123', name: faker.person.fullName() }) }),
  },
}));
```

### WebSocket Support

```ts
await server.client.createExpectation(({ $, utils }) => ({
  transports: utils.transports(['ws']),
  schema: {
    request: $.has('incoming.path', { $value: '/ws/updates' }),
    response: $.set('outgoing.stream', {
      $exec: (s, { rx }) => rx.from([{ event: 'connected' }, { event: 'data', value: 1 }]),
    }),
  },
}));
```

### Request Forwarding

```ts
await server.client.createExpectation(({ $ }) => ({
  schema: {
    request: $.has('incoming.path', { $value: '/api/proxy' }),
    forward: { url: 'https://api.external.com/data' },
    response: $.set('outgoing.data', { $exec: (data) => ({ ...data, intercepted: true }) }),
  },
}));
```

### Using Relative Paths with `baseUrl`

```ts
await server.client.createExpectation(({ $ }) => ({
  schema: {
    request: $.set('incoming.path', { $exec: (path) => path.replace('/v1/', '/v2/') }),
    forward: { baseUrl: 'https://legacy-api.com' },
  },
}));
```

### Transforming Request Data Before Forwarding

```ts
await server.client.createExpectation(({ $ }) => ({
  schema: {
    request: $.and([
      $.has('incoming.path', { $value: '/api/search' }),
      $.merge('incoming.headers', { $value: { 'X-API-Key': 'secret' } }),
      $.set('incoming.data', { $exec: (data) => ({ ...data, q: data.query }) }),
    ]),
    forward: { url: 'https://api.com/search' },
  },
}));
```

### WebSocket Forwarding and Manipulation

```ts
await server.client.createExpectation(({ $, utils }) => ({
  transports: utils.transports(['ws']),
  schema: {
    request: $.has('incoming.path', { $value: '/ws/proxy' }),
    forward: { baseUrl: 'wss://real-server.com' },
    response: $.set('outgoing.stream', {
      $exec: (stream, { rx }) => stream?.pipe(rx.map((msg) => ({ ...msg, intercepted: true }))),
    }),
  },
}));
```

### Conditional Caching

```ts
await server.client.createExpectation(({ $ }) => ({
  schema: {
    request: $.has('incoming.path', { $value: '/api/cacheable' }),
    forward: { baseUrl: 'https://api.com', cache: { ttl: 3600 } },
    response: $.set('cache', '$path', 'isEnabled', { $exec: (v, { context }) => context.outgoing.status === 200 }),
  },
}));
```

### Custom Cache Key

```ts
await server.client.createExpectation(({ $ }) => ({
  schema: {
    request: $.set('cache', '$path', 'key', { $exec: (k, { context }) => context.incoming.headers['x-user-id'] }),
    forward: { baseUrl: 'https://api.com', cache: { isEnabled: true } },
  },
}));
```

### Request State

```ts
await server.client.createExpectation(({ $ }) => ({
  schema: {
    request: $.set('state', { $exec: (s) => ({ id: s.id ?? Math.random() }) }),
    response: $.set('outgoing.data', { $exec: (p, { state }) => ({ id: state.id }) }),
  },
}));
```

### Storage and Containers

```ts
await server.client.createExpectation(({ $ }) => ({
  schema: {
    request: $.set('container', {
      $exec: (c, { context }) => context.storage
        .provide({ key: 'counter', payload: { count: 0 } })
        .assign((p) => ({ count: p.count + 1 })),
    }),
    response: $.set('outgoing.data', { $exec: (p, { context }) => ({ count: context.container!.payload.count }) }),
  },
}));
```

### Cross-Expectation Sync

```ts
// Expectation 1: Increment
await server.client.createExpectation(({ $ }) => ({
  schema: {
    request: $.set('container', { $exec: (c, { context }) => context.storage.provide({ key: 'shared', payload: { v: 0 } }).assign((p) => ({ v: p.v + 1 })) }),
  },
}));

// Expectation 2: Get
await server.client.createExpectation(({ $ }) => ({
  schema: {
    request: $.set('container', { $exec: (c, { context }) => context.storage.provide({ key: 'shared', payload: { v: 0 } }) }),
    response: $.set('outgoing.data', { $exec: (p, { context }) => ({ v: context.container!.payload.v }) }),
  },
}));
```

## Steps

### 1. Analysis and Planning

Review the task requirements and identify which core entities are involved:
- **Expectations**: Which requests need to be intercepted? What should the responses look like?
- **Operators**: Which operators (`$and`, `$exec`, `$set`, etc.) are needed for matching and manipulation?
- **Data Persistence**: Is request-scoped `state` enough, or is a long-lived `container` required?
- **External Integration**: Does the request need to be forwarded or cached?

### 2. Implementation Workflow

1.  **Initialize**: Ensure the `MockServer` is started and the client is accessible.
2.  **Define Schema**: Create expectations using `server.client.createExpectation`. Start with basic matching (`incoming.path`, `incoming.method`) and refine with operators.
3.  **Apply Logic**: Use `$exec` for complex scenarios, leveraging built-in utilities (`_`, `d`, `faker`) and context data.
4.  **Manage Storage**: Use `context.storage` to handle cross-request data synchronization via containers.
5.  **Configure Forwarding**: Set up `forward` and `cache` settings if interacting with real services.

### 3. Verification

- Run the code and verify that expectations are correctly intercepted.
- Use `npx tsc` (or another command to trigger TS types check) to ensure type safety in `$exec` functions and schemas.
- If an expectation doesn't match as expected, use `logger` inside `$exec` or check the GUI for status.

### 4. Refinement

- Add generic types to `createExpectation<MyContext>` for better IDE support and safety.
- Extract complex `$exec` logic into reusable functions if they are used across multiple expectations.
- Set `isEnabled: false` for debugging scenarios that shouldn't run by default.
