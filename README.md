<div align='center'>
  <h1>Mock server</h1>
  <p>The ultimate toolkit to <b>intercept, transform, and simulate</b> HTTP/WS traffic with type-safe expectations</p>

  <img src="https://raw.githubusercontent.com/n1k1t/mock-server/refs/heads/master/images/preview.png?raw=true" />

  <br />
  <br />

  ![License](https://img.shields.io/badge/License-MIT-yellow.svg)
  ![npm version](https://badge.fury.io/js/@n1k1t%2Fmock-server.svg)
  ![Dynamic XML Badge](https://img.shields.io/badge/dynamic/xml?url=https%3A%2F%2Fgithub.com%2Fn1k1t%2Fmock-server%2Fblob%2Fmaster%2Fcoverage%2Fcobertura-coverage.xml%3Fraw%3Dtrue&query=round(%2Fcoverage%2F%40line-rate%20*%201000)%20div%201000&label=coverage)
</div>

This mock server provides complete control over your network layer. It allows you to simulate missing APIs, modify real backend responses on the fly, and proxy traffic with advanced caching. Designed for flexibility, it handles complex scenarios with ease while maintaining strict type safety across all your expectations.

- [Features](#features)
- [Installation](#installation)
- [Add Skills](#add-skills)
- [Simple Example](#simple-example)
- [Overview](#overview)
  - [GUI](#gui)
  - [Storage & Containers](#storage--containers)
  - [Cache](#cache)
  - [State & Seeds](#state--seeds)
- [Mock Server Utilities](#mock-server-utilities)
  - [Expectation Operators ($)](#expectation-operators-)
  - [Operator Locations](#operator-locations)
  - [Operator Context](#operator-context)
  - [Container Methods](#container-methods)
- [Usage](#usage)
  - [Complex Expectations with $and](#complex-expectations-with-and)
  - [Custom Logic with $exec](#custom-logic-with-exec)
  - [Dynamic Response Manipulation](#dynamic-response-manipulation)
  - [Binary Data and Files](#binary-data-and-files)
  - [XML Support](#xml-support)
  - [Simulating Network Errors](#simulating-network-errors)
  - [Disabled By Default](#disabled-by-default)
  - [Type Safety](#type-safety)
  - [WebSocket Support](#websocket-support)
  - [Request Forwarding](#request-forwarding)
  - [Using Relative Paths with baseUrl](#using-relative-paths-with-baseurl)
  - [Transforming Request Data Before Forwarding](#transforming-request-data-before-forwarding)
  - [WebSocket Forwarding and Manipulation](#websocket-forwarding-and-manipulation)
  - [Conditional Caching](#conditional-caching)
  - [Custom Cache Key](#custom-cache-key)
  - [Request State](#request-state)
  - [Storage and Containers](#storage-and-containers)
  - [Cross-Expectation Sync](#cross-expectation-sync)
- [Extensions](#extensions)
  - [Redis Configuration](#redis-configuration)
  - [Remote Expectations with RemoteClient](#remote-expectations-with-remoteclient)
  - [Grouping with Providers](#grouping-with-providers)
  - [Logger](#logger)
- [License](#license)

## Features

- **Multi-protocol Support**: Full support for both **HTTP** and **WebSocket** protocols.
- **Flexible Matching**: Match requests by path, method, headers, and data using regex, minimatch, or custom functions.
- **Payload Manipulation**: Modify request or response payloads on the fly.
- **Request Forwarding**: Proxy requests to real services with optional caching.
- **Built-in GUI**: Monitor traffic and manage expectations through a web interface.
- **Typed Expectations**: First-class support for TypeScript to keep your mocks type-safe.
- **Advanced State Management**: Store data across requests using Containers or Request State.
- **XML Support**: Native parsing and serialization for XML payloads.

## Installation

```bash
npm i @n1k1t/mock-server
```

## Add Skills

If you are using the [skills](https://www.npmjs.com/package/skills) package, you can add `n1k1t/mock-server` to your project using the following command:

```bash
npx skills add n1k1t/mock-server
```

This package includes the following skills for better integration with AI agents:

- **`mock-server-basic`**: Core entities management, including server initialization, operators (`$`), expectations, containers, forwarding, and cache.
- **`mock-server-extensions`**: Advanced features like Redis configuration, `RemoteClient` for remote management, `Provider` for grouping/routing, and `Logger` customization.

## Simple Example

```ts
import { MockServer } from '@n1k1t/mock-server';

const server = await MockServer.start({ host: 'localhost', port: 8080 });

// Create a type-safe expectation using the operator compiler ($)
await server.client.createExpectation(({ $ }) => ({
  schema: {
    request: $.has('incoming.path', { $value: '/api/hello' }),
    response: $.set('outgoing.data', { $value: { message: 'world' } }),
  },
}));
```

## Overview

### GUI

The mock server provides a built-in web panel to track everything that is going through. By default, it can be found on `/_system/gui`. Example: `localhost:8080/_system/gui`.

### Storage & Containers

Storage provides access to read/write **Containers**—temporary cells used to sync expectations or store data between requests. Containers have a configurable TTL (Time to Live) and can be merged or assigned new payloads.

### Cache

Cache is used to store payloads of forwarded requests, powered by [ioredis](https://www.npmjs.com/package/ioredis). It allows for long-term persistence of mocked responses from real backends.

### State & Seeds

- **State**: A unique storage for each individual request, typically extracted from headers. By default, it's extracted from the `X-Use-Mock-State` header (JSON in Base64).
- **Seeds**: Help generate consistent random data using [faker](https://www.npmjs.com/package/@faker-js/faker). By default, the seed value is extracted from the `X-Use-Mock-Seed` header. You can also manually set the seed within an expectation using the `seed` location:

```ts
await server.client.createExpectation(({ $ }) => ({
  schema: {
    request: $.and([
      $.has('incoming.path', { $value: '/api/faker' }),
      // Manually set seed from query parameter or any other logic
      $.set('seed', { $exec: (seed, { context }) => context.incoming.query.seed ?? context.seed ?? 12345 }),
    ]),
    response: $.set('outgoing.data', {
      $exec: (payload, { faker }) => ({
        id: faker.number.int(), // Will be consistent for the same seed
        name: faker.person.fullName(),
      }),
    }),
  },
}));
```

## Mock Server Utilities

### Expectation Operators ($)

Expectations are built using operators that define how to match requests and transform responses.

- `$.has(location, { $path, ... })`: Checks if a value exists at the specified path. Supports `$value`, `$match` (minimatch), `$regExp`, and `$exec`.
- `$.set(location, { $value, ... })`: Sets a value at the specified path.
- `$.merge(location, { $value, ... })`: Merges an object into the value at the specified path.
- `$.remove(location, { $path, ... })`: Removes the value at the specified path.
- `$.and([...operators])`: Logical AND of multiple operators.
- `$.or([...operators])`: Logical OR of multiple operators.
- `$.not(operator)`: Logical NOT of an operator.
- `$.if({ $condition, $then, $else })`: Conditional execution of operators.
- `$.switch({ $cases, $default })`: Switch-case execution based on the value at the path.
- `$.exec(fn)`: Executes custom logic. In `match` mode, it must return a boolean. In `manipulate` mode, it can modify the context.

### Operator Locations

Many operators (like `$.has`, `$.set`, `$.merge`) accept a `location` as their first argument. This defines where the operation should be performed:

- `'incoming.path'`: The URL path of the request.
- `'incoming.method'`: The HTTP method.
- `'incoming.query'`: The query parameters object.
- `'incoming.headers'`: The request headers object.
- `'incoming.data'`: The request body (parsed JSON or XML).
- `'outgoing.status'`: The response status code.
- `'outgoing.headers'`: The response headers object.
- `'outgoing.data'`: The response body object.
- `'container'`: Access to a [Container](#container-methods).
- `'state'`: Access to [Request State](#request-state).
- `'cache'`: Access to [Forward Cache](#conditional-caching) configuration.
- `'seed'`: Access to the [Seed](#state--seeds) value.
- `'error'`: For [Simulating Network Errors](#simulating-network-errors).

When targeting an object (like `headers` or `data`), you can use `$path` as the second argument to target a nested value:
`$.has('incoming.headers', '$path', 'content-type', { $value: 'application/json' })`

### Operator Context

When using `$exec`, the second argument provides a context with useful utilities and data:

- **`context`**: The full request/response context.
  - `incoming`: Input data (immutable in match mode).
    - `path`: The request URL path.
    - `method`: HTTP method (GET, POST, etc.).
    - `query`: Object containing query parameters.
    - `headers`: Object containing request headers.
    - `data`: Parsed JSON/XML request body.
  - `outgoing`: Output data (target for manipulation).
    - `status`: HTTP status code.
    - `headers`: Response headers.
    - `data`: Response body object (serialized to JSON/XML).
    - `dataRaw`: Buffer for binary data.
    - `stream`: Observable for WebSocket messages.
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

Containers (accessible via `context.storage`) provide several methods for managing data:

- `storage.provide({ key, payload, ttl })`: Retrieves an existing container by key or creates a new one with the provided payload and TTL.
- `storage.register({ key, payload, ttl })`: Forcefully creates and registers a new container, overwriting any existing one with the same key.
- `storage.find(key)`: Finds an existing container by key. Returns `undefined` if not found.
- `container.assign(payload | fn)`: Shallows merges the given payload into the current container state. If a function is provided, it receives the current payload and returns the new one.
- `container.merge(payload | fn)`: Deeply merges the given payload into the current container state.
- `container.bind(key)`: Binds the container to an additional key.
- `container.unbind()`: Removes the container from the storage.

## Usage

### Complex Expectations with `$and`

You can group multiple conditions using logical operators like `$.and`, `$.or`, and `$.not` to create sophisticated matching rules.

```ts
await server.client.createExpectation(({ $ }) => ({
  schema: {
    request: $.and([
      $.has('incoming.path', { $value: '/api/user' }),
      $.has('incoming.method', { $value: 'POST' }),
      // Checks if 'content-type' header equals 'application/json' using selection with $path = content-type
      $.has('incoming.headers', '$path', 'content-type', { $value: 'application/json' }),
    ]),
    response: $.set('outgoing.data', { $value: { status: 'success' } }),
  },
}));
```

### Custom Logic with `$exec`

For scenarios that require dynamic calculations or external utilities, use the `$exec` operator.

```ts
await server.client.createExpectation(({ $ }) => ({
  schema: {
    request: $.has('incoming.path', {
      // Custom matching logic: checks if path starts with '/api/data'
      $exec: (path) => path.startsWith('/api/data')
    }),
    response: $.set('outgoing.data', {
      // Use built-in utils like lodash (_), dayjs (d), or faker
      $exec: (payload, { _, d, faker }) => ({
        id: faker.string.uuid(),
        timestamp: d().format(),
        values: _.range(3).map(() => _.random(1, 100)),
      }),
    }),
  },
}));

// Use $.exec for full control over the expectation execution
await server.client.createExpectation(({ $ }) => ({
  schema: {
    request: $.exec(({ context, logger, mode }) => {
      // mode can be 'match' (on catching request) or 'manipulate' (on manipulation)
      if (mode === 'match') {
        logger.info('Checking request path', context.incoming.path);
        return context.incoming.path === '/api/custom';
      }
    }),
    response: $.set('outgoing.data', { $value: { status: 'custom' } }),
  },
}));
```

### Dynamic Response Manipulation

You can dynamically adjust the response payload based on incoming request parameters (query, body, headers, etc.).

```ts
await server.client.createExpectation(({ $ }) => ({
  schema: {
    request: $.has('incoming.path', { $value: '/api/profile' }),
    response: $.set('outgoing.data', {
      $exec: (payload, { context }) => ({
        id: context.incoming.query.userId,
        // Conditionally include data based on request headers
        debug: context.incoming.headers['x-debug'] === 'true'
          ? { timestamp: Date.now() }
          : undefined
      })
    }),
  },
}));
```

### Binary Data and Files

You can return binary data (Buffers) as a response body. This is useful for mocking file downloads or image responses.

```ts
import { readFile } from 'fs/promises';

await server.client.createExpectation(({ $ }) => ({
  schema: {
    request: $.has('incoming.path', { $value: '/api/download' }),
    response: $.and([
      $.set('outgoing.headers', '$path', 'content-type', { $value: 'application/pdf' }),
      $.set('outgoing.dataRaw', {
        $exec: async () => await readFile('./path/to/document.pdf')
      }),
    ]),
  },
}));
```

### XML Support

The mock server provides native support for XML payloads via [fast-xml-parser](https://www.npmjs.com/package/fast-xml-parser) with `ignoreAttributes: false`. It automatically parses incoming XML and can serialize objects back to XML in the response.

```ts
await server.client.createExpectation(({ $ }) => ({
  schema: {
    request: $.and([
      $.has('incoming.path', { $matchAnyOf: ['/api/user*'] }),
      $.exec(({ context }) => context.incoming.headers['content-type'] === 'application/xml'),
    ]),
    response: $.and([
      $.set('outgoing.headers', '$path', 'content-type', { $value: 'application/xml' }),
      $.set('outgoing.data', {
        $value: {
          user: {
            info: {
              '#text': 'John Doe',
              '@_type': 'mocked',
              '@_id': 123
            }
          },
        },
      }),
    ]),
  },
}));
```

### Simulating Network Errors

You can simulate connection drops or network errors by setting the `error` property.

```ts
await server.client.createExpectation(({ $ }) => ({
  schema: {
    request: $.has('incoming.path', { $value: '/api/error' }),
    response: $.set('error', {
      // Common error codes: ECONNRESET, ECONNABORTED, etc.
      $value: 'ECONNRESET'
    }),
  },
}));
```

### Disabled by Default

You can create expectations that are disabled by default by setting `isEnabled: false`. These can be manually enabled later via the [GUI](#gui).

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

You can provide generic types to `createExpectation` to ensure your schemas and `$exec` functions are fully typed.

```ts
interface MyContext {
  incoming: {
    query: {
      userId: string;
      expand?: boolean;
    };
  };
  outgoing: {
    data: {
      id: string;
      name: string;
    };
  };
}

await server.client.createExpectation<MyContext>(({ $ }) => ({
  schema: {
    request: $.has('incoming.query', {
      $exec: (query) => query.userId === '123'
    }),
    response: $.set('outgoing.data', {
      $exec: (payload, { faker }) => ({
        id: '123',
        name: faker.person.fullName()
      })
    }),
  },
}));
```

### WebSocket Support

The mock server provides first-class support for WebSockets, allowing you to intercept and mock streaming data using [RxJS](https://rxjs.dev/).

```ts
await server.client.createExpectation(({ $, utils }) => ({
  // 1. Specify 'ws' transport
  transports: utils.transports(['ws']),

  schema: {
    request: $.has('incoming.path', { $value: '/ws/updates' }),
    response: $.and([
      // 2. Set custom WS status code if needed
      $.set('outgoing.status', { $value: 1000 }),
      // 3. Define the outgoing stream
      $.set('outgoing.stream', {
        $exec: (stream, { rx }) => {
          // Return an Observable of messages
          return rx.from([
            { event: 'connected' },
            { event: 'data', value: 1 },
            { event: 'data', value: 2 },
          ]);
        },
      }),
    ]),
  },
}));
```

### Request Forwarding

You can forward requests to an external API and manipulate the response before it's returned to the client.

```ts
await server.client.createExpectation(({ $ }) => ({
  schema: {
    request: $.has('incoming.path', { $value: '/api/proxy' }),
    // Forward the request to an external service
    forward: {
      url: 'https://api.external-service.com/data',
    },
    // Manipulate the response from the external service
    response: $.set('outgoing.data', {
      $exec: (data) => ({
        ...data,
        source: 'mock-server',
        timestamp: new Date().toISOString(),
      }),
    }),
  },
}));
```

### Using Relative Paths with `baseUrl`

When using `baseUrl`, the original request path is appended to the target URL.

```ts
await server.client.createExpectation(({ $ }) => ({
  schema: {
    request: $.and([
      $.has('incoming.path', { $value: '/api/v1/*' }),
      // Rewrite the path from v1 to v2 before forwarding
      $.set('incoming.path', {
        $exec: (path) => path.replace('/v1/', '/v2/'),
      }),
    ]),
    forward: {
      // If request is '/api/v1/users', it forwards to 'https://legacy-api.com/api/v2/users'
      baseUrl: 'https://legacy-api.com',
    },
    response: $.set('outgoing.headers', '$path', 'x-proxied-by', { $value: 'mock-server' }),
  },
}));
```

### Transforming Request Data Before Forwarding

You can also modify the request body or headers before they are sent to the target API.

```ts
interface SearchRequest {
  incoming: {
    data: {
      query: string;
      limit?: number;
    };
  };
}

await server.client.createExpectation<SearchRequest>(({ $ }) => ({
  schema: {
    request: $.and([
      $.has('incoming.path', { $value: '/api/search' }),
      // Inject API key and transform data before forwarding
      $.merge('incoming.headers', { $value: { 'X-API-Key': 'secret-token' } }),
      $.set('incoming.data', {
        $exec: (data) => ({
          ...data,
          limit: data.limit ?? 20,
          q: data.query, // Rename 'query' to 'q' for the external API
        })
      }),
    ]),
    forward: {
      url: 'https://external-search-service.com/v1/query',
    },
  },
}));
```

### WebSocket Forwarding and Manipulation

You can forward WebSocket connections to a real server and manipulate the message stream on the fly.

```ts
await server.client.createExpectation(({ $, utils }) => ({
  transports: utils.transports(['ws']),

  schema: {
    request: $.has('incoming.path', { $value: '/ws/proxy' }),
    forward: {
      baseUrl: 'wss://real-server.com',
    },
    response: $.set('outgoing.stream', {
      $exec: (stream, { rx }) => {
        // 'stream' is the Observable from the real server
        return stream?.pipe(
          // Inject extra message at the beginning
          rx.startWith({ event: 'proxy-init', timestamp: Date.now() }),
          // Transform real messages
          rx.map((message) => ({ ...message, intercepted: true }))
        );
      },
    }),
  },
}));
```

### Conditional Caching

You can control when the mock server should cache a forwarded response. For example, only cache responses with a `200 OK` status.

```ts
await server.client.createExpectation(({ $ }) => ({
  schema: {
    request: $.has('incoming.path', { $value: '/api/cacheable' }),
    forward: {
      baseUrl: 'https://api.service.com',
      cache: {
        ttl: 3600, // 1 hour
      },
    },
    response: $.set('cache', '$path', 'isEnabled', {
      $exec: (value, { context }) => context.outgoing.status === 200,
    }),
  },
}));
```

### Custom Cache Key

By default, the cache key is a hash generated from the `incoming` object (path, method, data, query). You can override this with a custom key.

```ts
await server.client.createExpectation(({ $ }) => ({
  schema: {
    request: $.and([
      $.has('incoming.path', { $value: '/api/cache-custom' }),
      $.set('cache', '$path', 'key', {
        // Use a specific header as the cache key
        $exec: (key, { context }) => context.incoming.headers['x-user-id'],
      }),
    ]),
    forward: {
      baseUrl: 'https://api.service.com',
      cache: {
        isEnabled: true,
        ttl: 600,
      },
    },
  },
}));

// You can also provide an object as a key; it will be automatically hashed
await server.client.createExpectation(({ $ }) => ({
  schema: {
    request: $.and([
      $.has('incoming.path', { $value: '/api/cache-object' }),
      $.set('cache', '$path', 'key', {
        // Cache depends on specific properties of the incoming data
        $exec: (key, { context }) => ({
          id: context.incoming.data.id,
          type: context.incoming.data.type,
        }),
      }),
    ]),
    forward: {
      baseUrl: 'https://api.service.com',
      cache: { isEnabled: true },
    },
  },
}));
```

### Request State

State is a unique storage for each request. It can be used to pass data between operators or expectations. By default, it's extracted from the `X-Use-Mock-State` header (JSON in Base64).

```ts
interface MyState {
  state: {
    internalId: number;
  };
}

await server.client.createExpectation<MyState>(({ $ }) => ({
  schema: {
    request: $.and([
      $.has('incoming.path', { $value: '/api/stateful' }),
      $.set('state', {
        // Compute and store data in state for later use
        $exec: (state) => ({ internalId: state.internalId ?? Math.random() }),
      }),
    ]),
    response: $.set('outgoing.data', {
      // Use the stored state in response building
      $exec: (payload, { state }) => ({
        id: state.internalId,
      }),
    }),
  },
}));
```

### Storage and Containers

Storage provides access to **Containers**—temporary cells used to store data between requests or sync multiple expectations. Unlike `state`, which is request-scoped, Containers are persistent until they expire (TTL).

```ts
interface CounterContainer {
  container: {
    count: number;
  };
}

await server.client.createExpectation<CounterContainer>(({ $ }) => ({
  schema: {
    request: $.set('container', {
      $exec: (container, { context }) => context.storage
        // provide() finds an existing container by key or creates a new one with the given payload
        .provide({ key: 'my-counter', payload: { count: 0 } })
        .assign((payload) => ({ count: payload.count + 1 })),
    }),
    response: $.set('outgoing.data', {
      $exec: (payload, { context }) => ({
        // Access the incremented value from the container
        currentCount: context.container!.payload.count,
      }),
    }),
  },
}));
```

### Cross-Expectation Sync

You can use Containers to synchronize data between different endpoints. For example, one endpoint increments a counter, and another retrieves its current value.

```ts
interface SyncContainer {
  container: {
    count: number;
  };
}

// Expectation 1: Increments the counter
await server.client.createExpectation<SyncContainer>(({ $ }) => ({
  name: 'Incrementer',
  schema: {
    request: $.and([
      $.has('incoming.path', { $value: '/api/increment' }),
      $.set('container', {
        $exec: (container, { context }) => context.storage
          .provide({ key: 'shared-counter', payload: { count: 0 } })
          .assign((payload) => ({ count: payload.count + 1 })),
      }),
    ]),
    response: $.set('outgoing.data', { $value: { status: 'incremented' } }),
  },
}));

// Expectation 2: Retrieves the current value
await server.client.createExpectation<SyncContainer>(({ $ }) => ({
  name: 'Getter',
  schema: {
    request: $.and([
      $.has('incoming.path', { $value: '/api/count' }),
      $.set('container', {
        $exec: (container, { context }) => context.storage
          .provide({ key: 'shared-counter', payload: { count: 0 } }),
      }),
    ]),
    response: $.set('outgoing.data', {
      $exec: (payload, { context }) => ({
        total: context.container!.payload.count,
      }),
    }),
  },
}));
```

## Extensions

### Redis Configuration

The mock server uses Redis for caching forwarded responses and persistent storage. You can configure the connection details during server startup.

```ts
import { MockServer } from '@n1k1t/mock-server';

const server = await MockServer.start({
  host: 'localhost',
  port: 8080,
  databases: {
    redis: {
      host: 'localhost',
      port: 6379,
      // Optional: password, keyPrefix, etc.
      keyPrefix: 'my-mock-server:',
    },
  },
});
```

### Remote Expectations with `RemoteClient`

The `RemoteClient` allows you to manage expectations on a running mock server instance from a remote application or a separate test suite.

```ts
import { RemoteClient } from '@n1k1t/mock-server';

// 1. Connect to a running mock server
const client = await RemoteClient.connect({ baseUrl: 'http://localhost:8080' });

// 2. Create expectations remotely
await client.createExpectation(({ $, utils }) => ({
  // Specify allowed transports (http, ws)
  transports: utils.transports(['http']),

  schema: {
    request: $.has('path', { $value: '/api/remote-mock' }),
    response: $.set('outgoing.data', { $value: { success: true, source: 'remote-client' } }),
  },
}));
```

### Grouping with Providers

Providers allow grouping expectations and isolating them from each other. They are also used to route requests to specific sets of expectations based on path patterns.

```ts
import { MockServer, Provider } from '@n1k1t/mock-server';

// 1. Define providers for different modules
const authProvider = Provider.build({ group: 'auth' });
const userProvider = Provider.build({ group: 'users' });

// 2. Setup server
const server = await MockServer.start({ port: 13000 });

// 3. Add expectations to specific providers
await authProvider.client.createExpectation(({ $ }) => ({
  schema: {
    request: $.has('path', { $value: '/api/auth/login' }),
    response: $.set('outgoing.data', { $value: { token: 'secret-token' } }),
  },
}));

await userProvider.client.createExpectation(({ $ }) => ({
  schema: {
    request: $.has('path', { $value: '/api/users/me' }),
    response: $.set('outgoing.data', { $value: { id: 1, name: 'John' } }),
  },
}));

// 4. Setup routing
server.router
  .register('/api/auth/**', { provider: authProvider })
  .register('/api/users/**', { provider: userProvider });
```

### Logger

You can customize how the mock server logs information by using serializers or by redirecting logs to an external logger (e.g., Sentry, Winston).

```ts
import { Logger } from '@n1k1t/mock-server';

Logger.useExternal({
  info: (title, ...messages) => {
    // Send to your logging service
    console.log(`[${title}]`, ...messages);
  },
  error: (title, ...messages) => {
    // Handle errors specifically
  },
});
```

Serializers allow you to mask sensitive data (like passwords or credit card numbers) before they are logged.

```ts
import { Logger } from '@n1k1t/mock-server';

Logger.useSerializers({
  password: () => '***',
  token: (val: string) => `${val.slice(0, 4)}...`,
});
```

## License

MIT
