---
name: mock-server-extensions
description: Skill for working with additional mock server entities (Redis, RemoteClient, Providers, Logger)
---

# Mock Server Extensions Skill

Instructions for managing extended mock server features: Redis configuration, RemoteClient for remote management, Providers for grouping/routing, and Logger customization.

## When to Use

Use this skill when you need to:
1. Configure Redis for persistence and caching.
2. Manage expectations on a remote mock server using `RemoteClient`.
3. Group expectations and isolate them using `Provider`.
4. Setup routing of requests to specific providers.
5. Customize logging or mask sensitive data using `Logger`.

## Extensions

### Redis Configuration

Configure Redis connection during server startup for caching and persistent storage.

```ts
import { MockServer } from '@n1k1t/mock-server';

const server = await MockServer.start({
  host: 'localhost',
  port: 8080,
  databases: {
    redis: {
      host: 'localhost',
      port: 6379,
      keyPrefix: 'my-mock-server:',
    },
  },
});
```

### Remote Expectations with `RemoteClient`

Manage expectations on a running mock server instance from a remote application.

```ts
import { RemoteClient } from '@n1k1t/mock-server';

const client = await RemoteClient.connect({ baseUrl: 'http://localhost:8080' });

await client.createExpectation(({ $, utils }) => ({
  transports: utils.transports(['http']),
  schema: {
    request: $.has('path', { $value: '/api/remote' }),
    response: $.set('outgoing.data', { $value: { success: true } }),
  },
}));
```

### Grouping with Providers

Group expectations and route requests to them based on path patterns.

```ts
import { MockServer, Provider } from '@n1k1t/mock-server';

const authProvider = Provider.build({ group: 'auth' });
const userProvider = Provider.build({ group: 'users' });

const server = await MockServer.start({ port: 8080 });

await authProvider.client.createExpectation(({ $ }) => ({
  schema: {
    request: $.has('path', { $value: '/api/auth/login' }),
    response: $.set('outgoing.data', { $value: { token: 'token' } }),
  },
}));

server.router
  .register('/api/auth/**', { provider: authProvider })
  .register('/api/users/**', { provider: userProvider });
```

### Logger

Customize logging behavior or mask sensitive data.

```ts
import { Logger } from '@n1k1t/mock-server';

// External logger integration
Logger.useExternal({
  info: (title, ...messages) => console.log(`[${title}]`, ...messages),
  error: (title, ...messages) => console.error(`[${title}]`, ...messages),
});

// Data masking
Logger.useSerializers({
  password: () => '***',
  token: (val: string) => `${val.slice(0, 4)}...`,
});
```

## Steps

### 1. Identify Extension Needs
Determine if the task requires:
- **Persistence**: Configure Redis.
- **Remote Management**: Use `RemoteClient`.
- **Isolation/Routing**: Use `Provider` and `server.router`.
- **Observability**: Configure `Logger`.

### 2. Implementation
1. **Redis**: Pass `databases.redis` config to `MockServer.start`.
2. **RemoteClient**: Use `RemoteClient.connect` with the target server's `baseUrl`.
3. **Providers**:
    - Create providers with `Provider.build({ group })`.
    - Register expectations directly on `provider.client`.
    - Use `server.router.register(pattern, { provider })` to route traffic.
4. **Logger**: Call `Logger.useExternal` or `Logger.useSerializers` before server start or in the setup phase.

### 3. Verification
- Run `npx tsc` (or another command to trigger TS types check) to ensure no TypeScript errors in extensions setup.
- Verify Redis connection logs if configured.
- Check routed requests in the GUI to ensure they hit the correct Provider group.
