/* jshint -W097  */
/* globals require, module, console */

'use strict';

var Provider = require('./provider');
var providers = [];

module.exports = hookUserMethods;

function hookUserMethods(User, config) {
  var providerString = '';
  Provider.getProviders().map(function(provider) {
    if (providerString !== '') {
      providerString += provider + ', ';
    } else {
      providerString += provider;
    }
  });

  User.auth = function(provider, req, res, callback) {
    var authConfig = config.providers[provider];
    var authProvider = new Provider(provider, User, authConfig);

    if (authProvider.instance.authType === 'oauth1' && (!req.body.oauth_token || !req.body.oauth_verifier)) {
      authProvider.instance
        .authorize(req)
        .then(function(token) {
          res.send(token);
        })
        .catch(function(err) {
          callback(err, false);
        });
    } else {
      authProvider.instance
        .authenticate(req)
        .then(function() {
          return authProvider.findExistingUser();
        })
        .then(function(user) {
          if (typeof user !== 'undefined') {
            return user;
          } else {
            return authProvider.createProfile();
          }
        })
        .then(function(user) {
          return authProvider.createAccessToken(user);
        })
        .then(function(token) {
          callback(null, token);
        })
        .catch(function(err) {
          callback(err, false);
        });
      }
  };

  User.link = function(id, provider, req, callback) {
    var authConfig = config.providers[provider];
    var authProvider = new Provider(provider, User, authConfig);

    authProvider
      .instance.authenticate(req)
      .then(function() {
        return authProvider.link(id);
      })
      .then(function() {
        callback(null, true);
      })
      .catch(function(err) {
        callback(err, false);
      });
  };

  User.unlink = function(id, provider, callback) {
    User.findById(id, function(err, user) {
      if (!user) {
        return callback(new Error('User not found'), false);
      } else {
        user[provider] = undefined;
        user.save(function () {
          callback(null, true);
        });
      }
    });
  };

  // Hook all related remote methods to the user model
  User.remoteMethod('auth', {
    accepts: [
      {arg: 'provider', type: 'string', required: true},
      {arg: 'req', type: 'object', 'http': {source: 'req'}},
      {arg: 'res', type: 'object', 'http': {source: 'res'}}
    ],
    description: 'Authenticate with one of the supported social media providers. Supported are: ' + providerString,
    returns: {arg: 'token', type: 'object'},
    http: {path:'/auth/:provider', verb: 'POST', status: 200, errorStatus: 400}
  });

  User.remoteMethod('link', {
    accepts: [
      {arg: 'id', type: 'string', required: true},
      {arg: 'provider', type: 'string', required: true},
      {arg: 'req', type: 'object', 'http': {source: 'req'}}
    ],
    description: 'Link a user account with one of the supported social media providers. Supported are: ' + providerString,
    returns: {arg: 'success', type: 'boolean'},
    http: {path:'/:id/auth/:provider', verb: 'PUT', status: 200, errorStatus: 400}
  });

  User.remoteMethod('unlink', {
    accepts: [
      {arg: 'id', type: 'string', required: true},
      {arg: 'provider', type: 'string', required: true},
    ],
    description: 'Unlink a user account from one of the supported social media providers. Supported are: ' + providerString,
    returns: {arg: 'success', type: 'boolean'},
    http: {path:'/:id/auth/:provider', verb: 'DELETE', status: 200, errorStatus: 400}
  });

}
