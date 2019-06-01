const jwt       = require('jsonwebtoken');
const promisify = require('util').promisify;
const log       = require('debug')('app:controllers:auth');
const Config    = require('./config');
const fs        = require('fs');
const _         = require('lodash');

const jwtSign   = promisify(jwt.sign).bind(jwt);
const jwtVerify = promisify(jwt.verify).bind(jwt);


class AuthController {

  constructor() {
    this.certificatesPath = Config.getConfig('auth.certificatesPath');
    this.keyPassword      = Config.getConfig('auth.keyPassword');
    this.privateKey       = fs.readFileSync(`${this.certificatesPath}/key_private.key`);
    this.publicKey        = fs.readFileSync(`${this.certificatesPath}/key_public.key`);
  }

  /**
   * Try sign a token with the secret from an environment variable.
   * @param {Object} user
   * @returns {string|null}
   */
  async sign(user) {
    let token = null;

    try {
      token = await jwtSign(
        { user: { userId: user._id, roles: user.roles, createdAt: user.createdAt }},
        { key: this.privateKey, passphrase: this.keyPassword },
        { algorithm: 'RS512', expiresIn: '2d' },
      );

    } catch (e) {
      log(e);
    }

    return token;
  }

  /**
   * Verifies whether a token is valid or not.
   * If it is, return decoded token data.
   * @param {string} token
   * @returns {Promise<any>}
   */
  async verify(token) {
    let data = null;

    try {
      data = await jwtVerify(
        token,
        this.publicKey,
      );
    } catch (e) {
      log(`token verification error, ${_.get(e, 'message')}`);
    }

    return data;
  }


  /**
   * Middleware function that will be used in every api route to provide user context
   */
  async createContext(req, res, next) {
    req.context = {};

    const authorizationHeader = req.header('Authorization');
    if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
      return next();
    }

    const token        = authorizationHeader.split(' ')[1];
    const decodedToken = await this.verify(token);

    if (!decodedToken) {
      return next();
    }

    req.context = {
      ...req.context,
      ...decodedToken,
    };
    next();
  }

}


module.exports = new AuthController();