import AppInTheAir from '../index'
import 'isomorphic-fetch';

declare var global: any;

describe('AppInTheAir', () => {
  let fetchMock: jest.Mock<typeof fetch>;
  beforeEach(() => {
    fetchMock = global.fetch = jest.fn(() => { throw new Error('Not implemented'); });
  });

  it('returns the correct url in getAuthUrl', () => {
    const client_id = 'client_id';
    const client_secret = 'client_secret';
    const sdk = new AppInTheAir({client_id, client_secret});

    const scope = 'user_email user_flights';
    const redirect_uri = 'https://domain.test/oauth';
    const url = sdk.getAuthUrl({scope, redirect_uri});


    expect(url).toContain('https://iappintheair.appspot.com/oauth/authorize');
    expect(url).toContain('client_id=' + encodeURIComponent(client_id));
    expect(url).toContain('scope=' + encodeURIComponent(scope));
    expect(url).toContain('redirect_uri=' + encodeURIComponent(redirect_uri));

    expect(url).not.toContain(encodeURIComponent(client_secret));
  });

  it('calls the right endpoint for getAccessToken', async () => {
    fetchMock.mockImplementationOnce(req => {
      return Promise.resolve(new Response(JSON.stringify({access_token: 'access_token'}), {
        headers: {
          'Content-Type': 'application/json',
        },
        status: 200,
        statusText: 'OK',
      }));
    })
    const client_id = 'client_id';
    const client_secret = 'client_secret';
    const sdk = new AppInTheAir({client_id, client_secret});

    const code = 'code';
    const redirect_uri = 'https://domain.test/oauth';
    const {access_token} = await sdk.getAccessToken({code, redirect_uri});

    expect(access_token).toEqual('access_token');
  });

  it('handles errors correctly in getAccessToken', async () => {
    fetchMock.mockImplementationOnce(req => {
      return Promise.resolve(new Response(JSON.stringify({error_description: 'Code expired'}), {
        headers: {
          'Content-Type': 'application/json',
        },
        status: 400,
        statusText: 'BAD REQUEST',
      }));
    })
    const client_id = 'client_id';
    const client_secret = 'client_secret';
    const sdk = new AppInTheAir({client_id, client_secret});

    const code = 'code';
    const redirect_uri = 'https://domain.test/oauth';
    await sdk.getAccessToken({code, redirect_uri})
      .then(() => {
        expect(false).toEqual(true);
      }, error => {
        expect(error.message).toEqual('Code expired');
      });
  });
});
