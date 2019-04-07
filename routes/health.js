const Express = require('express');
const Router  = Express.Router();
const Acl     = require('../controllers/acl');

const Status = {
  OK:    'ok',
  ERROR: 'error',
};

Router.get(
  '/',
  Acl.isAllowed('health'),
  (req, res) => res.json({
    api:      'ok',
    database: req.app.locals.database ? Status.OK : Status.ERROR,
  })
);

module.exports = Router;
