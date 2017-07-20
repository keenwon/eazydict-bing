'use strict';

/* eslint-disable no-console, max-nested-callbacks, global-require */

const proxyquire = require('proxyquire').noPreserveCache();
const fetch = require('./lib/fetch');

fetch['@global'] = true;

const stubs = {
  'node-fetch': fetch
};

let bing;
let resetData;

/**
 * 区分"线上测试"和"集成测试"
 */
if (process.env.NODE_ENV === 'testing') {
  bing = proxyquire('../index.js', stubs);
  resetData = fetch.resetData;
} else {
  bing = require('../index.js');
  resetData = () => {
    // do nothing
  };
}

const mocha = require('mocha');
const chai = require('chai');
const Joi = require('joi');
const chaiJoi = require('chai-joi');
const chaiAsPromised = require('chai-as-promised');
chai.should();
chai.use(chaiJoi);
chai.use(chaiAsPromised);

describe('主程序测试', function () {

  describe('# 功能测试', function () {

    it('英文单词', function () {
      fetch.resetData('en_word');

      const schema = Joi.object({
        phonetics: Joi.array().length(2).required(),
        translates: Joi.array().length(2).required(),
        examples: Joi.array().length(10).required()
      }).unknown().required();

      return bing('world')
        .then(result => {
          Joi.validate(result, schema).should.validate;
        });
    });

    it('英文短语', function () {
      fetch.resetData('en_phrase');

      const schema = Joi.object({
        phonetics: Joi.array().length(0).required(),
        translates: Joi.array().length(2).required(),
        examples: Joi.array().length(10).required()
      }).unknown().required();

      return bing('hello world')
        .then(result => {
          Joi.validate(result, schema).should.validate;
        });
    });

    it('中文单词', function () {
      fetch.resetData('cn_word');

      const schema = Joi.object({
        phonetics: Joi.array().length(1).required(),
        translates: Joi.array().length(2).required(),
        examples: Joi.array().length(10).required()
      }).unknown().required();

      return bing('世界')
        .then(result => {
          Joi.validate(result, schema).should.validate;
        });
    });

    it('中文短语', function () {
      fetch.resetData('cn_phrase');

      const schema = Joi.object({
        phonetics: Joi.array().length(0).required(),
        translates: Joi.array().length(1).required(),
        examples: Joi.array().length(10).required()
      }).unknown().required();

      return bing('你好世界')
        .then(result => {
          Joi.validate(result, schema).should.validate;
        });
    });

    it('中英单词', function () {
      fetch.resetData('en_cn_word');

      const schema = Joi.object({
        phonetics: Joi.array().length(0).required(),
        translates: Joi.array().length(0).required(),
        examples: Joi.array().length(10).required()
      }).unknown().required();

      return bing('hello世界')
        .then(result => {
          Joi.validate(result, schema).should.validate;
        });
    });

    it('中英短语', function () {
      fetch.resetData('en_cn_phrase');

      const schema = Joi.object({
        phonetics: Joi.array().length(0).required(),
        translates: Joi.array().length(0).required(),
        examples: Joi.array().length(10).required()
      }).unknown().required();

      return bing('hello 世界')
        .then(result => {
          Joi.validate(result, schema).should.validate;
        });
    });

    it('数字', function () {
      fetch.resetData('number');

      const schema = Joi.object({
        phonetics: Joi.array().length(0).required(),
        translates: Joi.array().length(0).required(),
        examples: Joi.array().length(10).required()
      }).unknown().required();

      return bing('123')
        .then(result => {
          Joi.validate(result, schema).should.validate;
        });
    });

    it('插件名和 URL', function () {
      fetch.resetData('en_word');

      const url = `http://cn.bing.com/dict/search?q=${encodeURIComponent('test')}`;
      const schema = Joi.object({
        pluginName: Joi.string().equal('Bing').required(),
        url: Joi.string().equal(url).required()
      }).unknown().required();

      return bing('test')
        .then(result => {
          Joi.validate(result, schema).should.validate;
        });
    });
  });

  describe('# 异常测试', function () {

    it('查询乱码 & 错误页等', function () {
      fetch.resetData('error');

      const schema = Joi.object({
        phonetics: Joi.array().length(0).required(),
        translates: Joi.array().length(0).required(),
        error: Joi.any().optional()
      }).unknown().required();

      return bing('#WQE')
        .then(result => {
          Joi.validate(result, schema).should.validate;
        });
    });

    it('查询乱码', function () {
      fetch.resetData('notfound');

      const schema = Joi.object({
        phonetics: Joi.array().length(0).required(),
        translates: Joi.array().length(0).required(),
        error: Joi.any().optional()
      }).unknown().required();

      return bing('////')
        .then(result => {
          Joi.validate(result, schema).should.validate;
        });
    });

    it('查询空关键字', function () {
      fetch.resetData('notfound')

      return bing('')
        .should
        .eventually
        .rejected;
    });

    it('网络异常', function () {
      this.timeout(8000);

      fetch.resetData('network_error');

      const schema = Joi.object({
        phonetics: Joi.array().empty().required(),
        translates: Joi.array().empty().required(),
        error: Joi.object({
          code: Joi.number().integer(1).required(),
          type: Joi.string().optional(),
          message: Joi.string().allow('').optional()
        })
      }).unknown().required();

      return bing('network_error')
        .then(result => {
          Joi.validate(result, schema).should.validate;
        });
    });

  });

});