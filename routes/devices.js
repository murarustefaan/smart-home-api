const Express     = require('express');
const Router      = Express.Router();
const StatusCodes = require('http-status-codes');
const _           = require('lodash');
const log         = require('debug')('app:routes:devices');
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


const editDevice = {
  validate: async (req, res, next) => {
    if (!_.values(req.body).length) {
      log('received empty patch request');
      return res.status(400)
                .json({ status: 400, message: 'invalid or missing fields' });
    }

    const validator         = req.app.locals.validator;
    const [ valid, errors ] = await validator.validate('devices_patch', req.body);

    if (!valid) {
      log(`invalid edit_device request, ${errors.map(e => _.get(e, 'message')).join(', ')}`);
      return res.status(400)
                .json({ status: 400, message: 'invalid or missing fields' });
    }

    req.context.device = { ...req.body };
    return next();
  },

  apply: async (req, res, next) => {
    const updated       = await Data.editDevice(req.params.deviceId, req.context.device);
    req.context.updated = !!updated;
    return next();
  }
};


Router.get(
  '/',
  Acl.isAllowed('device_list'),
  getDevices,
  (req, res) => res.json({
    status:  StatusCodes.OK,
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
      response.status  = StatusCodes.NOT_FOUND;
      response.message = 'device not found';
    }

    return res
      .status(StatusCodes.NOT_FOUND)
      .json(response);
  },
);


Router.patch(
  '/:deviceId',
  Acl.isAllowed('device_update'),
  editDevice.validate,
  editDevice.apply,
  (req, res) => {
    const updated = _.get(req, 'context.updated');

    if (!updated) {
      return res.status(StatusCodes.NOT_FOUND)
                .json({ status: StatusCodes.NOT_FOUND, message: 'device not found' });
    }

    return res
      .status(StatusCodes.NO_CONTENT)
      .end();
  },
);


module.exports = Router;
