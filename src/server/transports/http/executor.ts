import { HttpsProxyAgent } from 'https-proxy-agent';
import axios, { AxiosError } from 'axios';
import _ from 'lodash';

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
} from '../../models';

const logger = Logger.build('Server.Transports.Http.Executor');

export class HttpExecutor extends Executor<HttpRequestContext> {
  public async exec(context: HttpRequestContext) {
    await super.exec(context).catch((error) => {
      if (error instanceof ExecutorManualError) {
        return null;
      }

      logger.error('Got unexpected error while execution', error?.stack ?? error);
    });

    return context.complete();
  }

  public async handleExpectationMatch(context: HttpRequestContext, expectation: Expectation<any> | null) {
    if (!expectation) {
      logger.warn('Expectation was not found');

      const outgoing = await this.reply(context, {
        type: 'plain',
        status: 404,

        dataRaw: 'Expectation was not found',
        headers: {},
      });

      return context.assign({ outgoing });
    }
  }

  public async forward(
    context: HttpRequestContext,
    incoming: IRequestContextIncoming,
    configuration: IExpectationSchemaForward
  ) {
    const url = new URL(configuration.url ?? incoming.path, configuration.baseUrl);

    const response = await axios.request({
      timeout: configuration.timeout ?? 30000,

      method: incoming.method,
      headers: Object.assign(incoming.headers, {
        connection: 'close',

        ...(configuration.options?.host === 'origin' && { host: url.host }),
        ...(incoming.dataRaw && { 'content-length': String(Buffer.from(incoming.dataRaw).length) }),
      }),

      ...(configuration.url && { url: configuration.url }),
      ...(configuration.baseUrl && { baseURL: configuration.baseUrl, url: incoming.path }),

      data: incoming.dataRaw,
      params: context.incoming.query,
      responseType: 'arraybuffer',

      ...(
        configuration.proxy && url.protocol.includes('https')
          ? { httpsAgent: new HttpsProxyAgent(url.host) }
          : { proxy: configuration.proxy }
      ),
    }).catch((error: AxiosError) => {
      if (!error.response) {
        context.snapshot.assign({ error: _.pick(error, ['message', 'code']) });
        context.complete();

        logger.error('Got error while forwaring', error?.stack ?? error);
        throw error;
      }

      return error.response;
    });

    const dataRaw = response.data.toString();

    const type = extractPayloadType(response.headers) ?? 'plain';
    const data = parsePayload(type, dataRaw);

    return {
      incoming,
      outgoing: {
        type: type,

        status: response.status,
        headers: response.headers,

        data,
        dataRaw,
      },
    };
  }

  public async reply(context: HttpRequestContext, outgoing: IRequestContextOutgoing) {
    outgoing.headers = Object.assign(_.omit(outgoing.headers, ['transfer-encoding']), {
      'content-type': outgoing.headers['content-type'] ?? (
        outgoing.type === 'json' ? 'application/json' : outgoing.type === 'xml' ? 'application/xml' : undefined
      ),

      ...(outgoing.dataRaw && { 'content-length': String(Buffer.from(outgoing.dataRaw).length) }),
    });

    context.response.writeHead(outgoing.status, 'OK', outgoing.headers);
    context.response.write(outgoing.dataRaw);
    context.response.end();

    return outgoing;
  }
}
