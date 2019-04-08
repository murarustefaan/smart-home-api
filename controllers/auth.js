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

}


module.exports = new AuthController();