
# Mock server

This package is actually what you need but everything about it will be described later...

### GUI

To access the GUI of mock server you have to navigate on `/_mock/gui/`

Example
```bash
localhost:8080/_mock/gui/
```

### Examples

Server side setup
```ts

/**
 * It starts the mock server on port 8080
 */

import { startMockServer } from  '@n1k1t/mock-server';

startMockServer({ host: 'localhost', port:  8080 });

```

Client side setup using curl
```bash
# Delete all expectations
curl -X DELETE 'localhost:8080/_mock/expectations'

# Create a passtrough expectation to port 80
curl -X POST -d '{"forward": {"protocol": "HTTP", "host": "localhost", "port": 80}}' 'localhost:8080/_mock/expectations'
```

Client side setup using package
```ts
/**
 * It connects client to the mock server and registers passthrouth expectation to port 80
 */

import { connectClient } from  '@n1k1t/mock-server';

connectClient({ host: 'localhost', port: 8080 }).then(
  async ({ deleteAllExpectations, createExpectation }) => {
    await  deleteAllExpectations();

    await  createExpectation({
      forward: {
        timeout: 2 * 60 * 1000,
        protocol: 'HTTP',
        host: 'localhost',
        port: 80,
      },
    });
  }
);
```
