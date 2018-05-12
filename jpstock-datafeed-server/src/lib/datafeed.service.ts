import { Component, HttpStatus } from '@nestjs/common';

import * as IDatafeed from './datafeed-api.d';
import * as fetch from 'isomorphic-fetch';
import { Hesonogoma, GoogleFinance, GApiOutPut } from 'ns-findata';

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

  async resolveSymbol(symbolName: string) {
    const res = <string[][]>await hg.getFindDataInfo(hg.Data.FirstSection);
    if (!res || res.length === 0) {
      return;
    }
    const symbolInfo = res.find(o => {
      return o[0] === symbolName;
    });
    if (!symbolInfo) {
      return;
    }
    return {
      name: symbolInfo[1],
      full_name: symbolInfo[1],
      ticker: symbolInfo[0],
      description: symbolInfo[1] + ' - ' + symbolInfo[2],
      type: '股票',
      session: '0900-1100,1230-1500',
      exchange: '东京证券交易所',
      listed_exchange: '东京证券交易所',
      timezone: 'Asia/Tokyo',
      pricescale: 1,
      minmov: 1,
      has_intraday: true,
      supported_resolutions,
      has_daily: true,
      has_weekly_and_monthly: true,
      has_no_volume: false,
      sector: symbolInfo[2],
      industry: symbolInfo[3],
      currency_code: '日元',
    };
  }

  async getHistory(symbolName: string, from: number, to: number, resolution: string) {
    let i = 60, p = '1M';
    switch (resolution) {
      case '5':
        i = 5 * 60
        break;
      case '15':
        i = 15 * 60
        break;
      case '30':
        i = 30 * 60
        break;
      case '60':
        i = 60 * 60
        break;
      case '1D':
        i = 24 * 60 * 60
        p = '3M';
        break;
      case '1W':
        i = 7 * 24 * 60 * 60
        p = '1y'
        break;
      case '1M':
        p = '5y'
        i = 4 * 7 * 24 * 60 * 60
        break;
    }
    const opt = {
      q: symbolName,
      x: 'TYO',
      p, i
    };
    const hisRes = await GoogleFinance.getHistory(opt);
    const t: number[] = [], c: number[] = [], o: number[] = [], l: number[] = [], h: number[] = [], v: number[] = [];
    hisRes.forEach((obj: GApiOutPut) => {
      t.push(obj.time);
      if (obj.close) {
        c.push(obj.close);
      }
      if (obj.open) {
        o.push(obj.open);
      }
      if (obj.low) {
        l.push(obj.low);
      }
      if (obj.high) {
        h.push(obj.high);
      }
      if (obj.volume) {
        v.push(obj.volume);
      }
    })

    if (hisRes.length === 0) {
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
    const res = <string[][]>await hg.getFindDataInfo(hg.Data.FirstSection);
    if (!res || res.length === 0) {
      return;
    }
    const searchItems: IDatafeed.SearchSymbolResultItem[] = [];
    res.forEach(o => {
      if (o && o.length !== 0) {
        const item: IDatafeed.SearchSymbolResultItem = {
          symbol: o[0],
          full_name: o[1],
          description:  o[1] + ' - ' + o[2],
          exchange: '东京证券交易所',
          ticker: o[0],
          type: '股票'
        };
        searchItems.push(item);
      }
    });
    return searchItems;
  }

}
