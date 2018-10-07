const isProd = process.env.NODE_ENV === 'production'

module.exports = {
	plugins: {
		autoprefixer: { grid: true },
		cssnano: isProd,
	},
}
