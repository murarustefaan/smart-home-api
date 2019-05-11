const express         = require('express');
const cookieParser    = require('cookie-parser');
const async           = require('async');
const cors            = require('cors');
const Config          = require('./controllers/config');
const AclController   = require('./controllers/acl');
const AuthController  = require('./controllers/auth');
const Validator       = require('./controllers/validation');
const log             = require('debug')('app:index');


const app = express();

/**
 * Async app initializer
 */
(async () => {

  const apiPort = Config.getConfig('api.port');

  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use(cookieParser());
  app.use(cors({
    origin: 'http://192.168.43.222:4200',
    optionsSuccessStatus: 200,
    credentials: true,
  }));

  const dependencies = await initDependencies();
  if (!dependencies) {
    return process.exit(1);
  }

  // use app locals to share dependencies with route handlers
  app.locals = {
    ...app.locals,
    ...dependencies,
  };

  // create a context on the request
  app.use(AuthController.createContext.bind(AuthController));
  app.use('/health', require('./routes/health'));
  app.use('/auth', require('./routes/auth'));


  app.listen(
    apiPort,
    (err) => {
      if (err) {
        log(`error starting the server: ${err}`);
      } else {
        log(`api started on port ${apiPort}`);
      }
    }
  );

})();

function initDependencies() {
  return new Promise((resolve, _reject) => {
    async.auto({
      validator: async () => new Validator().init()
    }, (error, results) => {
      if (error) {
        log(`an error occured: ${error}`);
        log('exiting process');
        return resolve(null);
      }

      log('init done');
      resolve(results);
    });
  });
}