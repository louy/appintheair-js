# App In The Air
[![Travis](https://img.shields.io/travis/louy/appintheair-js.svg)](https://travis-ci.org/louy/appintheair-js)
[![Codecov](https://img.shields.io/codecov/c/github/louy/appintheair-js.svg)](https://codecov.io/gh/louy/appintheair-js)
[![npm](https://img.shields.io/npm/v/appintheair.svg)](https://www.npmjs.com/package/appintheair)

A javascript SDK for the [App in the Air API](http://docs.appintheair.apiary.io).

This package is written in TypeScript and most of the code is documented.

## Usage:
```js
const client_id = '';
const client_secret = '';
const sdk = new AppInTheAir({client_id, client_secret});
const {access_token} = await sdk.getUserlessAccessToken({scope: 'user_flights'});
const {flights} = await sdk.getUserProfile({access_token, user_id: '123'});
```
