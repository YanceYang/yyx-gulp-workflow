#!/usr/bin/env node

// 指定当前目录
process.argv.push('--cwd')
// 获取当前目录
process.argv.push(process.cwd())
// 指定gulp执行文件
process.argv.push('--gulpfile')
// 获取gulp执行文件
process.argv.push(require.resolve('..'))

// 执行gulp-cli命令
require('gulp/bin/gulp')
