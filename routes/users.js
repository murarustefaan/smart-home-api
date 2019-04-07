const Express = require('express');
const Router  = Express.Router();

Router.get(
  '/',
  (req, res, next) => res.send('respond with a resource')
);

module.exports = Router;
