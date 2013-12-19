var validator = require('validator')
  , check     = validator.check
  , sanitize  = validator.sanitize
  , Validator = validator.Validator
  , Filter    = validator.Filter
  , S         = require('string');

var slice  = Array.prototype.slice;


Filter.prototype.capitalize = function() {
  this.modify(S(this.str).capitalize().s);
  return this.str;
};

Filter.prototype.lowercase = function() {
  this.modify(this.str.toLowerCase());
  return this.str;
};

Filter.prototype.uppercase = function() {
  this.modify(this.str.toUpperCase());
  return this.str;
};



Filter.prototype.camelize = function() {
  this.modify(S(this.str).camelize().s);
  return this.str;
};

Filter.prototype.collapseWhitespace = function() {
  this.modify(S(this.str).collapseWhitespace().s);
  return this.str;
};

Filter.prototype.dasherize = function() {
  this.modify(S(this.str).dasherize().s);
  return this.str;
};

Filter.prototype.ensureLeft = function(prefix) {
  this.modify(S(this.str).ensureLeft(prefix).s);
  return this.str;
};

Filter.prototype.ensureRight = function(suffix) {
  this.modify(S(this.str).ensureRight(suffix).s);
  return this.str;
};

Filter.prototype.humanize = function() {
  this.modify(S(this.str).humanize().s);
  return this.str;
};

Filter.prototype.slugify = function() {
  this.modify(S(this.str).slugify().s);
  return this.str;
};

Filter.prototype.stripTags = function(/*[tag1], [tag2], ...*/) {
  var s = S(this.str);
  this.modify(S.prototype.stripTags.apply(s, arguments));
  return this.str;
};

Filter.prototype.underscore = function() {
  this.modify(S(this.str).underscore().s);
  return this.str;
};

Filter.prototype.replaceAll = function(ss, newstr) {
  this.modify(S(this.str).replaceAll(ss, newstr).s);
  return this.str;
};


Filter.prototype.custom = function(custom_fn) {
  this.modify(custom_fn(this.str));
  return this.str;
};


Validator.prototype.custom = function(custom_fn) {
  var args = slice(arguments, 1);
  if (!custom_fn.apply(this, [this.str].concat(args))) {
    this.error(this.msg || (this.str + ' custom error'));
  }
};


Validator.prototype.error = function (msg) {
    this._errors.push(msg);
    return this;
};

Validator.prototype.getErrors = function () {
    return this._errors;
};

module.exports = {
  check: check
, sanitize: sanitize
, Validator: Validator
, Filter: Filter
};