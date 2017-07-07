'use strict';

const cheerio = require('cheerio');
const {
  EDOutput,
  Phonetic,
  Translate,
  CODES
} = require('eazydict-standard-output');
const {
  removeTagsAndSpaces
} = require('./utils');

let $;

function main(html) {
  try {
    return parser(html);
  } catch (e) {
    return new EDOutput(CODES.PARSE_ERROR);
  }
}

/**
 * 解析 HTML
 */
function parser(html) {
  $ = cheerio.load(html, {
    decodeEntities: false
  });

  const $containor = $('.qdef');

  const output = new EDOutput();

  /**
   * containor 为空，可能是：
   *    1.中英混合单词
   *    2.错误页
   */
  if (!$containor || !$containor.length) {
    return output;
  }

  output.phonetics = _parsePhonetics($containor);
  output.translates = _parseTrans($containor);

  return output;
}

/**
 * 提取音标
 */
function _parsePhonetics($containor) {
  let phonetics = [];
  let $phoneticContainor = $containor.find('.hd_p1_1');

  if ($phoneticContainor.children().length) {
    // 英文，提取音标
    let html = $phoneticContainor.html();
    let data = removeTagsAndSpaces(html).split(' ');

    if (data.length !== 4) {
      return phonetics;
    }

    for (let i = 0, j = data.length; i < j;) {
      phonetics.push(new Phonetic(data[i], data[i + 1]))
      i = i + 2;
    }
  } else {
    // 中文，尝试提取拼音
    let pinyin = $phoneticContainor.text();

    if (pinyin) {
      phonetics.push(new Phonetic('', pinyin));
    }
  }

  return phonetics;
}

/**
 * 提取翻译
 */
function _parseTrans($containor) {
  let trans = [];

  $containor.find('li').each((index, item) => {
    let $li = $(item);
    let type = $li.find('.pos').text().replace('\.', '');
    let tran = $li.find('.def').text();
    let result = new Translate(type, tran);

    trans.push(result);
  });

  return trans;
}

module.exports = main;
