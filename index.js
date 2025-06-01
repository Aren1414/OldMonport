const { PoolFetcher } = require('@kuru-labs/kuru-sdk');

const baseUrl = 'https://api.kuru.io';

const fetcher = new PoolFetcher(baseUrl);

console.log('Available methods on PoolFetcher:', Object.getOwnPropertyNames(Object.getPrototypeOf(fetcher)));
