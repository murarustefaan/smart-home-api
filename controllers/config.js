const _ = require('lodash');

class Config {

  constructor() {
    /**
     * @type {Object}
     * @private
     */
    this._configs = {
      ...this._configs,
      ...require('../config.js')
    }
  }


  /**
   * Get a config value.
   *
   * @param {String} configName
   * @returns {any}
   */
  getConfig(configName) {
    return _.get(this._configs, configName);
  }


  /**
   * Set a config value.
   *
   * @param {string} configName
   * @param {any} configValue
   */
  setConfig(configName, configValue) {
    _.set(this._configs, configName, configValue);
  }


  getDatabaseConnectionString() {
    const host = this.getConfig('database.host');
    const port = this.getConfig('database.port');
    const user = this.getConfig('database.user');
    const pass = this.getConfig('database.password');
    const db   = this.getConfig('database.name');

    return 'mongodb://'
      // + user
      // + ':'
      // + pass
      // + '@'
      + host
      + (port ? `:${port}`: port)
      + '/'
      + db;
  }

}

module.exports = new Config();