/* jshint -W097  */
/* globals require, module, console */

'use strict';

var pwGen = require('password-generator');
var Promise = require('bluebird');

module.exports = Provider;
module.exports.setProvider = addProvider;

var providers = {};

function addProvider(provider, name) {
  if (!providers.hasOwnProperty(name)) {
    providers[name] = provider;
  }
}

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

Provider.prototype.createAccessToken = function(user) {
  var self = this;
  return new Promise(function(resolve, reject) {
    user.createAccessToken(self.User.settings.ttl, function (err, token) {
      if (err) {
        reject(err);
      }

      token.token = token.id;
      resolve(token);
    });
  });
};

Provider.prototype.findExistingUser = function() {
  var self = this;
  var filter = {};
  filter[this.name] = this.instance.userId;
  return new Promise(function(resolve) {
    self.User.findOne({ where: filter}, function(err, user) {
      resolve(user);
    });
  });
};

Provider.prototype.link = function(userId) {
  var self = this;
  return new Promise(function(resolve, reject) {
    self.User.findById(userId, function(err, user) {
      if (user) {
        user[self.name] = self.instance.userId;
        user.fullname = user.fullname || self.instance.userName;
        user.save(function() {
          resolve(user);
        });
      } else {
        reject(err);
      }
    });
  });
};

Provider.prototype.createProfile = function() {
  var self = this;
  var filter = { email: this.instance.userEmail };
  return new Promise(function(resolve, reject) {
    self.User.findOne({ where: filter }, function(err, user) {
      if (user) {
        user[self.name] = self.instance.userId;
        user.fullname = user.fullname || self.instance.userName;
        user.save(function() {
          resolve(user);
        });
      } else {
        var obj = {};
        obj[self.name] = self.instance.userId;
        obj.email = self.instance.userEmail;
        obj.password = pwGen(18, false);
        self.User.create(obj, function(err, user) {
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
