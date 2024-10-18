export type * from './server';
export type * from './client';

export type TRequestMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
export type TRequestPayloadType = 'json' | 'plain' | 'xml';
export type TRequestProtocol = 'HTTP' | 'HTTPS';
