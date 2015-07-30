/* jshint -W097  */
/* globals require, module, console */

'use strict';

var hookUserMethods = require('./lib/user');
var setProvider = require('./lib/provider').setProvider;

module.exports = function(app, config) {
  var User = app.models[config.userModel];
  hookUserMethods(User, config);
};

module.exports.setProvider = function(provider, name) {
  setProvider(provider, name);
};
