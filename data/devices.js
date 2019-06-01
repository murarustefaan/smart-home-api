const fetch  = require('node-fetch');
const _      = require('lodash');
const config = require('../config');
const log    = require('debug')('app:data:devices');

module.exports = {

  /**
   * Get all devices
   * @param {Object?} queryParams
   * @returns {Promise<>}
   */
  getDevices: async (queryParams) => {
    try {
      const url = new URL(`${config.dataApis.devices.host}/devices`);

      if (queryParams) {
        for (const [ key, value ] of Object.entries(queryParams)) {
          url.searchParams.append(key, value);
        }
      }

      const response = await fetch(url);
      const devices  = await response.json();

      return devices;
    } catch (e) {
      log('get devices error: ', e);
      return [];
    }
  },


  /**
   * Get device details
   *
   * @param {string} deviceId
   * @returns {Promise<{}>}
   */
  getDeviceDetails: async deviceId => {
    try {
      const response = await fetch(`${config.dataApis.devices.host}/devices/${deviceId}`);
      const device   = await response.json();

      return device;
    } catch (e) {
      log(e);
      return null
    }
  },


  /**
   * Insert a new device into the system
   *
   * @param {Object} device
   * @returns {Promise<{}>}
   */
  createDevice: async device => {
    try {
      const response      = await fetch(`${config.dataApis.devices.host}/devices`, {
        method:  'POST',
        body:    JSON.stringify(device),
        headers: new fetch.Headers({ 'Content-Type': 'application/json' })
      });
      const createdDevice = await response.json();

      return device;
    } catch (e) {
      log(e);
      return null
    }
  },


  /**
   * Edit a existing device
   *
   * @param {string} id
   * @param {Object} device
   * @returns {Promise<{}>}
   */
  editDevice: async (id, device) => {
    try {
      const response = await fetch(`${config.dataApis.devices.host}/devices/${id}`, {
        method:  'PATCH',
        body:    JSON.stringify(device),
        headers: new fetch.Headers({ 'Content-Type': 'application/json' })
      });
      return response.ok;
    } catch (e) {
      log(e);
      return null
    }
  },


  /**
   * Remove a device from the system
   * @param {string} deviceId
   * @returns {Promise<null|boolean>}
   */
  removeDevice: async deviceId => {
    try {
      const response = await fetch(`${config.dataApis.devices.host}/devices/${deviceId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        //todo: switch response code
        log('some error occured', response);
        return null;
      }

      return true;
    } catch (e) {
      log(e);
      return null;
    }
  }

};