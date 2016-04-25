/* global __dirname */

// we can use sync safely here because it's just the gulp file
// gulp tasks prefer unregulated arrow-body-style
/* eslint-disable no-sync,arrow-body-style */

import coffeelint from 'gulp-coffeelint';
import eslint from 'gulp-eslint';
import gulp from 'gulp';
import minimist from 'minimist';
import mocha from 'gulp-mocha';
import path from 'path';
import runSequence from 'run-sequence';
import util from 'gulp-util';

// this is required for mocha
require('coffee-script/register');

const args = minimist(process.argv);

const config = {
  verbose: args.verbose || false,
  quiet: args.quiet || false,
  dirs: {
    src: path.join(__dirname, 'src'),
    test: path.join(__dirname, 'test'),
  },
  test: {
    reporter: args.reporter || 'spec',
  },
};

function log(...items) {
  if (config.quiet === false) {
    // Reflect is not available in the gulp file
    // eslint-disable-next-line prefer-reflect
    util.log.apply(null, items);
  }
}

if (config.verbose) {
  log('Gulp Config:', JSON.stringify(config, null, 2));
}

// Default build task
gulp.task('default', [ 'test' ]);
// Default test task
gulp.task('test', [ 'mocha' ]);

// npm test task
gulp.task('test:npm', (done) => {
  runSequence('lint', 'mocha', done);
});

gulp.task('config', () => {
  util.log('Gulp Config:', JSON.stringify(config, null, 2));
});

gulp.task('help', () => {
  /* eslint-disable max-len */
  util.log(`*** Gulp Help ***

Command Line Overrides:
  ${ util.colors.cyan('--verbose') }          : print webpack module details and stats after bundling (${ util.colors.magenta(config.verbose) })
  ${ util.colors.cyan('--quiet') }            : do not print any extra build details (${ util.colors.magenta(config.quiet) })
  ${ util.colors.cyan('--reporter') }  ${ util.colors.yellow('<name>') } : mocha test reporter (${ util.colors.magenta(config.test.reporter) })
    reporter options : ${ [ 'spec', 'list', 'progress', 'dot', 'min' ].map((x) => util.colors.magenta(x)).join(', ') }

Tasks:
  ${ util.colors.cyan('gulp') } is an alias for ${ util.colors.cyan('gulp test') }
  ${ util.colors.cyan('gulp test') } will build a ${ util.colors.yellow('test') } bundle and run mocha against the tests (alias for ${ util.colors.cyan('gulp mocha') })

  ${ util.colors.cyan('gulp help') } will print this help text
  ${ util.colors.cyan('gulp config') } will print the gulp build configuration

  ${ util.colors.cyan('gulp lint') } will lint the source files with ${ util.colors.yellow('eslint') } and ${ util.colors.yellow('coffeelint') }
       ${ [ 'es', 'coffee' ].map((x) => util.colors.cyan(`lint:${ x }`)).join(', ') }

  ${ util.colors.cyan('gulp mocha') } will run mocha against the specs in ${ util.colors.magenta(config.dirs.test) }

  ${ util.colors.cyan('gulp watch') } will start webpack in ${ util.colors.magenta('watch') } mode, and run all tests after any detected change
       ${ [ 'lint', 'mocha' ].map((x) => util.colors.cyan(`watch:${ x }`)).join(', ') }
`);
  /* eslint-enable max-len */
});

// lint Tasks

gulp.task('lint', [ 'lint:es', 'lint:coffee' ]);

gulp.task('lint:es', () => {
  return gulp
    .src([
      path.join(__dirname, '*.js'),
    ])
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError());
});

gulp.task('lint:coffee', () => {
  return gulp
    .src([
      path.join(config.dirs.src, '**', '*.coffee'),
      path.join(config.dirs.test, '**', '*.coffee'),
      path.join(__dirname, '*.coffee'),
    ])
    .pipe(coffeelint())
    .pipe(coffeelint.reporter('coffeelint-stylish'))
    .pipe(coffeelint.reporter('fail'));
});

// mocha Tasks

gulp.task('mocha', () => {
  log('Testing with Mocha:', util.colors.magenta(config.dirs.test));

  return gulp
    .src([
      path.join(config.dirs.test, '**', '*.spec.coffee'),
    ])
    .pipe(mocha({
      reporter: args.reporter || (config.quiet ? 'dot' : config.test.reporter),
    }));
});

// watch Tasks

gulp.task('watch', [ 'watch:mocha' ]);

gulp.task('watch:mocha', () => {
  runSequence('mocha', () => null);

  return gulp
    .watch([
      path.join(config.dirs.test, '**', '*.spec.coffee'),
    ], () => {
      runSequence('mocha', () => null);
    })
    .on('change', () => {
      log('Testing...');
    });
});

gulp.task('watch:lint', () => {
  runSequence('lint', () => null);

  return gulp
    .watch([
      path.join(config.dirs.src, '**', '*.coffee'),
      path.join(config.dirs.test, '**', '*.coffee'),
      path.join(__dirname, '*.coffee'),
      path.join(__dirname, '*.js'),
    ], () => {
      runSequence('lint', () => null);
    })
    .on('change', () => {
      log('Linting...');
    });
});