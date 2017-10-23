export interface Options {
  client_id: string,
  client_secret: string,
}

/** A white-space separated list of scopes. Valid scopes are: user_email, user_info and user_flights */
export type Scope = string;

const BASE_URL = 'https://iappintheair.appspot.com';

interface MakeApiCallRequest {
  method: 'GET'|'POST'|'PUT'|'DELETE',
  url: string,
  headers?: object,
}

export interface Response<T> {
  status: number;
  data?: T;
  error?: any;
}

export interface UserProfile {
  id: string,
  name: string,
  /** if `user_email` scope is authorized */
  email?: string,
  hours?: number,
  kilometers?: number,
  last_year_hours?: number,
  last_year_kilometers?: number,
  airports?: UserAirport[],
  countries?: UserCountry[],
  airlines?: UserAirline[],
  aircraft?: UserAircraft[],
  aircrafts?: UserAircraft[],
  flights?: UserFlight[],
}

export interface UserAirport {
  count: number;
  /** two-letter country code */
  country: string;
  /** three-letter airport code */
  code: string;
  /** airport name */
  name: string;
  /** airport city name */
  city: string;
}

export interface UserCountry {
  count: number;
  /** two-letter country code */
  code: string;
  /** country name */
  name: string;
}

export interface UserFlight {
  /** two-letter code */
  carrier: string;
  /** flight number */
  number: string;
  /** departure airport code */
  departure_code: string;
  /** arrival airport code */
  arrival_code: string;
  departure_date: number;
  departure_utc: number;
  arrival_utc: number;
}

export interface UserAirline {
  count: number;
  /** two-letter code */
  code: string;
  /** full name */
  name: string;
}

export interface UserAircraft {
  count: number;
  code: string;
  /** full name */
  name: string;
}

export interface UserTrip {
  id: string;
  flights?: UserTripFlight[];
  /** if `user_hotels` scope is authorized */
  hotels?: UserTripHotel[];
  /** if `user_car_rentals` scope is authorized */
  car_rentals?: UserTripCarRental[];
}
export interface UserTripFlightAirport {
  /** two-letter code */
  country: string;
  country_full: string;
  /** three-letter airport code */
  code: string;
  name: string;
}
export interface UserTripFlightCarrier {
  icao: string;
  iata: string;
  name: string;
}
export interface UserTripFlight {
  carrier: UserTripFlightCarrier;
  number: string;
  origin: UserTripFlightAirport;
  destination: UserTripFlightAirport;
  distance_km: number;
  arrival_utc: number;
  arrival_local: number;
  departure_local: number;
  departure_utc: number;
}

export type UserTripHotel = any;
export type UserTripCarRental = any;

function percentEncode(str: string): string {
  return encodeURIComponent(str).replace(/[!*()']/g, (character) => {
    return '%' + character.charCodeAt(0).toString(16);
  });
};

/**
 * Usage:
 * ```js
 * const client_id = '';
 * const client_secret = '';
 * const sdk = new AppInTheAir({client_id, client_secret});
 * const {access_token} = await sdk.getUserlessAccessToken({scope: 'user_flights'});
 * const {flights} = await sdk.getUserProfile(access_token, user_id: '123');
 * ```
 */
export default class AppInTheAir {
  readonly client_id: string;
  readonly client_secret: string;

  constructor({client_id, client_secret}: Options) {
    this.client_id = client_id;
    this.client_secret = client_secret;
  }

  getAuthUrl({scope, redirect_uri}: {scope: Scope, redirect_uri: string}): string {
    return `${BASE_URL}/oauth/authorize?client_id=${percentEncode(this.client_id)}&response_type=code&redirect_uri=${percentEncode(redirect_uri)}&scope=${percentEncode(scope)}`
  }

  getAccessToken({code, redirect_uri}: {code: string, redirect_uri: string}): PromiseLike<{
    access_token: string,
    refresh_token: string,
    /** token expiry time in seconds */
    expires_in: number,
    token_type: string,
  }> {
    return this.makeApiCall({
      method: 'GET',
      url: `/oauth/token?client_id=${percentEncode(this.client_id)}&client_secret=${percentEncode(this.client_secret)}&grant_type=authorization_code&code=${percentEncode(code)}&redirect_uri=${percentEncode(redirect_uri)}`
    })
  }

  refreshAccessToken({refresh_token, redirect_uri}: {refresh_token: string, redirect_uri: string}): PromiseLike<{
    access_token: string,
    refresh_token: string,
  }> {
    return this.makeApiCall({
      method: 'GET',
      url: `/oauth/token?client_id=${percentEncode(this.client_id)}&client_secret=${percentEncode(this.client_secret)}&grant_type=refresh_token&refresh_token=${percentEncode(refresh_token)}`
    })
  }

  /**
   * The token should be active for the next 7 days. But you should check `expires_in` as it may be changed in the future.
   * User-less tokens can be used to retrieve information about users that have already authorized your consumer.
   */
  getUserlessAccessToken({scope}: {scope: string}): PromiseLike<{
    access_token: string,
    expires_in: string,
  }> {
    return this.makeApiCall({
      method: 'GET',
      url: `/oauth/token?client_id=${percentEncode(this.client_id)}&client_secret=${percentEncode(this.client_secret)}&scope=${percentEncode(scope)}&grant_type=client_credentials`
    })
  }

  private makeApiCall({
    method,
    url,
    headers,
  }: MakeApiCallRequest): PromiseLike<any> {
    return fetch(`${BASE_URL}${url}`, {
      method,
      headers,
    })
      .then(response => {
        if (response.headers.get('Content-Type') === 'application/json') {
          return response.json().then(body => ({response, body}));
        }
        return response.text().then(body => ({response, body}));
      })
      .then(({response, body}) => {
        if (response.status >= 400) {
          let error: Error;
          switch (true) {
            case body.error_description != null:
              error = new Error(body.error_description);
              break;
            case body.error === 'invalid_grant':
              error = new Error('Provided code is invalid, expired, or belongs to another client')
              break;
            case body.error === 'invalid_client':
              error = new Error('Provided client id or secret is invalid')
              break;
            default:
              error = new Error('Unknown error occured');
              break;
          }
          throw Object.assign(error, body);
        }
        return body;
      })
  }

  /**
   * This request provides Travel history data along with `id`, `name`, `email` (if `user_email` scope is authorized) and loyalty programs (if `user_loyalty` scope is authorized).
   *
   * `airports`, `airlines`, `aircrafts` contains entities along with count describing how many times the user has flown with this entity
   * `flights` contain all routes of the user
   * `hours` and `kilometers` show the total number of distance and time traveled
   * `last_year_hours` and `last_year_kilometers` show the number of distance and time traveled for the current year
   */
  getMyProfile({access_token}: {access_token: string}): PromiseLike<Response<UserProfile>> {
    return this.makeApiCall({
      method: 'GET',
      url: `/api/v1/me`,
      headers: {
        'Authorization': `Bearer ${access_token}`,
      },
    })
  }

  /**
   * Intended to use with server-side token.
   * Request provides the same data as in `getMyProfile` call, but for the given user ID.
   */
  getUserProfile({access_token, user_id}: {access_token: string, user_id: string}): PromiseLike<Response<UserProfile>> {
    return this.makeApiCall({
      method: 'GET',
      url: `/api/v1/users/${percentEncode(user_id)}`,
      headers: {
        'Authorization': `Bearer ${access_token}`,
      },
    })
  }

  /**
   * Returns a list of user's trips, from newest to oldest. `user_flights` scope is required for this request.
   * This request is paginated. The response contains the `next_url` to retrieve the next page of trips.
   * Note that due to implementation details the actual count of results may be less than the provided `limit` (even can be zero). You should rely on the `more` field of the response in order to determine the end of the pagination, not on the number of trips in the response.
   */
  getMyTrips({access_token, limit, url}: {access_token: string, limit?: number, url?: string}): PromiseLike<Response<{
    trips: UserTrip[],
    more: boolean,
    next_url: string,
  }>> {
    return this.makeApiCall({
      method: 'GET',
      url: url ? url.replace(BASE_URL, '') : `/api/v1/me/trips?limit=${percentEncode(`${limit}`)}`,
      headers: {
        'Authorization': `Bearer ${access_token}`,
      },
    })
  }
}
