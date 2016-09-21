const gulp = require('gulp');

const _ = require('lodash');
const concat = require('gulp-concat');
const debug = require('gulp-debug');
const gulpif = require('gulp-if');
const gutil = require('gulp-util');
const inject = require('gulp-inject-string');
const plumber = require('gulp-plumber');
const pug = require('gulp-pug');
const rename = require('gulp-rename');
const sass = require('gulp-sass');
const server = require('gulp-server-livereload');
const sourcemaps = require('gulp-sourcemaps');
const system_builder = require('systemjs-builder');
const ts = require('gulp-typescript');
const uglify = require('gulp-uglify');


const SRC_DIR = './src';
const APP_SRC_DIR = SRC_DIR + '/app';
const ASSETS_DIR = SRC_DIR + '/assets';
const PUG_DIR = SRC_DIR + '/pug';
const STYLE_DIR = SRC_DIR + '/style';

const OUTPUT_DIR = './output/';
const OUTPUT_JS_DIR = OUTPUT_DIR + 'js/';
const OUTPUT_CSS_DIR = OUTPUT_DIR + 'css/';

const DIST_DIR = 'dist';


var flags = {
  production: false
};

gulp.task('production', function () {
  flags.production = true;
});

var ts_project = ts.createProject('tsconfig.json', {
  typescript: require('typescript'),
  noEmitOnError: true
});
var js_builder = new system_builder('.', './systemjs.config.js');

gulp.task('build:js', function() {
  if (flags.production) {
    var js_builder_opts = { sourceMaps: false, lowResSourceMaps: false, minify: true };
  } else {
    var js_builder_opts = { sourceMaps: true,
                            lowResSourceMaps: true,
                            minify: false,
                            mangle: false,
                            globalDefs: { DEBUG: true }
                          };
  }

  js_builder.invalidate('caos/*');

  var js_entrypoints = [
    'reflect-metadata/Reflect',
    'caos/bootstrap'
  ].join(' + ');

  return gulp.src(['typings/index.d.ts',
                   APP_SRC_DIR + '/**/*.ts'
                  ])
    .pipe(gulpif(flags.production,
                 inject.replace('// INJECT PRODUCTION CODE',
                                "import { enableProdMode } from '@angular/core'; enableProdMode();")))
    .pipe(sourcemaps.init({loadMaps: true}))
  // .pipe(plumber())
    .pipe(ts(ts_project, {}, ts.reporter.fullReporter()))
    .on('error', function (error) {
      var log = gutil.log, colors = gutil.colors;
      log('Typescript compilation exited with ' + colors.red(error));
    }).js
  // .pipe(debug({title: "Stream contents:", minimal: true}))
    .pipe(gulpif(flags.production, uglify()))
    .pipe(gulpif(!flags.production, sourcemaps.write('.')))
    .pipe(gulp.dest(DIST_DIR))
    .on('end', function () {
      js_builder.bundle(js_entrypoints,
                        OUTPUT_JS_DIR + 'bundle.js',
                        js_builder_opts)
        .then(function() {
          console.log('Build complete');
        })
        .catch(function(err) {
          console.log('Build error');
          console.log(err);
        });
    });
});

gulp.task('watch:js', ['build:js'], function() {
  var watcher = gulp.watch(['./systemjs.config.js',
                            APP_SRC_DIR + '/**/*.ts'], ['build:js']);

  watcher.on('change', function (event) {
    console.log('Event ' + event.type + ' on path: ' + event.path);
  });

});

gulp.task('build:css', function() {
  if (flags.production) {
    var sass_opts = {
      includePaths: ['./node_modules' ],
      outputStyle: 'compressed'
    };
  } else {
    var sass_opts = {
      includePaths: ['./node_modules' ],
      outputStyle: 'nested'
    };
  }

  return gulp.src(STYLE_DIR + '/style.scss')
    .pipe(sourcemaps.init())
    .pipe(sass(sass_opts)
          .on('error', sass.logError))
    .pipe(gulpif(!flags.production, sourcemaps.write('.')))
    .pipe(gulp.dest(OUTPUT_CSS_DIR))
    .on('error', gutil.log);
});

gulp.task('watch:css', ['build:css'], function() {
  var watcher = gulp.watch(STYLE_DIR + '/**/*.scss', ['build:css']);

  watcher.on('change', function (event) {
    console.log('Event ' + event.type + ' on path: ' + event.path);
  });
});

const ASSETS = {
  fonts: [
    'node_modules/font-awesome/fonts/**/*',
  ],
  js: [
    SRC_DIR + '/env.js',
  ],
  'js/vendor': [
    'node_modules/core-js/client/shim.min.js',
    gulpif(!flags.production, 'node_modules/core-js/client/shim.min.js.map'),
    'node_modules/zone.js/dist/zone.min.js',
    'node_modules/systemjs/dist/system.js',
    gulpif(!flags.production, 'node_modules/systemjs/dist/system.js.map')
  ],
};

gulp.task('build:assets', function() {
  _(ASSETS).forEach(function(value, key) {
    console.log('Copying ' + value + ' to ' + OUTPUT_DIR + key);

    gulp.src(value)
      .pipe(gulp.dest(OUTPUT_DIR + key))
      .on('error', gutil.log);
  });
});

gulp.task('watch:assets', ['build:assets'], function() {
  var assets = [];

  _(ASSETS).forEach(function(value, key) {
    _(value).forEach(function(f) {
      assets.push(f);
    });
  });

  var watcher = gulp.watch(assets, ['build:assets']);

  watcher.on('change', function (event) {
    console.log('Event ' + event.type + ' on path: ' + event.path);
  });
});

gulp.task('build:html:components', function() {
  return gulp.src(APP_SRC_DIR + '/**/*.pug', { base: APP_SRC_DIR })
    .pipe(pug({
      doctype: 'html',
      pretty: !flags.production
    }))
    .on('error', gutil.log)
    .pipe(debug({title: "Stream contents:", minimal: true}))
    .pipe(gulp.dest(OUTPUT_DIR));
});

gulp.task('build:html', function() {
  return gulp.src(PUG_DIR + '/**/[^_]*.pug')
    .pipe(pug({
      doctype: 'html',
      pretty: !flags.production
    }))
    .on('error', gutil.log)
    .pipe(debug({title: "Stream contents:", minimal: true}))
    .pipe(gulp.dest(OUTPUT_DIR));
});

gulp.task('watch:html:components', ['build:html:components'], function() {
  var watcher = gulp.watch(APP_SRC_DIR + '/**/*.pug', ['build:html:components']);

  watcher.on('change', function (event) {
    console.log('Event ' + event.type + ' on path: ' + event.path);
  });
});

gulp.task('watch:html', ['build:html'], function() {
  var watcher = gulp.watch(PUG_DIR + '/**/*.pug', ['build:html']);

  watcher.on('change', function (event) {
    console.log('Event ' + event.type + ' on path: ' + event.path);
  });
});


gulp.task('build', [
  'build:assets',
  'build:css',
  'build:html',
  'build:html:components',
  'build:js',
]);

gulp.task('watch', [
  'watch:assets',
  'watch:css',
  'watch:html',
  'watch:html:components',
  'watch:js'
], function() {
  var watcher = gulp.watch('gulpfile.js', ['build']);

  watcher.on('change', function (event) {
    console.log('Event ' + event.type + ' on path: ' + event.path);
  });
});

gulp.task('dev', ['watch', 'server']);

gulp.task('default', ['build']);

gulp.task('server', ['build'], function () {
  gulp.src(OUTPUT_DIR)
    .pipe(server({
      host: '0.0.0.0',
      port: 3333,
      log: 'debug',
      fallback: 'index.html',
      open: true,
      livereload: {
        enable: true,
        port: 35729}
    }));
});
