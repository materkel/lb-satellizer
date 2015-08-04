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
var satellizer = require('lb-satellizer');
var facebook = require('lb-satellizer-facebook');
var twitter = require('lb-satellizer-twitter');
var satellizerConfig = require('../config.json').satellizer;

module.exports = function enableAuthentication(server) {
...
  var providers = [{provider: facebook, name: 'facebook'},
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
      "principalId": "$owner",
      "permission": "ALLOW",
      "property": "link"
    },
    {
      "accessType": "EXECUTE",
      "principalType": "ROLE",
      "principalId": "$owner",
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
## Routes:
lb-satellizer exposes following routes via remote methods:

- auth: **POST** /users/auth/{provider}
- link: **PUT** /users/{id}/auth/{provider}
- unlink: **DELETE** /users/{id}/auth/{provider}

## Changelog:

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
