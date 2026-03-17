import React from 'react';
import { render } from '@testing-library/react';
import { AuthProvider } from './auth/AuthContext';
import App from './App';

test('renders without crashing', () => {
  const { baseElement } = render(
    <AuthProvider>
      <App />
    </AuthProvider>
  );
  expect(baseElement).toBeDefined();
});
