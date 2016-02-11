'use strict';

const pwGen = require('password-generator');
const providers = {};
const providerList = [];

module.exports = { initProvider, addProvider, getProviders };

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
function initProvider(name, User, config) {

  let instance = null;
  if (providers[name] !== undefined) {
    instance = providers[name](config);
  } else {
    throw new Error('The requested Provider does not exist');
  }

  return {
    getInstance: () => {
      return instance;
    },
    /**
     * Creates a new Accesstoken
     *
     * @param  {Object} user
     * @return {Promise}
     */
    createAccessToken: (user) => {
      return new Promise((resolve, reject) => {
        user.createAccessToken(User.settings.ttl, (err, token) => {
          if (err) {
            reject(err);
          }
          token.token = token.id;
          resolve(token);
        });
      });
    },

    /**
     * Checks if the User exists
     *
     * @return {Promise}
     */
    findExistingUser: () => {
      const filter = {};
      filter[name] = instance.getUserData().userId;
      return new Promise((resolve) => {
        User.findOne({ where: filter}, (err, user) => {
          resolve(user);
        });
      });
    },

    /**
     * Links the Provider with an existing User profile
     *
     * @param  {String} userId
     * @return {Promise}
     */
    link: (userId) => {
      return new Promise((resolve, reject) => {
        const userData = instance.getUserData();
        User.findById(userId, (err, user) => {
          if (user) {
            user[name] = userData.userId;
            user.fullname = user.fullname || userData.userName;
            user.save(() => {
              resolve(user);
            });
          } else {
            reject(err);
          }
        });
      });
    },

    /**
     * Adds the Provider to an existing User profile, or creates a new User
     *
     * @return {Promise}
     */
    createProfile: () => {
      return new Promise((resolve, reject) => {
        const userData = instance.getUserData();
        const filter = { email: userData.userEmail };
        User.findOne({ where: filter }, (err, user) => {
          if (user) {
            user[name] = userData.userId;
            user.fullname = user.fullname || userData.userName;
            user.save(() => {
              resolve(user);
            });
          } else {
            const obj = {};
            obj[name] = userData.userId;
            obj.email = userData.userEmail;
            obj.password = pwGen(18, false);
            User.create(obj, (err, user) => {
              if (err) {
                reject(err);
              }   else {
                resolve(user);
              }
            });
          }
        });
      });
    }
  };
}
