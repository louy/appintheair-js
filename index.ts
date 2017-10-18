export interface Options {
  client_id: string,
  client_secret: string,
}

/** A white-space separated list of scopes. Valid scopes are: user_email, user_info and user_flights */
export type Scope = string;

const BASE_URL = 'https://iappintheair.appspot.com/';

interface MakeApiCallRequest {
  method: 'GET'|'POST'|'PUT'|'DELETE',
  url: string,
  headers?: object,
}

export type Flight = any;
export type Hotel = any;
export type CarRental = any;

export interface UserProfile {
  id: string,
  name: string,
  /** if `user_email` scope is authorized */
  email?: string,
  airports?: any[],
  airlines?: any[],
  aircrafts?: any[],
  flights?: Flight[],
  hours?: number,
  kilometers?: number,
  last_year_hours?: number,
  last_year_kilometers?: number,
}

export interface UserTrip {
  flights: Flight[],
  /** if `user_hotels` scope is authorized */
  hotels?: Hotel[],
  /** if `user_car_rentals` scope is authorized */
  car_rentals?: CarRental[],
}

export default class AppInTheAir {
  readonly client_id: string;
  readonly client_secret: string;

  constructor({client_id, client_secret}: Options) {
    this.client_id = client_id;
    this.client_secret = client_secret;
  }

  getAuthUrl({scope, redirect_uri}: {scope: Scope, redirect_uri: string}): string {
    return `${BASE_URL}/oauth/authorize?client_id=${encodeURIComponent(this.client_id)}&response_type=code&redirect_uri=${encodeURIComponent(redirect_uri)}&scope=${encodeURIComponent(scope)}`
  }

  getAccessToken({code, redirect_uri}: {code: string, redirect_uri: string}): PromiseLike<{
    access_token: string,
    refresh_token: string,
  }> {
    return this.makeApiCall({
      method: 'GET',
      url: `/oauth/token?client_id=${encodeURIComponent(this.client_id)}&client_secret=${encodeURIComponent(this.client_secret)}&grant_type=authorization_code&code=${encodeURIComponent(code)}&redirect_uri=${encodeURIComponent(redirect_uri)}`
    })
  }

  refreshAccessToken({refresh_token, redirect_uri}: {refresh_token: string, redirect_uri: string}): PromiseLike<{
    access_token: string,
    refresh_token: string,
  }> {
    return this.makeApiCall({
      method: 'GET',
      url: `/oauth/token?client_id=${encodeURIComponent(this.client_id)}&client_secret=${encodeURIComponent(this.client_secret)}&grant_type=refresh_token&refresh_token=${encodeURIComponent(refresh_token)}`
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
      url: `/oauth/token?client_id=${encodeURIComponent(this.client_id)}&client_secret=${encodeURIComponent(this.client_secret)}&scope=${encodeURIComponent(scope)}&grant_type=client_credentials`
    })
  }

  private makeApiCall({
    method,
    url,
  }: MakeApiCallRequest): PromiseLike<any> {
    throw new Error('Not implemented');
  }

  getMyProfile({access_token}: {access_token: string}): PromiseLike<UserProfile> {
    return this.makeApiCall({
      method: 'GET',
      url: `/api/v1/me`,
      headers: {
        'Authorization': `Bearer ${access_token}`,
      },
    })
  }

  getUserProfile({access_token, user_id}: {access_token: string, user_id: string}): PromiseLike<UserProfile> {
    return this.makeApiCall({
      method: 'GET',
      url: `/api/v1/users/${encodeURIComponent(user_id)}`,
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
  getMyTrips({access_token, limit}: {access_token: string, limit?: number}): PromiseLike<{
    trips: UserTrip[],
    more: any,
    next_url: string,
  }> {
    return this.makeApiCall({
      method: 'GET',
      url: `/api/v1/me?limit=${encodeURIComponent(`${limit}`)}`,
      headers: {
        'Authorization': `Bearer ${access_token}`,
      },
    })
  }
}
