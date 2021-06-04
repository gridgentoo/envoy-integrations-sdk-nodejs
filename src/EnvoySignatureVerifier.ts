import crypto, { BinaryToTextEncoding } from 'crypto';
import { Request } from 'express';
import { envoyClientSecret } from './constants';

/**
 * @typedef {Object} SignatureVerifierOptions
 * @property {string} algorithm="sha256"
 * @property {string} encoding="base64"
 * @property {string} secret=process.env.ENVOY_CLIENT_SECRET
 * @property {string} header="x-envoy-signature"
 */

export interface EnvoySignatureVerifierOptions {
  algorithm: 'sha256' | string,
  encoding: BinaryToTextEncoding,
  secret: string,
  header: 'x-envoy-signature' | string,
}

const defaultOptions: EnvoySignatureVerifierOptions = {
  algorithm: 'sha256',
  encoding: 'base64',
  secret: envoyClientSecret,
  header: 'x-envoy-signature',
};

export default class EnvoySignatureVerifier {
  private readonly options: EnvoySignatureVerifierOptions;

  constructor(options: EnvoySignatureVerifierOptions = defaultOptions) {
    this.options = { ...defaultOptions, ...options };

    if (!this.options.secret) {
      throw new Error('No client secret found in the ENVOY_CLIENT_SECRET environment variable.');
    }
  }

  /**
   * Verifies that the signature provided matches the request body.
   */
  verify(req: Request, rawBody: Buffer): boolean {
    const {
      algorithm,
      encoding,
      secret,
      header,
    } = this.options;

    if (!req.headers[header]) {
      return false;
    }
    const receivedDigest = req.headers[header] as string;
    const computedHmac = crypto.createHmac(algorithm, secret);
    computedHmac.update(rawBody);

    return crypto.timingSafeEqual(
      Buffer.from(receivedDigest),
      Buffer.from(computedHmac.digest(encoding)),
    );
  }
}
