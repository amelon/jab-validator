var validator = require('validator')
  , S         = require('string');

var slice  = Array.prototype.slice;


validator.extend('capitalize', function(str) {
  return S(str).capitalize().s;
});

validator.extend('lowercase', function(str) {
  return str.toLowerCase();
});

validator.extend('uppercase', function(str) {
  return str.toUpperCase();
});

validator.extend('camelize', function(str) {
  return S(str).camelize().s;
});


validator.extend('collapseWhitespace', function(str) {
  return S(str).collapseWhitespace().s;
});

validator.extend('dasherize', function(str) {
  return S(str).dasherize().s;
})

validator.extend('ensureLeft', function(str, prefix) {
  return S(str).ensureLeft(prefix).s;
});

validator.extend('ensureRight', function(str, suffix) {
  return S(str).ensureRight(suffix).s;
});

validator.extend('humanize', function(str) {
  return S(str).humanize().s;
});


validator.extend('slugify', function(str) {
  return S(str).slugify().s;
});

validator.extend('ifNull', function(str, replace) {
  return str.length === 0 ? replace : str;
})

validator.extend('stripTags', function(str /*, [tag1], [tag2], ...*/) {
  var s = S(str);
  var args = slice.call(arguments, 1);
  S.prototype.stripTags.apply(s, args);
});

validator.extend('underscore', function(str) {
  return S(str).underscore().s;
});

validator.extend('replaceAll', function(str, search, newstr) {
  return S(str).replaceAll(search, newstr).s;
});

validator.extend('notEmpty', function(str) {
  var res = str.trim();
  return res.length > 0;
});


module.exports = validator;