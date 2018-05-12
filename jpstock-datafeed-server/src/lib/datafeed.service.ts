import { Component, HttpStatus } from '@nestjs/common';
import { ReqParam} from '../types';

import * as IDatafeed from './datafeed-api.d';
import * as fetch from 'isomorphic-fetch';
import { Hesonogoma, GoogleFinance, GApiOutPut } from 'ns-findata';
import * as getData from './ajax';
import * as nanoajax from 'nanoajax';
import { Util } from 'ns-common';
import * as md5 from 'md5';

export interface UdfCompatibleConfiguration extends IDatafeed.DatafeedConfiguration {
  supports_search?: boolean;
  supports_group_request?: boolean;
}

const hg: Hesonogoma = new Hesonogoma();
const supported_resolutions = ['1', '5', '15', '30', '60', '1D', '1W', '1M'];

@Component()
export class DatafeedService {
  constructor() { }

  getConfig(): UdfCompatibleConfiguration {
    return {
      supports_search: true,
      supports_group_request: false,
      supported_resolutions,
      supports_marks: false,
      supports_time: true
    };
  }

  getServerTime() {
    return Math.floor(Date.now() / 1000) + '';
  }

  async gettest(symbolName: string, from: number, to: number, resolution: string) {
    // return await getData.Finance.get();
    // return md5('message');
    let time = 'kline_1m'
    switch (resolution) {
      case '5':
      time = 'kline_5m'
        break;
      case '15':
      time = 'kline_15m'
        break;
      case '30':
      time = 'kline_30m'
        break;
      case '60':
      time = 'kline_1h'
        break;
      case '1D':
      time = 'kline_1d'
        break;
      case '1W':
      time = 'kline_1w'
        break;
    }
    const res = await getData.Finance.currencyList();
    let currencyiID ;
    res.currency_list.USDT.forEach((obj) => {
      if ( obj.currency_mark === symbolName.toUpperCase()) {
          currencyiID = obj.currency_id
      }
    })
    const opt = {
      currency_mark: symbolName,
      currency: currencyiID,
      basemark: '104',
      time: time,
      ts: Math.floor(Date.now() / 1000)
    };
    return await getData.Finance.getHistory(opt);
  }

  async resolveSymbol(symbolName: string) {
    const reslist = await getData.Finance.currencyList();
    const res = reslist.currency_list.USDT
    if (!res || res.length === 0) {
      return;
    }
    const symbolInfo = res.find(o => {
      return o.currency_mark === symbolName;
    });
    if (!symbolInfo) {
      return;
    }
    return {
      name: symbolInfo.currency_mark,
      full_name: symbolInfo.currency_name,
      ticker: symbolInfo.currency_mark,
      description: symbolInfo.currency_mark + ' - ' + symbolInfo.currency_name,
      type: '交易所',
      session: '24*7',
      exchange: 'digifinex交易所',
      listed_exchange: 'digifinex交易所',
      timezone: 'Asia/Shanghai',
      pricescale: 8,
      minmov: 1,
      has_intraday: true,
      supported_resolutions,
      has_daily: true,
      has_weekly_and_monthly: true,
      has_no_volume: false,
      sector: symbolInfo.currency_name,
      industry: '交易所',
      currency_code: 'USDT',
    };
  }

  async getHistory(symbolName: string, from: number, to: number, resolution: string) {
    let time = 'kline_1m'
    switch (resolution) {
      case '5':
      time = 'kline_5m'
        break;
      case '15':
      time = 'kline_15m'
        break;
      case '30':
      time = 'kline_30m'
        break;
      case '60':
      time = 'kline_1h'
        break;
      case '1D':
      time = 'kline_1d'
        break;
      case '1W':
      time = 'kline_1w'
        break;
    }
    const res = await getData.Finance.currencyList();
    let currencyiID ;
    res.currency_list.USDT.forEach((obj) => {
      if ( obj.currency_mark === symbolName.toUpperCase()) {
          currencyiID = obj.currency_id
      }
    })
    const opt = {
      currency_mark: symbolName,
      currency: currencyiID,
      basemark: '104',
      time: time,
      ts: Math.floor(Date.now() / 1000)
    };
    const HisData = await getData.Finance.getHistory(opt);

    const t: number[] = [], c: number[] = [], o: number[] = [], l: number[] = [], h: number[] = [], v: number[] = [];
    HisData[time].forEach((obj) => {
      t.push(obj[0]);
      if (obj[5]) {
        c.push(obj[5]);
      }
      if (obj[2]) {
        o.push(obj[2]);
      }
      if (obj[4]) {
        l.push(obj[4]);
      }
      if (obj[3]) {
        h.push(obj[3]);
      }
      if (obj[1]) {
        v.push(obj[1]);
      }
    })

    if (HisData.length === 0) {
      return {
        s: 'no_data'
      }
    }
    return { s: 'ok', t, c, o, l, h, v};
  }

  async searchSymbols(
    userInput: string,
    exchange: string,
    symbolType: string,
    maxRecords?: number,
  ): Promise<IDatafeed.SearchSymbolResultItem[] | undefined> {
    const reslist = await getData.Finance.currencyList();
    const res = reslist.currency_list.USDT
    if (!res || res.length === 0) {
      return;
    }
    const searchItems: IDatafeed.SearchSymbolResultItem[] = [];
    res.forEach(o => {
      if (o && o.length !== 0) {
        const item: IDatafeed.SearchSymbolResultItem = {
          symbol: o.currency_mark,
          full_name: o.currency_name,
          description:  o.currency_intro,
          exchange: 'digifinex',
          ticker: o.currency_mark,
          type: '交易所'
        };
        searchItems.push(item);
      }
    });
    return searchItems;
  }

}
