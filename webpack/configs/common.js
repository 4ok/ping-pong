const path = require('path')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')

const rootDir = path.resolve(__dirname, '../../')

module.exports = {
	context: rootDir,
	entry: { index: './src/index.js' },
	output: { filename: '[name].js' },
	plugins: [
		new MiniCssExtractPlugin({ filename: '[name].css' }),
	],
	resolve: {
		modules: [ 'node_modules' ],
		alias: { '~': `${ rootDir }/src` },
		extensions: [ '.js' ],
	},
	module: {
		rules: [
			{
				test: /\.js$/,
				exclude: /node_modules/,
				use: { loader: 'babel-loader' },
			},
			{
				test: /\.css$/,
				use: [
					'style-loader',
					{ loader: MiniCssExtractPlugin.loader },
					{
						loader: 'css-loader',
						options: { importLoaders: 1 },
					},
					'postcss-loader',
				],
			},
		],
	},
}
