/* jshint -W097  */
/* globals require, module, console */

'use strict';

var hookUserMethods = require('./lib/user');
var addProvider = require('./lib/provider').addProvider;

module.exports = function(app, providers, config) {
  var User = app.models[config.userModel];
  providers.map(function(provider) {
    addProvider(provider.provider, provider.name);
  });
  hookUserMethods(User, config);
};
