# lb-satellizer

lb-satellizer integrates 3rd party (facebook, twitter, etc.) authentication for [loopback](https://github.com/strongloop/loopback).
The purpose of this module is to set up remote methods to authenticate (login), link and unlink with multiple social media providers.

### Supported Providers:

- **Facebook** ( [lb-satellizer-facebook](https://github.com/mfressdorf/lb-satellizer-facebook) )
- **Twitter** ( [lb-satellizer-twitter](https://github.com/mfressdorf/lb-satellizer-twitter) )

## Setup:

```$npm install lb-satellizer --save```
```$npm install lb-satellizer-facebook --save```

In your server/config.json, add the name of your User model and all provider specific data:

```javascript
...
"satellizer": {
    "userModel": "user",
    "providers": {
      "facebook": {
        "secret": "****"
      }
    }
  }
```

Then in your server/boot/authentication.js, or any other bootfile add:

```javascript
const satellizer = require('lb-satellizer');
const facebook = require('lb-satellizer-facebook');
const twitter = require('lb-satellizer-twitter');
const satellizerConfig = require('../config.json').satellizer;

module.exports = function enableAuthentication(server) {
...
  const providers = [{provider: facebook, name: 'facebook'},
  				           {provider: twitter, name: 'twitter'}]
  // Use Satellizer for authetication
  satellizer(server, providers, satellizerConfig);
};

```

Finally, add the respective properties and acls for the supported remote methods to your User model. (lb-satellizer sets fullname and *providername*)

```javascript
"properties": {
	...
    "fullname": {
      "type": "string"
    },
    "facebook": {
      "type": "number"
    },
    "twitter": {
      "type": "number"
    },
"acls": [
	...
    {
      "accessType": "EXECUTE",
      "principalType": "ROLE",
      "principalId": "$everyone",
      "permission": "ALLOW",
      "property": "unlink"
    },
    {
      "accessType": "EXECUTE",
      "principalType": "ROLE",
      "principalId": "$everyone",
      "permission": "ALLOW",
      "property": "auth"
    }
  ]
```

## Satellizer Integration:

To use lb-satellizer with [angular satellizer](https://github.com/sahat/satellizer), add the following parameters to your angular config

```javascript
.config(['satellizer.config', '$authProvider', function (config, $authProvider) {

    config.unlinkUrl = 'api/users/auth/unlink/';

    $authProvider.facebook({
      url: 'api/users/auth/facebook',
      clientId: 'your_facebook_client_id'
    });

    $authProvider.twitter({
      url: 'api/users/auth/twitter'
    });

}])
```

## Routes:
lb-satellizer exposes following routes via remote methods:

- auth: **POST** /users/auth/{provider}
- unlink: **GET** /users/auth/unlink/{provider}

## Changelog:

**2.0.0** :

- Upgraded to use ES6 with Node Version 5.5.0
- Former link method is now merged with User.auth, this means better compatibility with Satellizer. Linking of a provider with an existing user account is now performed if the method is called with a valid accesstoken.
- Improved Code Documentation

**1.2.1** :

- Fix major user check Bug that prevented generation of new users
- Add missing link functionality for oauth

**1.1.0** :

- Add OAuth1 support (Twitter)
- Support multiple providers via Array (see setup)
- Add routes description with supported providers


## Future plans:

- Add full example with angular satellizer integration and test specs
- Make it possible to fetch specified profile properties
- Add support for additional providers
- Add support for JWT
- Modfiy/manage routes via config file
