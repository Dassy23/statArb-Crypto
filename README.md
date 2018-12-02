# statArb-Crypto

## Definition
```
The basic statistical arbitrage is a trading strategy that assumes that the price-series of two assets put into a pair (stocks or, in our case, cryptocurrencies) are non-stationary and mean reverting over time. In other words, when one coin in a pair outperforms the other, the poorer performing coin is bought long with the expectation that it will climb towards its outperforming partner, the other is sold short.
```

## Steps
```
1) Find related cryptocurrencies - market cap, avg traded volume, utility/smart contract platform/stable?
2) Calculate the spread -> priceA/priceB
3) Calculate the standard dev, mean, z-score of pair ratio
4) Test for co-integration -> Augmented Dicky Fuller Test (ADF Test)
5) Generate signals
6) Backtest or make live trades
7) Report 

```

