const Express   = require('express');
const Router    = Express.Router();
const bcrypt    = require("bcrypt");
const promisify = require('util').promisify;
const _         = require('lodash');
const log       = require('debug')('app:controllers:auth');

const hash    = promisify(bcrypt.hash);
const compare = promisify(bcrypt.compare);

/**
 * Ensure credentials are valid
 */
const validate = (req, res, next) => {
  const username = _.get(req, 'body.email');
  const password = _.get(req, 'body.password');
  if (!username || !password) {
    return res.status(400)
              .json({ message: 'invalid or missing email or password' });
  }

  if (username.length < 4 || username.length > 30 || password.length < 4) {
    return res.status(400)
              .json({ message: 'invalid email or password' });
  }

  req.context = { username, password };
  return next();
};

/**
 * Ensure user is unique in the database
 */
const ensureUnique = async (req, res, next) => {
  const { username, password } = req.context;

  try {
    const db   = req.app.locals.database.SmartHome;
    const user = await db.collection('users')
                         .findOne({ email: username });

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
  const { username, password } = req.context;

  let hashedPassword = null;
  try {
    hashedPassword = await hash(password, 10);
  } catch (e) {
    log(e);
    return res
      .status(400)
      .json({ message: 'invalid email or password', status: 401 });
  }

  req.context = { username, password: hashedPassword };
  return next();
};

/**
 * Save the user in the database
 */
const save = async (req, res, next) => {
  const { username, password } = req.context;

  const db = req.app.locals.database.SmartHome;
  try {
    await db.collection('users').insertOne({
      email:     username,
      password:  password,
      createdAt: Date.now(),
    });
  } catch (e) {
    log(e);
    return res
      .status(400)
      .json({ message: 'could not create user, please try again later', status: 400 });
  }

  return next();
};


Router.post(
  '/signup',
  validate,
  ensureUnique,
  createUserObject,
  save,
  (req, res) => {
    log(`signup flow for user ${req.context.username} completed successfully`);
    return res.json({ status: 200 });
  }
);

module.exports = Router;
