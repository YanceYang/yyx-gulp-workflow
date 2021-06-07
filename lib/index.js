/**
 * src:文件读取
 * dest:文件输出
 * parallel:并行执行任务
 * series:串行执行任务
 * watch:文件监听
 */
const { src, dest, parallel, series, watch } = require('gulp');
const plugins = require('gulp-load-plugins')();
const del = require('del');
const path = require('path');
const bs = require('browser-sync').create();
const cwd = process.cwd();
const config = require(path.join(cwd, 'pages.config.js'));

// 清除编译文件
const clean = () => {
    return del([config.build.dist, config.build.temp]);
};

// 清除tmp文件
const cleanTmp = () => {
    return del(config.build.temp);
};

// html页面
const html = () => {
    return src(config.build.paths.pages, {
        base: config.build.src,
        cwd: config.build.src
    })
        .pipe(plugins.swig({ data: config.data, defaults: { cache: false } }))
        .pipe(dest(config.build.temp))
        .pipe(bs.reload({ stream: true }));
};

// js脚本
const scripts = () => {
    return src(config.build.paths.scripts, {
        base: config.build.src,
        cwd: config.build.src
    })
        .pipe(plugins.babel({ presets: [require('@babel/preset-env')] }))
        .pipe(dest(config.build.temp))
        .pipe(bs.reload({ stream: true }));
};

// scss样式
const styles = () => {
    return src(config.build.paths.styles, {
        base: config.build.src,
        cwd: config.build.src
    })
        .pipe(plugins.sass({ outputStyle: 'expanded' }))
        .pipe(dest(config.build.temp))
        .pipe(bs.reload({ stream: true }));
};

// 图片和字体
const imageAndFont = () => {
    return src([config.build.paths.images, config.build.paths.fonts], {
        base: config.build.src,
        cwd: config.build.src
    })
        .pipe(plugins.imagemin())
        .pipe(dest(config.build.dist));
};

// 额外任务
const extra = () => {
    return src('**', {
        base: config.build.public,
        cwd: config.build.public
    }).pipe(dest(config.build.dist));
};

// html内引用文件统一打包
const useref = () => {
    return (
        src(path.join(config.build.temp, config.build.paths.pages), {
            base: config.build.temp
        })
            .pipe(plugins.useref({ searchPath: [config.build.temp, '.'] }))
            // html js css
            .pipe(plugins.if(/\.js$/, plugins.uglify()))
            .pipe(plugins.if(/\.css$/, plugins.cleanCss()))
            .pipe(
                plugins.if(
                    /\.html$/,
                    plugins.htmlmin({
                        collapseWhitespace: true,
                        minifyCSS: true,
                        minifyJS: true
                    })
                )
            )
            .pipe(dest(config.build.dist))
    );
};

const serve = () => {
    // html、css、js监听
    watch(config.build.paths.pages, { cwd: config.build.src }, html);
    watch(config.build.paths.styles, { cwd: config.build.src }, styles);
    watch(config.build.paths.scripts, { cwd: config.build.src }, scripts);
    // 字体、图片文件监听
    watch([config.build.paths.images, config.build.paths.fonts], { cwd: config.build.src }, bs.reload);
    // 额外任务监听
    watch('**', { cwd: config.build.public }, bs.reload);

    return bs.init({
        port: 8888,
        notify: false,
        // files:'dist/**'
        server: {
            baseDir: [config.build.temp, config.build.src, config.build.public],
            routes: {
                '/node_modules': 'node_modules'
            }
        }
        // proxy: 'https://baidu.com'
    });
};
const compile = parallel(html, scripts, styles);
// 上线之前执行
const build = series(clean, parallel(series(compile, useref, cleanTmp), imageAndFont, extra));
// 开发时执行
const develop = series(compile, serve);

module.exports = {
    clean,
    build,
    develop
};
