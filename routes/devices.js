const Express = require('express');
const Router  = Express.Router();
const Acl     = require('../controllers/acl');
const Data    = require('../data/devices');


/**
 * Get a list with all devices
 * TODO: Maybe request these from the `devices api`?
 */
const getDevices = async (req, res, next) => {
  const devices       = await Data.getDevices(req.app.locals.database);
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
  (req, res) => res.json({
    status:  200,
    device: req.context.device
  }),
);


module.exports = Router;
