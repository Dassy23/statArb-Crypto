const ccxt = require('ccxt');
const _ = require('lodash')


exports.initExchange = async (exchange) => {
    try {
        
        return new ccxt[exchange]({
            'commonCurrencies': {
                'USD': 'USD',
                'USDT': 'USD',
            },
        });
        
    } catch (e) {
        debugger
        return null
    }
}


exports.orderBook = async (exchange, market) => {
    try {
        let orders = await exchange.fetchOrderBook(market);
    
        if (orders == undefined) {
            return null
        } else {
            return orders
        }
    } catch (err) {
        debugger
        console.log(`${exchange.name} Exchange query error`);
        return 0
    }
};


exports.bestPrice = async (totalVolume, pair) => {
    try {
        //let exchanges = ccxt.exchanges
        //console.log(exchanges)
        let quote = pair.slice(0,-3)
        debugger
        let base = pair.slice(-3)
        pair = quote + '/' + base
        debugger
        let exchanges = ['kraken', 'binance', 'bittrex', 'quadrigacx', 'bitfinex', 'bitstamp', 'gemini', 'poloniex', 'cex', 'gdax' ]
        let exchangePromise = exchanges.map(x => {
            return this.initExchange(x)
        })
        let resolveExchange = await Promise.all(exchangePromise)
        debugger
        resolveExchange = resolveExchange.filter(x => x != null)
        //query exchanges for orderbooks
        let orderbooksPromise = resolveExchange.map(exchange => {
            debugger
            return this.orderBook(exchange, pair)
        })
        let orderbooks = await Promise.all(orderbooksPromise)
        debugger
        let values = orderbooks.map((exchangeOB, index) => {
            if (exchangeOB != 0) {
                return {
                    ...exchangeOB,
                    name: exchanges[index]
                }
            }
        }).filter(OB => OB != undefined || 0)
        
        //seperate asks and bids, concat the exchange name and fees
        let askPrice = values.map(exchange => {
            let side = exchange.asks
            let t = 0
            let orderArray = []
            for (let order in side) {
                orderArray.push({ price: side[order][0], volume: side[order][1] })
                t += side[order][1]
                if (totalVolume <= t) {
                    return { askPrices: orderArray, name: exchange.name}
                }
            }
            return { askPrices: orderArray, name: exchange.name }
        })
        
        let bidPrice = values.map(exchange => {
            let side = exchange.bids
            let t = 0
            let orderArray = []
            for (let order in side) {
                orderArray.push({ price: side[order][0], volume: side[order][1] })
                t += side[order][1]
                if (totalVolume <= t) {
                    return { bidPrices: orderArray, name: exchange.name}
                }
            }
            return { bidPrices: orderArray, name: exchange.name }
        })
        
        //get total cost of arbritrage orders. Count up the orderbook and combine prices and volumes to get accurate price 
        let arbitrageAsk = askPrice.map((exchange) => {
            try{
                
                let lastVal = exchange.askPrices[exchange.askPrices.length - 1]
                if (exchange.askPrices.length > 1) {
                    exchange.askPrices.pop()
                    let sumFunds = exchange.askPrices.reduce((accum, obj) => accum + (obj.volume * obj.price), 0);
                    let ExSumVolume = exchange.askPrices.reduce((accum, obj) => accum + (obj.volume), 0);
                    let leftoverVol = totalVolume - ExSumVolume
                    let lastFunds = lastVal.price * leftoverVol
                    return { cost: (sumFunds + lastFunds), exchange: exchange.name }
                } else {
                    return { cost: (exchange.askPrices[exchange.askPrices.length - 1].price * totalVolume), exchange: exchange.name }
                }
            } catch(e){
                return null
            }
        }).filter(x => x !== null)
        debugger
        let arbitrageBid = bidPrice.map((exchange) => {
            try{
                let lastVal = exchange.bidPrices[exchange.bidPrices.length - 1]
                if (exchange.bidPrices.length > 1) {
                    exchange.bidPrices.pop()
                    let sumFunds = exchange.bidPrices.reduce((accum, obj) => accum + (obj.volume * obj.price), 0);
                    let ExSumVolume = exchange.bidPrices.reduce((accum, obj) => accum + (obj.volume), 0);
                    let leftoverVol = totalVolume - ExSumVolume
                    let lastFunds = lastVal.price * leftoverVol
                    return { cost: (sumFunds + lastFunds), exchange: exchange.name }
                } else {
                    return { cost: (exchange.bidPrices[exchange.bidPrices.length - 1].price * totalVolume), exchange: exchange.name }
                }
            } catch(e){
                return null
            }
        }).filter(x => x !== null)
        debugger
        //sort and return the best prices
        let sortedAsks = _.orderBy(arbitrageAsk, 'cost', 'asc')
        let sortedBids = _.orderBy(arbitrageBid, 'cost', 'desc')
        let buy = {
            side: 'buy',
            ...sortedAsks[0],
            volume: totalVolume,
            market:pair,
            ts: Date.now()
        }
        let sell = {
            side: 'sell',
            ...sortedBids[0],
            volume:totalVolume,
            market:pair,
            ts: Date.now()
        }
        debugger
        return [buy, sell]
    } catch (e) {
        debugger
        console.log(e)
    }
}