var gulp       = require('gulp');
var gutil      = require('gulp-util');
var mocha      = require('gulp-mocha');


gulp.task('mocha', function() {
  gulp.src(['test/*-test.js'])
      .pipe(mocha({reporter: 'spec'}))
      .on('error', function() {
        console.log('mocha error', arguments);
      });
});



gulp.task('watch', function() {
  gulp.watch(['*.js', 'test/*.js'], ['mocha'])
      .on('change', function(ev) { console.log('File '+ev.path+' was '+ev.type+', running tasks...'); });
});



gulp.task('default', ['watch']);

