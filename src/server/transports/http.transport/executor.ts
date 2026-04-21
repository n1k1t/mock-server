import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import _ from 'lodash';

import { HttpsProxyAgent } from 'https-proxy-agent';
import { decodeBuffer } from 'http-encoding';

import type { Expectation, IExpectationSchemaForward } from '../../../expectations';
import type { HttpRequestContext } from './context';

import { Logger } from '../../../logger';
import {
  extractPayloadType,
  parsePayload,
  Executor,
  ExecutorManualError,
  IRequestContextOutgoing,
  IRequestContextIncoming,
  IExecutorExecOptions,
} from '../../models';

const logger = Logger.build('Server.Transports.Http.Executor');

export class HttpExecutor extends Executor<HttpRequestContext> {
  public async exec(context: HttpRequestContext, options?: IExecutorExecOptions) {
    await super.exec(context, options).catch((error) => {
      if (error instanceof ExecutorManualError) {
        return null;
      }

      logger.error('Got unexpected error while execution', error?.stack ?? error);
    });

    return context.complete();
  }

  /**
   * Returns the matched expectation for the context or `null` when nothing
   * matches. Unlike the previous implementation this method does NOT send a
   * preemptive 404 reply: the HTTP listener iterates over multiple matched
   * providers (the router is a multimap) and a premature reply here would
   * close the response before the next provider gets a chance. The listener
   * owns the final "nothing matched anywhere" 404.
   */
  public async match(context: HttpRequestContext): Promise<Expectation<any> | null> {
    return context.provider.storages.expectations.match(context.snapshot);
  }

  public async forward(
    context: HttpRequestContext,
    incoming: IRequestContextIncoming,
    schema: IExpectationSchemaForward
  ) {
    const options = await this
      .compileForwardingConfiguration(context, incoming, schema)
      .catch((error) => {
        context.snapshot.assign({
          error: { code: 'UNKNOWN', message: error?.message ?? 'Unknown' },
          outgoing: { type: 'plain', status: 502, headers: {} },
        });

        logger.error('Got error while execution [compileForwardingConfiguration] method', error?.stack ?? error);
        throw error;
      });

    const response = await axios
      .request<Buffer>(options)
      .catch(async (error: AxiosError<Buffer>): Promise<AxiosResponse<Buffer>> => {
        if (!error.response) {
          context.snapshot.assign({
            error: _.pick(error, ['message', 'code']),
            outgoing: { type: 'plain', status: 502, headers: {} },
          });

          logger.error('Got error while forwaring', error?.stack ?? error);
          throw error;
        }

        return error.response;
      });

    if (response.headers['content-encoding']) {
      response.data = await decodeBuffer(response.data, response.headers['content-encoding']);
      response.headers['content-encoding'] = 'utf-8';
    }

    const type = extractPayloadType(response.headers) ?? 'plain';
    const data = parsePayload(type, response.data);

    return {
      schema,
      incoming,

      outgoing: {
        type: type,

        status: response.status,
        headers: response.headers,

        data,
        dataRaw: response.data,
      },
    };
  }

  public async reply(context: HttpRequestContext, outgoing: IRequestContextOutgoing) {
    outgoing.headers = _.omitBy(
      Object.assign(_.omit(outgoing.headers, ['transfer-encoding']), {
        'content-type': outgoing.headers['content-type'] ?? (
          outgoing.type === 'json'
            ? 'application/json'
            : outgoing.type === 'xml'
              ? 'application/xml'
              : undefined
        ),

        ...(outgoing.dataRaw && { 'content-length': String(outgoing.dataRaw.length) }),
      }),
      _.isNil
    );

    context.response.writeHead(outgoing.status, outgoing.headers);
    context.response.write(outgoing.dataRaw ?? '');
    context.response.end();

    return outgoing;
  }

  /** Compiles Axios request configuration to forward */
  protected async compileForwardingConfiguration(
    context: HttpRequestContext,
    incoming: IRequestContextIncoming,
    schema: IExpectationSchemaForward
  ): Promise<AxiosRequestConfig> {
    const url = new URL(schema.url ?? incoming.path, schema.baseUrl);
    const isSecured = url.protocol.includes('https');

    return {
      timeout: schema.timeout ?? 30000,

      method: incoming.method,
      headers: Object.assign(incoming.headers, {
        connection: 'close',

        ...(schema.options?.overrideHost !== false && { host: url.host }),
        ...(incoming.dataRaw && { 'content-length': String(incoming.dataRaw.length) }),
      }),

      ...(schema.url && { url: schema.url }),
      ...(schema.baseUrl && { baseURL: schema.baseUrl, url: incoming.path }),

      data: incoming.dataRaw,
      params: context.incoming.query,
      responseType: 'arraybuffer',

      ...((schema.proxy && !isSecured) && { proxy: schema.proxy }),
      ...((schema.proxy && isSecured) && {
        httpsAgent: new HttpsProxyAgent(`http://${schema.proxy.host}:${schema.proxy.port}`),
      }),
    };
  }
}
