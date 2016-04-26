'use strict';

let gulp = require('gulp');
let browserify = require('browserify');
let babelify = require('babelify');
let brfs = require('brfs');
let source = require('vinyl-source-stream');
let fs = require('fs');
let crx = require('gulp-crx-pack');
let mocha = require('gulp-mocha');
var jshint = require('gulp-jshint');

const PATH = 'addons/chrome/bundle'; // build

function createBrowserifyBundle(srcPath) {
  return () => {
    let bundler = browserify('./src/' + srcPath, { debug: true });
    return bundler
    .transform(babelify)
    .transform(brfs)
    .bundle()
    .on('error', e => {
      console.error(e);
      bundler.emit('end');
    })
    .pipe(source(srcPath))
    .pipe(gulp.dest('./'+ PATH));
  };
}

gulp.task('mochaTest', () => {
  return gulp.src('./src/js/**/*.spec.js')
    //.pipe(createBrowserifyBundle)

    //.pipe(babel())
    //.pipe(cat())
    .pipe(mocha({reporter: 'spec'}));
});

gulp.task('lint', function() {
  return gulp.src(['package.json', '.jshintrc', 'gulpfile.js', 'src/**/*.js', '!src/js/lib/*.js'])
    .pipe(jshint())
    .pipe(jshint.reporter('default', { verbose: false }));
});

gulp.task('background', createBrowserifyBundle('js/background.js'));
gulp.task('popup', createBrowserifyBundle('js/popup.js'));
gulp.task('content', createBrowserifyBundle('js/content.js'));

gulp.task('js', ['background', 'popup', 'content']);

gulp.task('html', () => {
  return gulp.src('./src/html/popup.html')
    .pipe(gulp.dest('./'+ PATH +'/html'));
});

gulp.task('css', () => {
  return gulp.src('./src/css/*.css')
    .pipe(gulp.dest('./'+ PATH +'/css'));
});

gulp.task('img', () => {
  return gulp.src('./src/img/**/*.png')
    .pipe(gulp.dest('./'+ PATH +'/img'));
});

gulp.task('copy', () => {
  return gulp.src(['./manifest.json'])
    .pipe(gulp.dest('./'+ PATH));
});

gulp.task('build', ['mochaTest', 'lint', 'js', 'html', 'css', 'img', 'copy']);

gulp.task('watch', () => {
  gulp.watch(['manifest.json', 'src/**'], ['build']);
});

gulp.task('dist', ['build'], () => {
  let manifest = require('./manifest.json');
  return gulp.src('./'+ PATH +'/')
    .pipe(crx({
      privateKey: fs.readFileSync('./key.pem', 'utf8'),
      filename: manifest.name + '-' + manifest.version + '.crx'
    }))
    .pipe(gulp.dest('./dist'));
});

gulp.task('default', ['build']);
