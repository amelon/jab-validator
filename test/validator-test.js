/*jshint node:true */
/*global describe, it, before */

'use strict';
process.env.NODE_ENV = 'test';

var expect      = require('chai').expect;
var validator   = require('../index');

describe('validator', function() {

  describe('sanitize', function() {
    it('should have `string` functions', function() {
      var sanitize = validator.sanitize;
      var string_fns = [
          'capitalize', 'camelize', 'collapseWhitespace', 'dasherize'
        , 'ensureLeft', 'ensureRight', 'humanize', 'slugify'
        , 'stripTags', 'underscore', 'replaceAll'
        ];

      var sanitize_instance = sanitize('');

      string_fns.forEach(function(fn) {
        expect(sanitize_instance).to.have.property(fn);
      });
    });
  });


  describe('check', function() {
    it('should not throw errors on invalid check', function() {
      var check = validator.check;

      var fn = function(){ check('x').isInt() };

      expect(fn).to.not.throw(Error);
    });

    it('should return error list with getErrors', function() {
      var check = validator.check;

      var err = check('x').isInt().getErrors();

      expect(err).to.have.length(1);

    });

    it('should not return errors on clean check', function() {
      var check = validator.check;
      var err = check('123').isInt().getErrors();
      expect(err).to.have.length(0);

    });
  });
});