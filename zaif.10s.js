#!/usr/bin/env /usr/local/bin/node

// <bitbar.title>Zaif Price Viewer</bitbar.title>
// <bitbar.version>v1.0</bitbar.version>
// <bitbar.author>Ryo Ikarashi</bitbar.author>
// <bitbar.author.github>RyoIkarashi</bitbar.author.github>
// <bitbar.desc>Display the spot JPY prices of cryptocurrencies and your current balance in zaif.jp</bitbar.desc>
// <bitbar.image>https://user-images.githubusercontent.com/5750408/32333718-ec1d99e6-c02b-11e7-8990-c26f6629a1df.png</bitbar.image>
// <bitbar.dependencies>node</bitbar.dependencies>
// <bitbar.abouturl>https://github.com/RyoIkarashi/zaif-price-viewer</bitbar.abouturl>

// If you feel this little tool gives you some value, tips are always welcome at the following addresses!
// Bitcoin: 1DrLPjzmNHtkdBstd82xvCxGY38PnKauRH
// Mona:    MC7XMmi1YXoJH19D1q4H8ijBkdvarWBTMi

const bitbar = require('bitbar');
const zaif   = require('zaif.jp');
const axios  = require('axios');
let COINS    = require('./coins');
const ENV    = require('./env.json');
const COMPARATIVE_UNIT = 'jpy';

COINS = Object.keys(COINS).map(coin => {
  COINS[coin].unit = COINS[coin].isTradePath ? COINS[coin].unit.toUpperCase() : COINS[coin].unit
  return COINS[coin]
})

const privateApi = zaif.createPrivateApi(ENV.access_key, ENV.secret_key, 'user agent is node-zaif');
const publicApi  = zaif.PublicApi;
const getBalance = privateApi.getInfo();

const getAllCoinsTrades = Object.keys(COINS).map(coin => publicApi.trades(`${COINS[coin].unit}_${COMPARATIVE_UNIT}`));
const getAllCoinsRate   = Object.keys(COINS).map(coin => publicApi.lastPrice(`${COINS[coin].unit}_${COMPARATIVE_UNIT}`));
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
  const rates    = result.slice(0, getAllCoinsRate.length);
  const trades   = result.slice(getAllCoinsRate.length, getAllCoinsRate.length + getAllCoinsTrades.length);
  const balances = result.slice(getAllCoinsRate.length + getAllCoinsTrades.length)[0].funds;

  let totalBalance = 0;

  const coinsInfo  = mergeCoinsAndInfo({ rates, balances, trades });
  const currencies = coinsInfo.filter(coin => coin.type === 'currency');
  const tokens     = coinsInfo.filter(coin => coin.type === 'token');

  const bitbarContent = (coins) => coins.map((coin, index) => {
    const { name, image, unit, rate, balance, isTradePath, trades } = coin;

    const bids = trades.filter(trade => trade.trade_type === 'bid').map(bid => bid.amount);
    const asks = trades.filter(trade => trade.trade_type === 'ask').map(ask => ask.amount);

    const totalBids = bids.reduce((sum, value) => sum + value * rate, 1);
    const totalAsks = asks.reduce((sum, value) => sum + value * rate, 1);

    const difference = totalBids - totalAsks;
    const prefix     = difference > 0 ? '+' : '';

    totalBalance += Number(rate) * Number(balance);

    return {
      text: `[${unit.toUpperCase()}] ¥${rate} (¥${prefix}${floatFormat(difference, 3)}) / ¥${floatFormat(Number(rate) * Number(balance), 3)}`,
      color: difference < 0 ? ENV.colors.red : ENV.colors.green,
      href: `https://zaif.jp/trade${isTradePath ? '/' : '_'}${unit.toLowerCase()}_jpy`
    };
  });

  const currenciesContent = bitbarContent(currencies);
  const tokensContent = bitbarContent(tokens);

  bitbar([
    `¥${floatFormat(totalBalance, 3)}`,
    bitbar.sep,
    "CURRENCIES",
    ...currenciesContent,
    bitbar.sep,
    "TOKENS",
    ...tokensContent,
    bitbar.sep,
    "JPY",
    `¥${balances.jpy}`,
    bitbar.sep,
    "Total Balance (JPY inc)",
    `¥${floatFormat(totalBalance + balances.jpy, 3)}`,
  ]);
});
