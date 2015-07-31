/* jshint -W097  */
/* globals require, module, console */

'use strict';

var hookUserMethods = require('./lib/user');
var addProvider = require('./lib/provider').addProvider;

module.exports = function(app, config) {
  var User = app.models[config.userModel];
  hookUserMethods(User, config);
};

module.exports.addProvider = function(provider, name) {
  addProvider(provider, name);
};

module.exports.addProviders = function(providers) {
  providers.map(function(provider) {
    addProvider(provider.provider, provider.name);
  });
};
