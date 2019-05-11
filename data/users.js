const fetch  = require('node-fetch');
const _      = require('lodash');
const config = require('../config');
const log    = require('debug')('app:data:users');

module.exports = {

  /**
   * Get all users
   * @param {Object} queryParams
   * @returns {Promise<>}
   */
  getUsers: async (queryParams) => {
    try {
      const url = new URL(`${config.dataApis.common.host}/users`);
      for (const [ key, value ] of Object.entries(queryParams)) {
        url.searchParams.append(key, value);
      }

      const response       = await fetch(url);
      const userCollection = await response.json();
      return _.get(userCollection, 'users');
    } catch (e) {
      log('get users error: ', e);
      return [];
    }
  },


  /**
   * Get user details
   *
   * @param {string} userId
   * @returns {Promise<{}>}
   */
  getUser: async userId => {
    try {
      const response = await fetch(`${config.dataApis.common.host}/users/${userId}`);
      const user     = await response.json();
      return _.get(user, 'user', null);
    } catch (e) {
      log(e);
      return null
    }
  },


  /**
   * Create a new user
   *
   * @param {Object} user
   * @returns {Promise<{}>}
   */
  createUser: async user => {
    try {
      const response    = await fetch(`${config.dataApis.common.host}/users`, {
        method:  'POST',
        body:    JSON.stringify(user),
        headers: new fetch.Headers({ 'Content-Type': 'application/json' })
      });
      const createdUser = await response.json();
      return _.get(createdUser, 'user', null);
    } catch (e) {
      log(e);
      return null
    }
  }

};