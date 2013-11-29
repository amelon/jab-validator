var validator = require('./validator')
  , Validator = validator.Validator
  , Filter    = validator.Filter
  , sanitize  = validator.sanitize
  , _         = require('lodash');


var config = {
  configurable: true,
  value: function() {
    var alt = {};
    var storeKey = function(key) {
      alt[key] = this[key];
    };
    Object.getOwnPropertyNames(this).forEach(storeKey, this);
    return alt;
  }
};

Object.defineProperty(Error.prototype, 'toJSON', config);


var slice  = Array.prototype.slice;


function isCleaner(fn) {
  return fn.t === 'c';
}



function validate(method) {
  var args = slice.call(arguments, 1)
    , fn, msg;

  if (_.isPlainObject(method)) {
    msg = method.msg || '';
    method = method.fn;
  }

  if (method == 'required') {
    method = 'notEmpty';
  }

  if (!_.has(Validator.prototype, method)) {
    return new Error('validate does not support ' + method);
  }

  fn = function(validator) {
    validator[method].apply(validator, args);
  };

  if (msg) {
    fn.msg = {};
    fn.msg[method] = msg;
  } else {
    fn.msg = false;
  }

  if (method == 'required' || method == 'notEmpty') {
    fn.t = 'r';
  } else {
    fn.t = 'v';
  }
  return fn;
}




function clean(method) {
  var args = slice.call(arguments, 1)
    , fn;


  if (!_.has(Filter.prototype, method)) {
    return new Error('clean does not support ' + method);
  }

  fn = function(sanitizer) {
    return sanitizer[method].apply(sanitizer, args);
  };

  fn.t = 'c';
  return fn;
}



Validator.prototype.error = function (msg) {
  this._errors.push(msg);
  return this;
};

Validator.prototype.getErrors = function () {
  return this._errors;
};



function builder(constraints) {
  var schema = {};
  var build_errors = [];
  build(constraints, schema, build_errors);
  if (build_errors.length) {
    var error = new Error('builder error: ' + formatErrors(build_errors));
    error.build = build_errors;
    throw error;
  }

  return new ObjectCleaner(schema);
}


function formatErrors(errors) {
  var res = [];
  errors.forEach(function(error) {
    res.push(error.message);
  });
  return res.join(', ');
}


function build(constraints, res, build_errors) {
  var errors;
  _.each(constraints, function(field_constraints, key) {
    if (field_constraints instanceof ObjectCleaner) {
      res[key] = { sub: field_constraints.schema };
      return;
    }

    if (_.isPlainObject(field_constraints)) {
      res[key] = {sub: {} };
      build(field_constraints, res[key].sub, build_errors);
      return;
    }

    res[key] = {
      cleaners: []
    , checkers: []
    };


    errors = buildCleanerValidator(field_constraints, res[key]);
    if (errors && errors.length) {
      build_errors.push({key: key, errors: errors});
    }

  });
}


function buildCleanerValidator(field_constraints, res) {
  var errors = [];
  _.each(field_constraints, function(field_constraint) {
    if (field_constraint instanceof Error) {
      errors.push(field_constraint);
      return;
    }

    if (isCleaner(field_constraint)) {
      res.cleaners.push(field_constraint);
    } else {

      if (field_constraint.msg) {
        // add msg to checkers msgs
        if (!res.checkers.msgs) res.checkers.msgs = {};

        _.assign(res.checkers.msgs, field_constraint.msg);
      }

      if (field_constraint.t == 'r') {
        res.checkers.required = true;
      }

      res.checkers.push(field_constraint);
    }
  });

  return errors;
}




function ObjectCleaner(schema) {
  this.schema = schema;
}



ObjectCleaner.prototype.addError = function(errs, key) {
  if (!errs.length) return;
  this.errors[key] = errs;
};


ObjectCleaner.prototype.getErrors = function() {
  return this.errors;
};

ObjectCleaner.prototype.buildKey = function(key, parent_key) {
  return parent_key ? parent_key + '[' + key + ']' : key;
};

ObjectCleaner.prototype.go = function(object) {
  this.errors = {};
  // this.original = object;
  // this.cleaned = {};
  this.cleanValidate(object, this.schema, '');
  // return this.cleaned;
  return object;
};


ObjectCleaner.prototype.cleanValidate = function(object, schema, parent_key) {
  var next_key, field_value;

  _.each(schema, function(field_constraints, key) {
    next_key = this.buildKey(key, parent_key);

    if (_.has(field_constraints, 'sub')) {
      // cleaned[key] = {};
      this.cleanValidate(object[key], field_constraints.sub, next_key);

    } else {
      field_value = _.has(object, key) ? object[key]: undefined;
      field_value = this.cleanField(field_value, field_constraints.cleaners);


      if (field_value !== undefined) {
        object[key] = sanitize(field_value).trim();
      }

      this.addError(this.validateField(field_value, field_constraints.checkers), next_key);
    }

  }, this);
};



ObjectCleaner.prototype.cleanField = function(value, field_cleaners) {
  _.each(field_cleaners, function(cleaner) {
    value = cleaner(sanitize(value));
  });
  return value;
};



ObjectCleaner.prototype.validateField = function(value, field_checkers) {
  var validator;

  // no validation if field is not required & value empty
  if (_.size(value) == 0 && !field_checkers.required) return [];


  validator = new Validator().check(value, field_checkers.msgs);
  _.each(field_checkers, function(checker) {
    checker(validator);
  });

  return validator.getErrors();
};


module.exports = {
  check: validator.check
, sanitize: sanitize
, Validator: Validator
, Filter: Filter
, builder: builder
, validate: validate
, clean: clean
, ObjectCleaner: ObjectCleaner
};