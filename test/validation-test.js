/*jshint node:true */
/*global describe, it, before */

'use strict';
process.env.NODE_ENV = 'test';

var assert        = require('chai').assert
  , validator     = require('../index')
  , _             = require('lodash')
  , builder       = validator.builder
  , validate      = validator.validate
  , clean         = validator.clean
  , ObjectCleaner = validator.ObjectCleaner
  , util          = require('util');


var c_user = {
  email: [validate('isEmail'), validate('notNull')]
, name: {
    last: [validate('notEmpty'), clean('capitalize')]
  , first: [validate('notEmpty')]
  , middle: [validate('isUppercase')]
  , abc: {
      a: [validate('isEmail')]
    }
  }
, has: [validate('contains', 'b')]
};



var c_part = {
  user: c_user
, active: [validate('isNumeric')]
};


var o_user = {
  email: 'test@toto'
, name: {
    last: 'myname'
  , first: ''
  , middle: 'qsdf'
  }
, has: 'abc'
};


// var cons = builder(c_user);


describe('Validation', function() {
  describe('builder', function() {

    describe('with bad validators', function() {

      it('throw Error if bad validator', function() {

        var bad_validators = {
          email: [validate('tot')]
        , name: {
            last: [validate('titi')]
          }
        , has: [validate('contains', 'b')]
        };


        var fn = function() {
          builder(bad_validators);
        };
        assert.throw(fn);
      });
    });



    describe('with corrects validators', function() {
      before(function() {
        this.validator = builder(c_user);
      });


      it('return ObjectCleaner if all is ok', function() {
        assert.instanceOf(this.validator, Function);
        assert.instanceOf(this.validator.cleaner, ObjectCleaner);

      });



      it('ObjectCleaner has correct schema validation', function() {
        var schema = this.validator.cleaner.schema;
        assert(_.has(schema, 'email'));
        assert(_.has(schema, 'name'));
        assert(_.has(schema.name, 'sub'));
        assert(_.has(schema.name.sub, 'last'));
        assert(_.has(schema.name.sub, 'first'));
        assert(_.has(schema.name.sub, 'middle'));
        assert(_.has(schema, 'has'));
      });


      it('ObjectCleaner has correct schema validation validator length', function() {
        var schema = this.validator.cleaner.schema;

        assert(_.has(schema.email, 'cleaners'));
        assert(_.has(schema.email, 'checkers'));
        assert.equal(schema.email.cleaners.length, 0);
        assert.equal(schema.email.checkers.length, 2);
      });

      it('support sub property', function() {
        var schema = {
          sub: [validate('notEmpty')]
        , other: {
            sub: {
              last: [validate('notEmpty')]
            }
          }
        };
        var validator = builder(schema);
        var response = '{"schema":{"sub":{"cleaners":[],"checkers":[null]},"other":{"sub":{"sub":{"sub":{"last":{"cleaners":[],"checkers":[null]}}}}}}}';
        assert.equal(JSON.stringify(validator.cleaner), response);
      });

    });

    describe('validate', function() {
      it('support custom message', function() {
        var schema = {
          custom_msg: [
              validate({ fn: 'isNumeric', msg: 'my custom msg isnum'})
            , validate({ fn: 'contains', msg: 'contains msg'})
            , validate({ fn: 'notEmpty' /* , msg: 'nosmg' */ })
            , validate('len', 1, 4)
          ]
        };

        schema = builder(schema).cleaner;
        assert(schema.schema.custom_msg.checkers[0].msg);
        assert.equal(schema.schema.custom_msg.checkers[0].msg.isNumeric, 'my custom msg isnum');
        assert.equal(JSON.stringify(schema.schema.custom_msg.checkers.msgs), '{"isNumeric":"my custom msg isnum","contains":"contains msg"}');
        assert.equal(schema.schema.custom_msg.checkers.length, 4);
      });
    });

    describe('sub ObjectCleaner', function() {
      it('should be supported', function() {
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
      });

    });

  }); // end of builder



  describe('ObjectCleaner', function() {
    describe('cleaners', function() {
      it('clean & format values', function() {
        var schema = {
          to_int: [clean('toInt')]
        , trim: [clean('trim')]
        , if_null: [clean('ifNull', 'null replaced')]
        , to_bool: [clean('toBoolean')]
        , capitalize: [clean('capitalize')]
        , camelize: [clean('camelize')]
        , collapse_whitespace: [clean('collapseWhitespace')]
        , dasherize: [clean('dasherize')]
        , ensure_left: [clean('ensureLeft', 'ab')]
        };

        // 'capitalize'
        // 'camelize'
        // 'collapseWhitespace'
        // 'dasherize'
        // 'ensureLeft'
        // 'ensureRight'
        // 'humanize'
        // 'slugify'
        // 'stripTags'
        // 'underscore'
        // 'replaceAll'

        validator = builder(schema);

        // console.log(util.inspect(validator));

        var object = {
          to_int: '00100'
        , trim: '  abc '
        , if_null: ''
        , to_bool: '1'
        , capitalize: 'abc def'
        , camelize: 'yes_we_can'
        , collapse_whitespace: 'abc   def  ghi'
        , dasherize: 'abc def'
        , ensure_left: 'cde'
        };

        var response = '{"to_int":100,"trim":"abc","if_null":"null replaced","to_bool":true,"capitalize":"Abc def","camelize":"yesWeCan","collapse_whitespace":"abc def ghi","dasherize":"abc-def","ensure_left":"abcde"}';
        assert.equal(JSON.stringify(validator(object)), response);
      });



      it('accepts extra fields in data', function() {
        var validator = builder({
            present: [clean('toInt')]
          });
        var res = validator({present: '123', no_present: 'please let me exists'});
        assert.property(res, 'no_present');
        assert.property(res, 'present');
      });

    });




    describe('checkers', function() {

      describe('validate input data', function() {

        it('accept correct data vs checkers', function() {

          var schema = {
            is_int: [validate('isInt')]
          , is_email: [validate('isEmail')]
          , len: [validate('len', 4, 10)]
          , contains: [validate('contains', 'a')]
          };

          var validator = builder(schema);

          var object = {
            is_int: 10
          , is_email: 'toto@titi.com'
          , len: '123456'
          , contains: 'bac'
          };

          var res = validator(object);
          assert(_.isEmpty(validator._errors));
          assert.equal(JSON.stringify(res), '{"is_int":"10","is_email":"toto@titi.com","len":"123456","contains":"bac"}');
        });



        it('reject incorrect data vs checkers', function() {
          var schema = {
                is_int: [validate('isInt')]
              , is_email: [validate('isEmail')]
              , len: [validate('len', 4, 10)]
              , contains: [validate('contains', 'a')]
              }

            , validator = builder(schema)
            , object = {
                is_int: 'abc'
              , is_email: 'not an email'
              , len: '123'
              , contains: 'cde'
              };

          var res = validator(object);
          assert.equal(JSON.stringify(object._errors), '{"is_int":["Invalid integer"],"is_email":["Invalid email"],"len":["String is not in range"],"contains":["Invalid characters"]}');

        });



        it('support sub schema validation', function() {
          var schema = {
                is_int: [validate('isInt')]
              , is_sub: {
                  is_email: [validate('isEmail')]
                , len: [validate('len', 4, 10)]

                }
              , contains: [validate('contains', 'a')]
              }

            , validator = builder(schema)

            , object = {
                is_int: 123
              , is_sub: {
                  is_email: 'azeb@qsdf.com'
                , len: '12345'
                }
              , contains: 'abc'
              };

          var res = validator(object);
          assert(_.isEmpty(validator.errors));
          assert.equal(JSON.stringify(res), '{"is_int":"123","is_sub":{"is_email":"azeb@qsdf.com","len":"12345"},"contains":"abc"}');
        });


        it('support custom validator', function() {
          function myValidator(value) {
            return value == 'hello' ? true: false;
          }

          var schema = {
                is_custom: [validate('custom', myValidator)]
              }
            , validator = builder(schema)

            , object = {
                is_custom: 'hello'
              }
            , res = validator(object);

          assert(_.isEmpty(validator.errors));
          assert.equal(JSON.stringify(res), '{"is_custom":"hello"}');

        });


        it('custom validator can access full object', function() {
          function myValidator(value) {
            return Number(value) > 1 && this.full_object.another == 'Hello';
          }

          var schema = {
                is_custom: [validate('custom', myValidator)]
              , another: [clean('trim')]
              }
            , validator = builder(schema)

            , object = {
                is_custom: 2
              , another: 'Hello'
              }
            , res      = validator(object)
            , res_json = JSON.stringify(res);

          assert(_.isEmpty(validator.errors));
          assert.equal(JSON.stringify(res), '{"is_custom":"2","another":"Hello"}');

        });



        it('support custom message', function() {
          var schema = {
                is_int: [validate({fn: 'isInt', msg: 'is it really a number?'})]
              }
            , validator = builder(schema)
            , object = {
                is_int: 'abc'
              };

          var res = validator(object);
          assert.equal(JSON.stringify( res._errors ), '{"is_int":["is it really a number?"]}');

        });


        it('support custom & standard messages', function() {
          var schema = {
                is_int: [
                  validate({ fn: 'isInt', msg: 'is it really a number?' })
                , validate('isEmail')
                , validate({ fn: 'isUrl', msg: 'an int or an url ?? ' })
                ]
              }
            , validator = builder(schema)
            , object = {
                is_int: 'abc'
              };

          var res = validator(object);
          assert.equal(JSON.stringify( res._errors ), '{"is_int":["is it really a number?","Invalid email","an int or an url ?? "]}');

        });

        it('does not check empty value but required', function() {
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
          delete res._errors;
          assert.equal(JSON.stringify(res), '{"is_int":"","is_req":""}');

        });

        it('support undefined sub key', function() {
          var schema = {
                is_int: [validate('isInt')]
              , undefsub: {
                  undefkey: [clean('trim')]
                }
              }
            , validator = builder(schema)
            , object = {
                is_int: ''
              };

          var res = validator(object);
          assert.equal(JSON.stringify(res), '{"is_int":"","undefsub":{"undefkey":""}}');
        });

      }); // validate input data


    });

  });

});



