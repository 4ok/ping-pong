process.env.NODE_ENV = 'production'

const path = require('path')
const merge = require('webpack-merge')

const common = require('./common.js')

const rootDir = path.resolve(__dirname, '../../')

module.exports = merge(common, {
	mode: 'production',
	devtool: 'source-map',
	output: { path: `${ rootDir }/build` },
})
