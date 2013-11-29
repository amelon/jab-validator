jab-validator
=============

node-validator + string sanitize functions


## Usage

Install

    npm install jab-validator


Define schema

    var validator = require('jab-validator');
    var validate  = validator.validate;
    var clean     = validator.clean;

    var user = {
      email: [validate('isEmail'), validate('notNull')]
    , name: {
        last: [validate('required'), clean('capitalize')]
        // notEmpty == required
      , first: [validate('notEmpty')]
      , middle: [validate('isUppercase')]
      , abc: {
          a: [validate('isEmail')]
        }
      }
    , has: [validate('contains', 'b')]
    };

Build validator

    var validator     = require('jab-validator');
    var builder       = validator.builder
    var user_validator   = builder(user);

Validate & clean data

    var o_user = {
      email: 'test@toto'
    , name: {
        last: 'myname'
      , first: ''
      , middle: 'qsdf'
      }
    , has: 'abc'
    };

    var clean_data = user_validator(o_user);


Check errors

    console.log(clean_data._errors)
    // => undefined if no errors

### Continuation-passing style
You can use built validator with continuation-passing style (not async)

    var validator = require('jab-validator');
    var validate  = validator.validate;
    var clean     = validator.clean;

    var user = {
      email: [validate('isEmail'), validate('notNull')]
    , username: [validate('required')]
    };

    var user_vdor(user);

    var user_data = {
      email: 'coucou@hello.fr'
    , username: 'me&nobodyelse'
    };

    user_vdor(user_data, function(err, clean_data) {
      if (err) return handleError(err);
      // save clean_data
    });


### No check on empty value but required

    var validator = require('jab-validator');
    var validate  = validator.validate;
    var clean     = validator.clean;

    var schema = {
          is_int: [
            validate('isInt')
          ]
        , is_req: [validate('required'), validate('isInt')]
        }
      , validator = builder(schema)
      , object = {
          is_int: ''
        , is_req: ''
        };

    var res = validator(object);

    assert.equal(JSON.stringify(res._errors), '{"is_req":["String is empty","Invalid integer"]}');
    delete res._errors
    assert.equal(JSON.stringify(res), '{"is_int":"","is_req":""}');



### Include built schema as sub schema

    var validator = require('jab-validator');
    var validate  = validator.validate;
    var clean     = validator.clean;

    var sub = {
      fd: [validate('notEmpty')]
    };
    var sub_cleaner = builder(sub);

    var main = {
      sub_schema: sub_cleaner
    , other: [validate('notEmpty')]
    , last: [validate('notNull')]
    };

    var compare = {
      sub_schema: sub
    , other: [validate('notEmpty')]
    , last: [validate('notNull')]
    };

    compare = builder(compare);
    main = builder(main);

    assert.equal(JSON.stringify(main), JSON.stringify(compare));

    // now validate data
    var data = {
          other: 'xx'
        , last: 'last value'
        , sub_schema: {
            fd: 'df val'
          }
        };

    data = main(data); // same result as compare(data);


### Accept custom validator

    var validator = require('jab-validator');
    var validate  = validator.validate;
    var clean     = validator.clean;

    function myValidator(value) {
      return value > 1 ? true : false;
    }

    var schema = {
          is_custom: [validate('custom', myValidator)]
        };


### Accept custom message

     var schema = {
         my_attr: [validate({ fn: 'isInt', msg: 'Is it possible to have an integer ?' })]
       }



*****************************************************


### List of cleaners

    // originals - from node-validator
    trim(chars)                     //Trim optional `chars`, default is to trim whitespace (\r\n\t )
    ltrim(chars)
    rtrim(chars)
    ifNull(replace)
    toFloat()
    toInt()
    toBoolean()                     //True unless str = '0', 'false', or str.length == 0
    toBooleanStrict()               //False unless str = '1' or 'true'
    entityDecode()                  //Decode HTML entities
    entityEncode()
    escape()                        //Escape &, <, >, and "

    // added from Stringjs
    capitalize
    camelize
    collapseWhitespace
    dasherize
    ensureLeft
    ensureRight
    humanize
    slugify
    stripTags
    underscore
    replaceAll

    // self made ;)
    uppercase
    lowercase

### List of checkers

    isEmail
    isUrl
    isIP
    isIPv4
    isIPv6
    isIPNet
    isAlpha
    isAlphanumeric
    isNumeric
    isHexadecimal
    isHexColor
    isLowercase
    isUppercase
    isInt
    isDecimal
    isFloat
    isDivisibleBy
    notNull
    isNull
    notEmpty
    equals
    contains
    notContains
    regex
    is
    notRegex
    not
    len
    isUUID
    isUUIDv3
    isUUIDv4
    isUUIDv5
    isDate
    isAfter
    isBefore
    isIn
    notIn
    min
    max
    isCreditCard
    custom


