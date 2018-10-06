process.env.NODE_ENV = 'development'

const path = require('path')
const merge = require('webpack-merge')

const common = require('./common.js')

const rootDir = path.resolve(__dirname, '../../')
const outputDir = `${ rootDir }/public`

module.exports = merge(common, {
	mode: 'development',
	devtool: 'inline-source-map',
	output: { path: outputDir },
	devServer: {
		contentBase: outputDir,
		compress: true,
		port: 9999,
	},
})
