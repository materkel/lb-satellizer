'use strict';

const pwGen = require('password-generator');
const providers = {};
const providerList = [];

module.exports = Provider;
module.exports.addProvider = addProvider;
module.exports.getProviders = getProviders;

/**
 * Add a new supported Provider, called when initiating lb-satellizer
 *
 * @param {Object} provider
 * @param {String} name
 */
function addProvider(provider, name) {
  if (!providers.hasOwnProperty(name)) {
    providers[name] = provider;
    providerList.push(name);
  }
}

/**
 * Get all supported Providers
 *
 * @return {Array} providerList
 */
function getProviders() {
  return providerList;
}

/**
 * Initiates and mangages a given Provider
 *
 * @param {String} name   Provider name, injected by user.js
 * @param {Object} User   User Model, injected by user.js
 * @param {Object} config authConfig, injected by user.js
 */
function Provider(name, User, config) {
  this.instance = init();
  this.name = name;
  this.User = User;

  function init() {
    if (providers[name] !== undefined) {
      return new providers[name](config);
    } else {
      throw new Error('The requested Provider does not exist');
    }
  }
}

/**
 * Creates a new Accesstoken
 *
 * @param  {Object} user
 * @return {Promise}
 */
Provider.prototype.createAccessToken = (user) => {
  return new Promise((resolve, reject) => {
    user.createAccessToken(this.User.settings.ttl, (err, token) => {
      if (err) {
        reject(err);
      }
      token.token = token.id;
      resolve(token);
    });
  });
};

/**
 * Checks if the User exists
 *
 * @return {Promise}
 */
Provider.prototype.findExistingUser = () => {
  const filter = {};
  filter[this.name] = this.instance.userId;
  return new Promise((resolve) => {
    this.User.findOne({ where: filter}, (err, user) => {
      resolve(user);
    });
  });
};

/**
 * Links the Provider with an existing User profile
 *
 * @param  {String} userId
 * @return {Promise}
 */
Provider.prototype.link = (userId) => {
  return new Promise((resolve, reject) => {
    this.User.findById(userId, (err, user) => {
      if (user) {
        user[this.name] = this.instance.userId;
        user.fullname = user.fullname || this.instance.userName;
        user.save(() => {
          resolve(user);
        });
      } else {
        reject(err);
      }
    });
  });
};

/**
 * Adds the Provider to an existing User profile, or creates a new User
 *
 * @return {Promise}
 */
Provider.prototype.createProfile = () => {
  const filter = { email: this.instance.userEmail };
  return new Promise((resolve, reject) => {
    this.User.findOne({ where: filter }, (err, user) => {
      if (user) {
        user[this.name] = this.instance.userId;
        user.fullname = user.fullname || this.instance.userName;
        user.save(() => {
          resolve(user);
        });
      } else {
        const obj = {};
        obj[this.name] = this.instance.userId;
        obj.email = this.instance.userEmail;
        obj.password = pwGen(18, false);
        this.User.create(obj, (err, user) => {
          if (err) {
            reject(err);
          }   else {
            resolve(user);
          }
        });
      }
    });
  });
};
