import { useState } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { apiRequest, ApiError } from '../lib/api';
import { AuthProvider, useAuth } from './AuthContext';

vi.mock('../lib/api', async () => {
  const actual = await vi.importActual<typeof import('../lib/api')>('../lib/api');
  return {
    ...actual,
    apiRequest: vi.fn(),
  };
});

const mockedApiRequest = vi.mocked(apiRequest);

function AuthProbe() {
  const auth = useAuth();
  const [result, setResult] = useState('idle');

  return (
    <div>
      <span data-testid="authenticated">{String(auth.isAuthenticated)}</span>
      <span data-testid="driver">{auth.driver?.name ?? 'none'}</span>
      <span data-testid="result">{result}</span>
      <button
        type="button"
        onClick={() => {
          void auth.login('driver@example.test', 'secret')
            .then(() => setResult('resolved'))
            .catch(() => setResult('rejected'));
        }}
      >
        login
      </button>
    </div>
  );
}

const loginResponse = {
  access_token: 'token-123',
  token_type: 'Bearer',
  user: {
    id: 1,
    name: 'Driver',
    email: 'driver@example.test',
    roles: ['Driver'],
  },
};

describe('AuthProvider login resilience', () => {
  beforeEach(() => {
    localStorage.clear();
    mockedApiRequest.mockReset();
  });

  test('uses the driver returned by login without a second request', async () => {
    mockedApiRequest.mockResolvedValueOnce({
      ...loginResponse,
      driver: {
        id: 7,
        code: 'D7',
        name: 'Driver Seven',
        email: 'driver@example.test',
        phone: null,
        company: { id: 2, name: 'Movvi' },
      },
    });

    render(<AuthProvider><AuthProbe /></AuthProvider>);
    fireEvent.click(screen.getByRole('button', { name: 'login' }));

    await waitFor(() => expect(screen.getByTestId('result')).toHaveTextContent('resolved'));
    expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
    expect(screen.getByTestId('driver')).toHaveTextContent('Driver Seven');
    expect(mockedApiRequest).toHaveBeenCalledTimes(1);
  });

  test('keeps a valid token when the legacy profile refresh times out', async () => {
    mockedApiRequest
      .mockResolvedValueOnce(loginResponse)
      .mockRejectedValueOnce(new ApiError('timeout', 0, null));

    render(<AuthProvider><AuthProbe /></AuthProvider>);
    fireEvent.click(screen.getByRole('button', { name: 'login' }));

    await waitFor(() => expect(screen.getByTestId('result')).toHaveTextContent('resolved'));
    expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
    expect(localStorage.getItem('movvi.access_token')).toBe('token-123');
  });

  test('rejects the session when the profile endpoint says the token is unauthorized', async () => {
    mockedApiRequest
      .mockResolvedValueOnce(loginResponse)
      .mockRejectedValueOnce(new ApiError('unauthorized', 401, null));

    render(<AuthProvider><AuthProbe /></AuthProvider>);
    fireEvent.click(screen.getByRole('button', { name: 'login' }));

    await waitFor(() => expect(screen.getByTestId('result')).toHaveTextContent('rejected'));
    expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
    expect(localStorage.getItem('movvi.access_token')).toBeNull();
  });
});
