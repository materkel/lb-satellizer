/* jshint -W097  */
/* globals require, module, console */

'use strict';

var Provider = require('./provider');

module.exports = function (User, config) {

  User.auth = function(provider, req, callback) {
    var authConfig = config.providers[provider];
    var authProvider = new Provider(provider, User, authConfig);

    authProvider
      .instance.authenticate(req)
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
  };

  User.link = function(id, provider, req, callback) {
    var authConfig = config.providers[provider];
    var authProvider = new Provider(provider, User, authConfig);

    authProvider
      .instance.authenticate(req)
      .then(function() {
        return authProvider.link();
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
  User.remoteMethod('link', {
    accepts: [
      {arg: 'id', type: 'string', required: true},
      {arg: 'provider', type: 'string', required: true},
      {arg: 'req', type: 'object', 'http': {source: 'req'}}
    ],
    returns: {arg: 'success', type: 'boolean'},
    http: {path:'/:id/link/:provider', verb: 'post', status: 200, errorStatus: 400}
  });

  User.remoteMethod('unlink', {
    accepts: [
      {arg: 'id', type: 'string', required: true},
      {arg: 'provider', type: 'string', required: true},
    ],
    returns: {arg: 'success', type: 'boolean'},
    http: {path:'/:id/unlink/:provider', verb: 'post', status: 200, errorStatus: 400}
  });

  User.remoteMethod('auth', {
    accepts: [
      {arg: 'provider', type: 'string', required: true},
      {arg: 'req', type: 'object', 'http': {source: 'req'}}
    ],
    returns: {arg: 'token', type: 'object'},
    http: {path:'/auth/:provider', verb: 'post', status: 200, errorStatus: 400}
  });

};
