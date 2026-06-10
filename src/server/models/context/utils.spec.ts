import { extractHttpIncommingContext } from './utils';
import { definePayloadType } from './utils';
import { IncomingMessage } from 'http';

// Test generated using Keploy
test('should return json when content type is application/json', () => {
  const headers = {
    'Content-Type': 'application/json'
  };
  const result = definePayloadType(headers);
  expect(result).toBe('json');
});

// Test generated using Keploy
test('should return xml when content type is application/xml', () => {
  const headers = {
    'Content-Type': 'application/xml'
  };
  const result = definePayloadType(headers);
  expect(result).toBe('xml');
});

// Test generated using Keploy
test('test_extractPayloadType_emptyHeaders', () => {
  const headers = {};
  const result = definePayloadType(headers);
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
