export interface CoinData {
  name: string;
  symbol?: string;
  rank: number;
  age: number;
  color: string;
  png32?: string;
  png64?: string;
  webp32?: string;
  webp64?: string;
  code: string;
  rate: number;
  volume: number;
  cap: number;
  delta: {
    hour: number;
    day: number;
    week: number;
    month: number;
    quarter: number;
    year: number | null;
  };
}

export interface TransformedCoin {
  id: string;
  name: string;
  ticker: string;
  price: number;
  marketCap: string;
  change: number;
  icon: string;
  imageUrl?: string;
  color: string;
  chartData: number[];
}
