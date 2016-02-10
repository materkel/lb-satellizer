'use strict';

const Provider = require('./provider');
const loopback = require('loopback');

module.exports = (User, config) => {

  let supportedProviders = '';

  // create string containing all supported providers
  Provider
    .getProviders()
    .map((provider) => {
      if (supportedProviders !== '') {
        supportedProviders += `, ${provider}`;
      } else {
        supportedProviders += provider;
      }
    });

  /**
   * Perform authorization step for oauth1 request
   * Exchange oauth parameters for oauth token
   *
   * @param  {Object}   Provider authProvider Object
   * @param  {Object}   req      Request Object
   * @param  {Object}   res      Response Object
   * @param  {Function} callback Callback Function
   * @return {Object}   token    Oauth Token used by Satellizer to validate oauth request
   */
  function authorize(Provider, req, res, callback) {
    Provider
      .instance
      .authorize(req)
      .then((token) => {
        res.send(token);
      })
      .catch((err) => {
        callback(err, false);
      });
  }

  /**
   * link user account with the given provider
   *
   * @param  {Object}   Provider authProvider Object
   * @param  {String}   id       User Id
   * @param  {Object}   req      Request Object
   * @param  {Function} callback Callback Function
   * @return {Object}   success  Success Object
   */
  function link(Provider, id, req, callback) {
     Provider
      .instance
      .authenticate(req)
      .then((res) => {
        return Provider.link(id);
      })
      .then(() => {
        callback(null, true);
      })
      .catch((err) => {
        callback(err, false);
      });
  }

  /**
   * Authenticate a Provider
   * Create a new Profile Entry if no User is associated with the given Provider,
   * Create an Accesstoken, used by Satellizer for User login
   *
   * @param  {Object}   Provider authProvider Object
   * @param  {Object}   req      Request Object
   * @param  {Function} callback Callback Function
   * @return {Object}   token    Response Object with accesstoken
   */
  function authenticate(Provider, req, callback) {
    Provider
      .instance
      .authenticate(req)
      .then(() => {
        return Provider.findExistingUser();
      })
      .then((user) => {
        if (user !== null) {
          return user;
        } else {
          return Provider.createProfile();
        }
      })
      .then((user) => {
        return Provider.createAccessToken(user);
      })
      .then((token) => {
        callback(null, token);
      })
      .catch((err) => {
        callback(err, false);
      });
  }

  /**
   * User Auth Method, called by Satellizer
   * Authenticates a User with a specific Provider
   *
   * @param  {String}   provider Providername as String
   * @param  {Object}   req      Request Object
   * @param  {Object}   res      Response Object
   * @param  {Function} callback Callback Function
   */
  User.auth = (provider, req, res, callback) => {
    const authConfig = config.providers[provider];
    const authProvider = new Provider(provider, User, authConfig);

    const currentContext = loopback.getCurrentContext();
    const id = currentContext && currentContext.active.accessToken.userId || null;

    if (authProvider.instance.authType === 'oauth1' &&
       (!req.body.oauth_token || !req.body.oauth_verifier)) {
      // perform authorization step of oauth1 requests
      authorize(authProvider, req, res, callback);
    } else {
      if (id !== null) {
        // link user account with the given provider if request contains a valid accessToken
        link(authProvider, id, req, callback);
      } else {
        // request authtoken if request does not contain a valid accessToken
        authenticate(authProvider, req, callback);
      }
    }
  };

  /**
   * User Unlink method, called by Satellizer
   * Unlinks a provider from its user profile
   *
   * @param  {[type]}   provider Providername as String
   * @param  {Function} callback Callback Function
   * @return {Object}   success  Success Object
   */
  User.unlink = (provider, callback) => {
    const currentContext = loopback.getCurrentContext();
    const id = currentContext && currentContext.active.accessToken.userId || null;

    if (id !== null) {
      User.findById(id, (err, user) => {
        if (!user) {
          callback(new Error('User not found'), false);
        } else {
          user[provider] = undefined;
          user.save(() => {
            callback(null, true);
          });
        }
      });
    } else {
      callback(new Error('Did not receive a valid Accesstoken'), false);
    }
  };

  // Hook all related remote methods to the loopback User model
  // These methods need permissions set to allow access for $everyone
  // See Documentation
  User.remoteMethod('auth', {
    accepts: [
      {arg: 'provider', type: 'string', required: true},
      {arg: 'req', type: 'object', 'http': {source: 'req'}},
      {arg: 'res', type: 'object', 'http': {source: 'res'}}
    ],
    description: `Authenticate with one of the supported social media providers.
                  Supported are: ${supportedProviders}`,
    returns: {arg: 'token', type: 'object'},
    http: {path:'/auth/:provider', verb: 'POST', status: 200, errorStatus: 400}
  });

  User.remoteMethod('unlink', {
    accepts: {arg: 'provider', type: 'string', required: true},
    description: `Unlink a user account from one of the supported social media providers.
                  Supported are: ${supportedProviders}`,
    returns: {arg: 'success', type: 'boolean'},
    http: {path:'/auth/unlink/:provider', verb: 'GET', status: 200, errorStatus: 400}
  });

};
