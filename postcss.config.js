const isProd = process.env.NODE_ENV === 'production'
const prodPlugin = (name, params = {}) => (isProd ? { [name]: params } : {})

module.exports = {
	plugins: {
		autoprefixer: { grid: true },
		...prodPlugin('cssnano'),
	},
}
