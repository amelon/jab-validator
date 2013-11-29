jab-validator
=============

node-validator + string sanitize functions


## Usage
Define schema

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

    var builder = require('jab-validator');
    var schema_user = builder(user);

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

    o_user = schema_user.go(o_user);


Check errors

    schema_user.getErrors();
    // => false if no errors

### No check on empty value but required

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

    var res = validator.go(object);

    assert.equal(JSON.stringify(validator.getErrors()), '{"is_req":["String is empty","Invalid integer"]}');
    assert.equal(JSON.stringify(res), '{"is_int":"","is_req":""}');



### Accept custom validator

     function myValidate(value) {
        return value > 1 ? true : false;
     }

     var schema = {
         is_custom: [validate('custom', myValidate)]
       }


### Accept custom message

     var schema = {
         my_attr: [validate({ fn: 'isInt', msg: 'Is it possible to have an integer ?' })]
       }



*****************************************************


### List of cleaners

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


