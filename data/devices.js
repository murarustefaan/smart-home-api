const fetch = require('node-fetch');
const log   = require('debug')('app:data:devices');

module.exports = {

  /**
   * Get all devices
   * TODO: on individual DB, get all devices. move to shared, filter by user / household?
   *
   * @param {{ SmartHome: Db }} databaseConnection
   * @returns {Promise<>}
   */
  getDevices: async databaseConnection => {
    try {
      const deviceCollection = await databaseConnection.SmartHome.collection('devices');
      return await deviceCollection.find({}).toArray();
    } catch (e) {
      log('get devices error: ', e);
      return [];
    }
  },


  /**
   * Get device details and current state from the device API.
   * TODO: maybe also get detailed info from the database?
   *
   * @param {string} deviceId
   * @returns {Promise<{}>}
   */
  getDeviceDetails: async deviceId => {
    try {
      const deviceDetails = await fetch(`{{device_api_host}}/devices/${deviceId}`);
      return deviceDetails;
    }
    catch(e) {
      log(e);
      return {};
    }
  }

};