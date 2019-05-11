/**
 * TODO: Add all tokens into the database to have the ability to invalidate them.
 * TODO: Logout functionality based on invalidating tokens.
 */

const Express     = require('express');
const Router      = Express.Router();
const bcrypt      = require("bcrypt");
const promisify   = require('util').promisify;
const _           = require('lodash');
const StatusCodes = require('http-status-codes');
const log         = require('debug')('app:controllers:auth');
const Auth        = require('../controllers/auth');
const UsersApi    = require('../data/users');

const hash    = promisify(bcrypt.hash);
const compare = promisify(bcrypt.compare);


/**
 * Ensure signup credentials are valid
 */
const validateSignup = async (req, res, next) => {
  const validator         = req.app.locals.validator;
  const [ valid, errors ] = await validator.validate('auth_signup', req.body);

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
  const user         = await UsersApi.getUsers({ username });

  if (_.head(user)) {
    log(`user ${username} already exists`);
    return res
      .status(StatusCodes.CONFLICT)
      .json({ message: 'user already exists', status: StatusCodes.CONFLICT });
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
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: 'something went wrong, please try again later', status: StatusCodes.INTERNAL_SERVER_ERROR });
  }

  user.roles = [ 'guest' ];
  return next();
};


/**
 * Save the user in the database
 */
const saveNewUser = async (req, res, next) => {
  const user = req.context.user;

  const createdUser = await UsersApi.createUser(user);

  if (!createdUser) {
    log(`something went wrong creating the user ${user.username}`);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR)
              .json({
                message: 'something went wrong, please try again later',
                status:  StatusCodes.INTERNAL_SERVER_ERROR
              })
  }

  req.context.user = _.omit(createdUser, [ 'password', '__version' ]);
  return next();
};


/**
 * Verify if credentials passed are in a valid format
 */
const validateLogin = async (req, res, next) => {
  const validator         = req.app.locals.validator;
  const [ valid, errors ] = await validator.validate('auth_login', req.body);

  if (!valid) {
    log(valid, errors);
    return res.status(StatusCodes.BAD_REQUEST)
              .json({ status: StatusCodes.BAD_REQUEST, message: 'wrong username or password' });
  }

  req.context.user = { ...req.body };
  return next();
};


/**
 * Check if user exists in the database
 */
const getUser = async (req, res, next) => {
  const { username } = req.context.user;

  const users = await UsersApi.getUsers({ username });
  let user    = _.head(users);
  if (!user) {
    log(`user ${username} does not exist`);
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ message: 'wrong username or password', status: StatusCodes.UNAUTHORIZED });
  }

  user = await UsersApi.getUser(user._id);

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
      log(`invalid password for user ${req.context.user.username}`);
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ message: 'wrong username or password', status: StatusCodes.UNAUTHORIZED });
    }
  } catch (e) {
    log(e);
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: 'something went wrong, please try again later', status: StatusCodes.INTERNAL_SERVER_ERROR });
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
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR)
              .json({
                message: 'something went wrong, please try again later',
                status:  StatusCodes.INTERNAL_SERVER_ERROR
              })
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

    res.header('Location', `/users/${req.context.user._id}`);
    return res.json({ status: StatusCodes.CREATED, token: req.context.token, user: req.context.user });
  }
);

Router.post(
  '/login',
  validateLogin,
  getUser,
  comparePasswords,
  generateToken,
  (req, res) => {
    log(`login flow for user ${req.context.user.username} completed successfully`);
    return res.json({ status: 200, token: req.context.token });
  }
);


module.exports = Router;
