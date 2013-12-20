var validator = require('./validator')
  , Validator = validator.Validator
  , Filter    = validator.Filter
  , sanitize  = validator.sanitize
  , _         = require('lodash')
  , util      = require('util');



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


/**
 * generate a function that validate a value
 *
 *
 * @param  {String|Object} method
 *         String => function name
 *         Object => {
 *           fn: 'method'
 *          , msg: 'custom msg'
 *         }
 * @return {function}
 *         return a function with custom properties
 *           fn.t => r for Required, v for Validator
 *           fn.msg => custom message
 */
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

  // fn is a checker that will be called by Validator
  //    'method' is saved in the function context
  //
  // validator = new Validator().check(value);
  // _.each(field_checkers, function(checker) {
  //   checker(validator);
  // });
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



/**
 * almost the same as validate => return a function that will clean up value
 *
 * @param  {String} method - name of cleaning function
 * @return {Function} function that will clean up value
 */
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
    var str   = 'builder error: ' + JSON.stringify(util.inspect(build_errors));
    var error = new Error(str);

    error.build = build_errors;
    throw error;
  }

  var cleaner = new ObjectCleaner(schema);
  var fn = function(object, cb) {

    var res = cleaner.go(object)
      , error = cleaner.getErrors();

    if (!_.isEmpty(cleaner.getErrors())) {
      res._errors = cleaner.getErrors();
    }

    if (_.isFunction(cb)) {
      cb(res._errors, res);
    }

    return res;
  };

  fn.cleaner = cleaner;
  return fn;

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

    // if field_constraints is a function => field_constraints is an already build submodel
    //    field_contraints.cleaner.schema is the schema we want
    if (_.isFunction(field_constraints)) {
      res[key] = { sub: field_constraints.cleaner.schema };
      return;
    }

    // if plain object => field constraints is a sub schema => make a recursive call to build it
    if (_.isPlainObject(field_constraints)) {
      res[key] = {sub: {} };
      build(field_constraints, res[key].sub, build_errors);
      return;
    }

    // last case, it is a single field, with one or more constraints (either cleaner and/or checkers)
    res[key] = {
      cleaners: []
    , checkers: []
    };

    // build checker and cleaner functions
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

    // a constraint is a cleaner (fn.t == 'c')
    if (isCleaner(field_constraint)) {
      res.cleaners.push(field_constraint);

    // else
    } else {
      // if custom message, add it
      if (field_constraint.msg) {
        // add msg to checkers msgs
        if (!res.checkers.msgs) res.checkers.msgs = {};

        _.assign(res.checkers.msgs, field_constraint.msg);
      }

      // if field constraint is marked as 'r' => required, explicitly mark it as required
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

    // validate sub schema or sub object
    if (_.has(field_constraints, 'sub')) {

      // create sub object if not given - to allow validation on sub object
      if (!_.has(object, key)) object[key] = {};
      this.cleanValidate(object[key], field_constraints.sub, next_key);

    // validate single attribute
    } else {
      field_value = _.has(object, key) ? object[key]: undefined;

      if (field_value !== undefined) {
        field_value = sanitize(field_value).trim();
      }

      field_value = this.cleanField(field_value, field_constraints.cleaners);

      if (field_value !== undefined) {
        object[key] = field_value;
      }

      this.addError(this.validateField(field_value, field_constraints.checkers, object), next_key);
    }

  }, this);
};



ObjectCleaner.prototype.cleanField = function(value, field_cleaners) {
  _.each(field_cleaners, function(cleaner) {
    value = cleaner(sanitize(value));
  });
  return value;
};



ObjectCleaner.prototype.validateField = function(value, field_checkers, full_object) {
  var validator;

  // no validation if field is not required & value empty
  if (_.size(value) == 0 && !field_checkers.required) return [];

  // get a new validator around a value
  // set custom messages
  validator = new Validator().check(value, field_checkers.msgs);

  // assign full_object to validator to make it available by checker
  validator.full_object = full_object;

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