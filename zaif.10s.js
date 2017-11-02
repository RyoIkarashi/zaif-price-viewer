#!/usr/bin/env /usr/local/bin/node

const bitbar = require('bitbar');
const zaif = require('zaif.jp');
const axios = require('axios');
const COINS = require('./coins');
const ENV = require('./env.json');
const COMPARATIVE_UNIT = 'jpy';

const privateApi = zaif.createPrivateApi(ENV.access_key, ENV.secret_key, 'user agent is node-zaif');
const publicApi = zaif.PublicApi;
const getBalance = privateApi.getInfo();

const getAllCoinsTrades = Object.keys(COINS).map(coin => publicApi.trades(`${COINS[coin].unit}_${COMPARATIVE_UNIT}`));
const getAllCoinsRate = Object.keys(COINS).map(coin => publicApi.lastPrice(`${COINS[coin].unit}_${COMPARATIVE_UNIT}`));
const mergeCoinsAndInfo = (info) => Object.keys(COINS).map((coin, index) => {
  const { rates, balances, trades } = info;
  return Object.assign({}, COINS[coin], {
    rate: rates[index].hasOwnProperty('last_price') ? rates[index].last_price : 0,
    trades: trades[index],
    balance: balances.hasOwnProperty(COINS[coin].unit) ? balances[COINS[coin].unit] : 0,
  })
});

const floatFormat = (number, n) => {
  const _pow = Math.pow(10 , n) ;
  return Math.round(number * _pow) / _pow;
}

axios.all([...getAllCoinsRate, ...getAllCoinsTrades, getBalance]).then(result => {
  const rates = result.slice(0, getAllCoinsRate.length);
  const trades = result.slice(getAllCoinsRate.length, getAllCoinsRate.length + getAllCoinsTrades.length);
  const balances = result.slice(getAllCoinsRate.length + getAllCoinsTrades.length)[0].funds;

  let totalBalance = balances.jpy;

  const coinsInfo = mergeCoinsAndInfo({ rates, balances, trades });

  const bitbarContent = coinsInfo.map((coin, index) => {
    const { name, image, unit, rate, balance, isTradePath, trades } = coin;

    const bids = trades.filter(trade => trade.trade_type === 'bid').map(bid => bid.amount);
    const asks = trades.filter(trade => trade.trade_type === 'ask').map(ask => ask.amount);

    const totalBids = bids.reduce((sum, value) => sum + value * rate, 1);
    const totalAsks = asks.reduce((sum, value) => sum + value * rate, 1);

    const difference = totalBids - totalAsks;
    const prefix = difference > 0 ? '+' : '';

    totalBalance += Number(rate) * Number(balance);

    return {
      text: `[${unit.toUpperCase()}] ${rate} (¥${prefix}${floatFormat(difference, 3)})`,
      color: difference < 0 ? ENV.colors.red : ENV.colors.green,
      href: `https://zaif.jp/trade${isTradePath ? '/' : '_'}${unit}_jpy`
    };
  });

  bitbar([
    `[Z] ¥${totalBalance}`,
    bitbar.sep,
    ...bitbarContent,
  ]);
});
