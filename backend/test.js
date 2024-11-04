const request = require('supertest');
const app = require('../app'); // Path to your Express app

describe('POST /api/create_link_token', () => {
  it('should return a valid link token', async () => {
    const response = await request(app).post('/api/create_link_token');
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('link_token');
  });
});

import { render, screen, fireEvent } from '@testing-library/react';
import Subscribe from './Subscribe';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

describe('Plaid Link Success Handler', () => {
  beforeEach(() => {
    fetch.resetMocks();
  });

  it('should handle Plaid success and fetch transactions', async () => {
    fetch.mockResponses(
      [JSON.stringify({ link_token: 'mock-link-token' }), { status: 200 }],
      [JSON.stringify({ latest_transactions: [] }), { status: 200 }]
    );

    render(<Subscribe />);
    
    const connectButton = await screen.findByText(/Connect Your Bank/i);
    fireEvent.click(connectButton);
    
    expect(fetch).toHaveBeenCalledWith('http://localhost:5000/api/create_link_token', expect.anything());
    expect(fetch).toHaveBeenCalledWith('http://localhost:5000/api/transactions', expect.anything());
  });
});



