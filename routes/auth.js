const Express   = require('express');
const Router    = Express.Router();
const bcrypt    = require("bcrypt");
const promisify = require('util').promisify;
const _         = require('lodash');
const log       = require('debug')('app:controllers:auth');
const Auth      = require('../controllers/auth');

const hash    = promisify(bcrypt.hash);
const compare = promisify(bcrypt.compare);


/**
 * Ensure signup credentials are valid
 */
const validateSignup = async (req, res, next) => {
  const validator = req.app.locals.validator;
  const [valid, errors ]    = await validator.validate('auth_signup', req.body);

  if (!valid) {
    log(valid, errors);
    return res.status(400)
              .json({ status: 400, message: 'invalid or missing fields' });
  }

  req.context.user = { ...req.body };
  return next();
};


/**
 * Ensure user is unique in the database
 */
const validateUnique = async (req, res, next) => {
  const { username } = req.context.user;

  try {
    const db   = req.app.locals.database.SmartHome;
    const user = await db.collection('users')
                         .findOne({ username });

    if (user) {
      log(`user ${username} already exists`);
      return res
        .status(400)
        .json({ message: 'user already exists', status: 400 });
    }
  } catch (e) {
    log(e);
    return res
      .status(400)
      .json({ message: 'something went wrong, please try again later', status: 400 });
  }

  return next();
};


/**
 * Create the user object, hash password
 */
const createUserObject = async (req, res, next) => {
  const user = req.context.user;

  try {
    user.password = await hash(user.password, 10);
  } catch (e) {
    log(e);
    return res
      .status(400)
      .json({ message: 'something went wrong, please try again later', status: 400 });
  }

  user.roles = [ 'admin' ];
  return next();
};


/**
 * Save the user in the database
 */
const saveNewUser = async (req, res, next) => {
  const user     = req.context.user;
  user.createdAt = Date.now();

  const db = req.app.locals.database.SmartHome;
  try {
    await db.collection('users').insertOne(user);
  } catch (e) {
    log(e);
    return res
      .status(400)
      .json({ message: 'something went wrong, please try again later', status: 400 });
  }

  req.context.user = _.omit(user, [ 'password', '_id', '__version' ]);
  return next();
};


const validateLogin = async (req, res, next) => {
  const validator         = req.app.locals.validator;
  const [ valid, errors ] = await validator.validate('auth_login', req.body);

  if (!valid) {
    log(valid, errors);
    return res.status(401)
              .json({ status: 401, message: 'wrong username or password' });
  }

  req.context.user = { ...req.body };
  return next();
};


/**
 * Check if user exists in the database
 */
const checkExists = async (req, res, next) => {
  const { username } = req.context.user;
  let user           = null;

  try {
    const db = req.app.locals.database.SmartHome;
    user     = await db.collection('users')
                       .findOne({ username }, { _id: 0 });

    if (!user) {
      log(`user ${username} does not exist`);
      return res
        .status(401)
        .json({ message: 'wrong username or password', status: 401 });
    }
  } catch (e) {
    log(e);
    return res
      .status(401)
      .json({ message: 'something went wrong, please try again later', status: 401 });
  }

  req.context.databaseUser = user;
  return next();
};


/**
 * Compare password from request with the one saved in the DB
 */
const comparePasswords = async (req, res, next) => {
  const actualPassword  = req.context.databaseUser.password;
  const checkedPassword = req.context.user.password;

  try {
    const match = await compare(checkedPassword, actualPassword);
    if (!match) {
      return res
        .status(401)
        .json({ message: 'wrong username or password', status: 401 });
    }
  } catch (e) {
    log(e);
    return res
      .status(401)
      .json({ message: 'something went wrong, please try again later', status: 401 });
  }

  req.context.user = _.omit({ ...req.context.databaseUser }, [ 'password' ]);
  delete req.context.databaseUser;
  return next();
};


/**
 * Generate the authentication token
 */
const generateToken = async (req, res, next) => {
  const token = await Auth.sign(req.context.user);
  if (!token) {
    log('token generation error');
  }

  req.context.token = token;
  return next();
};


Router.post(
  '/signup',
  validateSignup,
  validateUnique,
  createUserObject,
  saveNewUser,
  generateToken,
  (req, res) => {
    log(`signup flow for user ${req.context.user.username} completed successfully`);
    return res.json({ status: 200, token: req.context.token, user: req.context.user });
  }
);

Router.post(
  '/login',
  validateLogin,
  checkExists,
  comparePasswords,
  generateToken,
  (req, res) => {
    log(`login flow for user ${req.context.user.username} completed successfully`);
    return res.json({ status: 200, token: req.context.token });
  }
);

module.exports = Router;
