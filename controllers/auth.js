const jwt       = require('jsonwebtoken');
const promisify = require('util').promisify;
const log       = require('debug')('app:controllers:auth');
const Config    = require('./config');

const jwtSign   = promisify(jwt.sign).bind(jwt);
const jwtVerify = promisify(jwt.verify).bind(jwt);


class AuthController {

  constructor() {
    this.secret = Config.getConfig('auth.secret');
  }

  /**
   * Try sign a token with the secret from an environment variable.
   * @param {any} data
   * @returns {string|null}
   */
  async sign(data) {
    let token = null;

    try {
      token = await jwtSign(
        data,
        this.secret,
        { algorithm: 'HS512', expiresIn: '2d' },
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
        this.secret,
      );
    } catch (e) {
      log(e);
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

    const token = authorizationHeader.split(' ')[1];
    const decodedToken = await this.verify(token);
    if (!decodedToken) {
      return next();
    }

    req.context.user = decodedToken;
    next();
  }

}


module.exports = new AuthController();