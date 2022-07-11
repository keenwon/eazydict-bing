'use strict'

const debug = require('./debug')
const cheerio = require('cheerio')
const {
  EDOutput,
  Phonetic,
  Translate,
  Example,
  Suggest,
  CODES
} = require('eazydict-standard-output')
const { removeTagsAndSpaces } = require('./utils')

let $

function main (html) {
  try {
    return parser(html)
  } catch (e) {
    return new EDOutput(CODES.PARSE_ERROR, e.message)
  }
}

// 解析 HTML
function parser (html) {
  $ = cheerio.load(html, {
    decodeEntities: false
  })

  const $containor = $('.qdef')
  const $suggestContainor = $('.content')

  const output = new EDOutput()

  /**
   * containor 为空，可能是：
   *    1.中英混合单词
   *    2.错误页
   */
  if ((!$containor || !$containor.length) && (!$suggestContainor || !$suggestContainor.length)) {
    return output
  }

  output.phonetics = _parsePhonetics($containor)
  output.translates = _parseTrans($containor)

  const $exampleContainor = $('#sentenceCon')
  output.examples = _parseExamples($exampleContainor)

  output.suggests = _parseSuggests($suggestContainor)

  return output
}

// 提取音标
function _parsePhonetics ($containor) {
  const phonetics = []
  const $phoneticContainor = $containor.find('.hd_p1_1')

  if ($phoneticContainor.children().length) {
    // 英文，提取音标
    const html = $phoneticContainor.html()
    const data = removeTagsAndSpaces(html).split(/\s|&nbsp;/)

    debug(`phonetics parse html: ${html}`)
    debug(`phonetics parse content: ${data}`)

    if (data.length !== 4) {
      return phonetics
    }

    for (let i = 0, j = data.length; i < j;) {
      const phonetic = new Phonetic(data[i], data[i + 1])
      phonetics.push(phonetic)

      debug('phonetics object: %O', phonetic)

      i = i + 2
    }
  } else {
    // 中文，尝试提取拼音
    const pinyin = $phoneticContainor.text()

    if (pinyin) {
      const phonetic = new Phonetic('', pinyin)
      phonetics.push(phonetic)

      debug('phonetics object: %O', phonetic)
    }
  }

  return phonetics
}

// 提取翻译
function _parseTrans ($containor) {
  const trans = []

  $containor.find('li').each((index, item) => {
    const $li = $(item)
    const type = $li.find('.pos').text().replace('.', '')
    const tran = $li.find('.def').text()
    const result = new Translate(type, tran)

    debug(`translate parse html: ${$li.html()}`)
    debug('translate object: %O', result)

    trans.push(result)
  })

  return trans
}

// 提取例句
function _parseExamples ($containor) {
  const examples = []

  $containor.find('#sentenceSeg .se_li1').each((index, item) => {
    const $divs = $(item).children()
    const from = removeTagsAndSpaces($divs.eq(0).text())
    const to = removeTagsAndSpaces($divs.eq(1).text())
    const result = new Example(from, to)

    debug(`example parse 'from': ${from}`)
    debug(`example parse 'to': ${to}`)
    debug('example parse object: %O', result)

    examples.push(result)
  })

  return examples
}

// 提取搜索建议
function _parseSuggests ($containor) {
  const suggests = []

  $containor.find('.df_wb_c').each((index, item) => {
    const $div = $(item)
    const $word = $div.children('a')
    const $translate = $div.children('div')
    const word = removeTagsAndSpaces($word.html())
    const translate = removeTagsAndSpaces($translate.html())
    const suggest = new Suggest(word, translate)

    debug('suggest parse object: %O', suggest)

    suggests.push(suggest)
  })

  return suggests
}

module.exports = main
