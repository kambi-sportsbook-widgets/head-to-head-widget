(function () {
   var gulp, exec, rename, concat, uglify, jshint, stripDebug, del, sourcemaps, minifycss, htmlReplace, sass, buildTemp, install, npmLibs, awspublish, jsonminify;

   gulp = require('gulp-help')(require('gulp'));

   exec = require('child_process').exec;

   rename = require('gulp-rename');

   concat = require('gulp-concat');

   uglify = require('gulp-uglify');

   jshint = require('gulp-jshint');

   stripDebug = require('gulp-strip-debug');

   sourcemaps = require('gulp-sourcemaps');

   sass = require('gulp-ruby-sass');

   minifycss = require('gulp-minify-css');

   htmlReplace = require('gulp-html-replace');

   del = require('del');

   install = require('gulp-install');

   awspublish = require('gulp-awspublish');

   jsonminify = require('gulp-jsonminify');

   buildTemp = '.buildTemp';

   npmLibs = [
      './node_modules/kambi-sportsbook-widget-library/dist/js/app.js',
      './node_modules/kambi-sportsbook-widget-core-translate/dist/translate.js'
   ];

   gulp.task('default', 'Builds the app including it\'s libraries and outputs it to the dist directory', ['build', 'clean-build'], function(){
      del.sync(buildTemp);
   });

   gulp.task('scss', 'Compiles the scss files and outputs it to the src/css/ folder', [], function () {
      return sass('./src/scss/app.scss', {
         compass: true,
         style: 'expanded',
         lineComments: false,
         sourcemap: true
      })
         .pipe(sourcemaps.write('.', {
            includeContent: false,
            sourceRoot: './src'
         }))
         .pipe(gulp.dest('./src/css'));
   });

   gulp.task('css', 'Concatenates and minifies all css files and outputs it to the dist/css/ directory', ['scss'], function () {
      return gulp.src('./src/css/**/*.css')
         .pipe(concat('app.css'))
         .pipe(gulp.dest('./dist/css'))
         .pipe(minifycss())
         .pipe(rename('app.min.css'))
         .pipe(gulp.dest('./dist/css'));
   });

   gulp.task('npm-install', false, function () {
      return gulp.src('package.json')
         .pipe(install());
   });

   gulp.task('npm-build', false, ['npm-install'], function () {
      return gulp.src(npmLibs)
         .pipe(concat('libs.js'))
         .pipe(gulp.dest('./' + buildTemp + '/js'));
   });

   gulp.task('build', false, ['js-concat', 'css', 'translations'], function () {
      return gulp.src('./src/index.html')
         .pipe(htmlReplace({
            css: 'css/app.min.css',
            js: 'js/app.min.js'
         }))
         .pipe(gulp.dest('./dist'));
   });

   gulp.task('app-concat', false, function () {
      return gulp.src('./src/**/*.js')
         .pipe(jshint('.jshintrc'))
         .pipe(jshint.reporter('default'))
         .pipe(stripDebug())
         .pipe(concat('app.js'))
         .pipe(gulp.dest('./' + buildTemp + '/js'));
   });

   gulp.task('js-concat', false, ['app-concat', 'npm-build'], function () {
      return gulp.src('./' + buildTemp + '/**/*.js')
         .pipe(concat('app.js'))
         .pipe(gulp.dest('./dist/js'))
         .pipe(uglify())
         .pipe(rename('app.min.js'))
         .pipe(gulp.dest('./dist/js'));
   });

   gulp.task('watch-scss', 'Starts a watcher for .scss files and compiles them when changed', function(){
      gulp.watch('./src/scss/**/*.scss', ['scss']);
   });

   gulp.task('clean-build-dir', false, function () {
      del.sync(buildTemp + '/js/**');
      del.sync(buildTemp + '/css/**');
      del.sync(buildTemp + '/**');
      return del.sync(buildTemp);
   });

   gulp.task('clean-build', false, ['clean-build-dir'], function () {
      return gulp.start('build');
   });

   gulp.task('publish', function () {
      var publisher = awspublish.create({
         params: {
            Bucket: 'kambi-widgets'
         }
      });

      var headers = {};

      return gulp.src(['./dist/**/*'])
         .pipe(rename(function ( path ) {
            path.dirname = '/head-to-head/' + path.dirname;
         }))
         .pipe(publisher.publish(headers, {
            //force: true
         }))
         .pipe(publisher.cache())
         .pipe(awspublish.reporter());
   });

   gulp.task('docs', function(cb){
      exec('npm run grunt', function (err, stdout, stderr) {
         console.log(err);
         console.log(stdout);
         console.log(stderr);

         exec('npm run kss', function (err, stdout, stderr) {
            console.log(err);
            console.log(stdout);
            console.log(stderr);
         });
      });
   });

   gulp.task('translations', function(){
      return gulp.src('./src/i18n/*.json')
         .pipe(jsonminify())
         .pipe(gulp.dest('./dist/i18n/'));
   });

}).call(this);
