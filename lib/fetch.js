'use strict';

const debug = require('./debug');
const fetch = require('node-fetch');
const pRetry = require('p-retry');
const proxy = require('./proxy');
const defaultConfigs = require('../config');

/**
 * 模拟浏览器的头信息
 */
/* eslint-disable max-len */
const headers = new fetch.Headers({
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
  'Accept-Encoding': 'gzip, deflate',
  'Accept-Language': 'zh-CN,zh;q=0.8',
  'Cache-Control': 'no-cache',
  'Connection': 'keep-alive',
  'Host': 'cn.bing.com',
  'Pragma': 'no-cache',
  'Referer': 'http://cn.bing.com/dict/?FORM=Z9LH3',
  'Upgrade-Insecure-Requests': '1',
  'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.104 Safari/537.36'
});
/* eslint-enable max-len */

function main(url, configs = {}) {
  let config = Object.assign({}, defaultConfigs, configs);

  debug('use configs: %O', config);

  let retryOptions = {
    retries: config.retries
  };

  let fetchOptions = {
    headers,
    timeout: config.timeout,
    agent: proxy(config.proxy)
  };

  return pRetry(() => {
    return fetch(url, fetchOptions)
      .then(res => res.text())
  }, retryOptions);
}


module.exports = main;