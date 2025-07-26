import { CoinData } from '../types/coin';

const API_BASE_URL = 'https://api.livecoinwatch.com';

export const fetchCoinsList = async (offset: number = 0, limit: number = 50): Promise<CoinData[]> => {
  try {
    const response = await fetch(new Request(`${API_BASE_URL}/coins/list`), {
      method: 'POST',
      headers: new Headers({
        'content-type': 'application/json',
        'x-api-key': process.env.EXPO_PUBLIC_API_KEY || '',
      }),
      body: JSON.stringify({
        currency: 'USD',
        sort: 'rank',
        order: 'ascending',
        offset,
        limit,
        meta: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching coins list:', error);
    throw error;
  }
};

