import { extractPayloadType } from './utils';
import { parsePayload } from './utils';
import { serializePayload } from './utils';
import { IncomingMessage } from 'http';
import { extractHttpIncommingContext } from './utils';

// Test generated using Keploy
test('should return json when content type is application/json', () => {
  const headers = {
    'Content-Type': 'application/json'
  };
  const result = extractPayloadType(headers);
  expect(result).toBe('json');
});

// Test generated using Keploy
test('should return xml when content type is application/xml', () => {
  const headers = {
    'Content-Type': 'application/xml'
  };
  const result = extractPayloadType(headers);
  expect(result).toBe('xml');
});

// Test generated using Keploy
test('should return undefined when type is unsupported', () => {
  const result = parsePayload('plain', Buffer.from('test data'));
  expect(result).toBeUndefined();
});

// Test generated using Keploy
test('should serialize payload to JSON buffer', () => {
  const payload = { key: 'value' };
  const result = serializePayload('json', payload);
  expect(result).toEqual(Buffer.from(JSON.stringify(payload)));
});

// Test generated using Keploy
test('should serialize payload to XML buffer', () => {
  const payload = { key: 'value' };
  const result = serializePayload('xml', payload);
  expect(result).toEqual(expect.any(Buffer));
});

// Test generated using Keploy
test('test_parsePayload_validJson', () => {
  const payload = Buffer.from(JSON.stringify({ key: 'value' }));
  const result = parsePayload('json', payload);
  expect(result).toEqual({ key: 'value' });
});

// Test generated using Keploy
const xmlPayload = Buffer.from('<root><key>value</key></root>');
const result = parsePayload('xml', xmlPayload);
expect(result).toEqual({ root: { key: 'value' } });

// Test generated using Keploy
test('test_extractPayloadType_emptyHeaders', () => {
  const headers = {};
  const result = extractPayloadType(headers);
  expect(result).toBeNull();
});

// Test generated using Keploy
test('test_extractHttpIncommingContext_missingBody', async () => {
  const request = <IncomingMessage><unknown>{
    url: '/test?param=value',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: undefined
  };

  const result = await extractHttpIncommingContext(request);
  expect(result.data).toBeUndefined();
});

