const Express     = require('express');
const Router      = Express.Router();
const StatusCodes = require('http-status-codes');
const _           = require('lodash');
const Acl         = require('../controllers/acl');
const Data        = require('../data/users');


const isAllowed = async (req, res, next) => {
  const requestedUserId = _.get(req, 'params.userId');
  const userId = _.get(req, 'context.user.userId');

  if (userId === requestedUserId) {
    return next();
  }

  if (!Acl.isAllowed('user_details')) {
    return res.status(StatusCodes.UNAUTHORIZED)
      .json({
        status: StatusCodes.UNAUTHORIZED,
        message: 'not authorized'
      });
  }

  return next();
};


/**
 * Get detailed info for a specific device and it's current state from the device api.
 */
const getUserInfo = async (req, res, next) => {
  const user       = await Data.getUser(req.params.userId);
  req.context.user = user || {};
  return next();
};


Router.get(
  '/:userId',
  isAllowed,
  getUserInfo,
  (req, res) => {
    const user   = _.get(req, 'context.user');
    const response = { status: _.get(user, '_id') ? StatusCodes.OK : StatusCodes.NOT_FOUND };

    response.user = user;

    return res.json(response);
  },
);


module.exports = Router;
