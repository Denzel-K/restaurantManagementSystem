const gulp = require('gulp');
const sass = require('gulp-sass')(require('sass'));
const sourcemaps = require('gulp-sourcemaps');

// Paths
const paths = {
  styles: {
    src: 'public/sass/**/*.scss',
    dest: 'public/css'
  }
};

// Compile SCSS into CSS
function styles() {
  return gulp.src(paths.styles.src)
    .pipe(sourcemaps.init())
    .pipe(sass().on('error', sass.logError))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(paths.styles.dest));
}

// Watch files
function watch() {
  gulp.watch(paths.styles.src, styles);
}

// Define complex tasks
const build = gulp.series(styles);
const watchFiles = gulp.series(build, watch);

// Export tasks
exports.styles = styles;
exports.watch = watchFiles;
exports.default = build;