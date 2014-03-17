/*jshint node:true */
/*global describe, it, before */

'use strict';
process.env.NODE_ENV = 'test';

var expect      = require('chai').expect;
var validator   = require('../index').validator;


describe('validator', function() {

  describe('sanitize', function() {
    it('should have `string` functions', function() {
      var string_fns = [
          'capitalize', 'camelize', 'collapseWhitespace', 'dasherize'
        , 'ensureLeft', 'ensureRight', 'humanize', 'slugify'
        , 'stripTags', 'underscore', 'replaceAll'
        ];

      string_fns.forEach(function(fn) {
        expect(validator).to.have.property(fn);
      });
    });
  });


  describe('check', function() {
    it('should not throw errors on invalid check', function() {
      var fn = function(){ validator.isInt('x') };

      expect(fn).to.not.throw(Error);
    });

    it('should return false when wrong', function() {
      var isOk = validator.isInt('x');

      expect(isOk).to.be.false;

    });

    it('should return true on clean check', function() {
      var isOk = validator.isInt('123');
      expect(isOk).to.be.true;

    });
  });
});