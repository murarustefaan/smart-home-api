const Express     = require('express');
const Router      = Express.Router();
const StatusCodes = require('http-status-codes');
const _           = require('lodash');
const Acl         = require('../controllers/acl');
const Data        = require('../data/devices');


/**
 * Get a list with all devices
 */
const getDevices = async (req, res, next) => {
  const devices       = await Data.getDevices();
  req.context.devices = devices || [];
  return next();
};


/**
 * Get detailed info for a specific device and it's current state from the device api.
 */
const getDeviceDetails = async (req, res, next) => {
  const device       = await Data.getDeviceDetails(req.params.deviceId);
  req.context.device = device || {};
  return next();
};


Router.get(
  '/',
  Acl.isAllowed('device_list'),
  getDevices,
  (req, res) => res.json({
    status:  200,
    devices: req.context.devices
  }),
);


Router.get(
  '/:deviceId',
  Acl.isAllowed('device_read'),
  getDeviceDetails,
  (req, res) => {
    const device   = _.get(req, 'context.device');
    const response = { status: device ? StatusCodes.OK : StatusCodes.NOT_FOUND };

    if (_.get(device, '_id')) {
      response.device = device;
    } else {
      response.message = 'device not found';
    }

    return res.json(response);
  },
);


module.exports = Router;
