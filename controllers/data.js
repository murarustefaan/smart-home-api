const MongoClient = require('mongodb').MongoClient;
const Config      = require('./config');
const Async       = require('async');
const log         = require('debug')('app:controllers:data');

const RETRIES       = 3;
const RETRY_TIMEOUT = 2000;

module.exports = class MongoConnection {

  constructor(connectionString) {
    /**
     * @private
     * @type {string}
     */
    this.connectionString = connectionString;

    /**
     * @private
     * @type {MongoClient}
     */
    this.client = new MongoClient(this.connectionString, { useNewUrlParser: true });
  }

  /**
   * @async
   * @returns {Promise<boolean>}
   */
  async connect() {
    try {
      await this.ensureConnection();
      log('db client established successfully');
      return true;
    } catch (e) {
      log('could not create db client, will exit...');
      return false;
    }
  }

  /**
   * @private
   * @async
   * @returns {Promise<any>}
   */
  ensureConnection() {
    return new Promise((resolve, reject) => Async.retry(
      { times: RETRIES, interval: RETRY_TIMEOUT },
      cb => this.client.connect().then(
        connection => cb(null, connection),
        err => {
          log(`error connecting to DB: ${err}`);
          cb(err);
        },
      ),
      (err, connection) => err ? reject(err) : resolve(connection),
    ));
  }

  get SmartHome() {
    return this.client && this.client.isConnected()
      ? this.client.db(Config.getConfig('database.name').toString())
      : null;
  };
};
