
# Mock server

This package is actually what you need but everything about it will be described later...

### Install

```bash
npm i -g @n1k1t/mock-server
```

### Start

Using console
```bash
# It starts mock server on localhost:8080
npx @n1k1t/mock-server -p 8080
```

Using JavaScript
```js
const { MockServer } = require('@n1k1t/mock-server');

MockServer.start({ host: 'localhost', port: 8080 });
```

Using TypeScript
```ts
import { MockServer } from '@n1k1t/mock-server';

MockServer.start({ host: 'localhost', port: 8080 });
```

### Add expectations

Using curl

```bash
# Create a passtrough expectation to port 80
curl -X POST -d '{"forward": {"protocol": "HTTP", "host": "localhost", "port": 80}}' 'localhost:8080/_mock/expectations'
```

Using remote client

```ts
import { RemoteClient } from '@n1k1t/mock-server';

RemoteClient
  .connect({ host: 'localhost', port: 8080 })
  .then(async (client) => {
    await client.createExpectation({
      forward: {
        timeout: 2 * 60 * 1000,
        protocol: 'HTTP',
        host: 'localhost',
        port: 80,
      },
    });
  });
```

Using client on mock server side

```ts
import { MockServer } from '@n1k1t/mock-server';

MockServer
  .start({ host: 'localhost', port: 8080 })
  .then(async ({ client }) => {
    await client.createExpectation({
      forward: {
        timeout: 2 * 60 * 1000,
        protocol: 'HTTP',
        host: 'localhost',
        port: 80,
      },
    });
  });
```

### GUI

To access the GUI of mock server you have to navigate on `/_mock/gui/`

Example
```bash
localhost:8080/_mock/gui/
```
