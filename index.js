'use strict';

const hookUserMethods = require('./lib/user');
const addProvider = require('./lib/provider').addProvider;

module.exports = (app, providers, config) => {
  const User = app.models[config.userModel];
  providers.map((provider) => {
    addProvider(provider.provider, provider.name);
  });
  hookUserMethods(User, config);
};
