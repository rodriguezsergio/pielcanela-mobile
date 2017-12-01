var ExtractTextPlugin = require('extract-text-webpack-plugin');
var CopyWebpackPlugin = require('copy-webpack-plugin');

var hash = '-[hash]';

var plugins = [
	new ExtractTextPlugin({
		filename: '[name].css',
		allChunks: true,
		disable: false
	}),
	new CopyWebpackPlugin([
		{ from: 'app.js' }
	]),
];

var modules =

{
	strictExportPresence: true,
	loaders: [{
		test: /\.js$/,
		exclude: arg => {
			if (arg.includes('node_modules/app/node_moudles')) {
				return true;
			}
			if (arg.includes('node_modules/app')) {
				return false;
			}
			if (arg.includes('node_modules')) {
				return true;
			}
			return false;
		},
		use: [{
			loader: 'babel-loader',
			options: {
				cacheDirectory: true
			}
		}]
	}, {
		test: /\.svg$/,
		use: 'svg-inline-loader'
	}, {
		test  : /\.(png|jpg|gif|ico)$/,
		use: {
			loader: 'url-loader',
			options: {
				limit: 12288,
				name: 'images/[name]'+hash+'.[ext]'
			}
		}
	}, {
		test  : /\.(otf|eot|ttf|woff|woff2)$/,
		use: {
			loader: 'url-loader',
			options: {
				limit: 122880000,
				'name': 'fonts/[name]'+hash+'.[ext]'
			}
		}
	}, {
		test  : /\.css$|\.less$/,
		exclude: /(common\/|ui\/styles\/|\.module)/,
		use: ExtractTextPlugin.extract({
			fallback: 'style-loader',
			use: [
			{
				loader: 'css-loader',
				options: {
					sourceMap: true
				}
			},				{
				loader: 'postcss-loader',
				options: {
					sourceMap: true
				}
			},				{
				loader: 'less-loader',
				options: {
					sourceMap: true
				}
			}]
		})
	}, {
		test  : /(common\/|ui\/styles\/).+(\.css|\.less)$|\.module\.(less|css)$/,
		use: ExtractTextPlugin.extract({
			fallback: 'style-loader',
			use: [
			{
				loader: 'css-loader',
				options: {
					sourceMap: true,
					modules: true,
					camelCase: true,
					importLoaders: 1,
					localIdentName: '[name]_[local]'
				}
			},				{
				loader: 'postcss-loader',
				options: {
					sourceMap: true
				}
			},				{
				loader: 'less-loader',
				options: {
					sourceMap: true
				}
			}]
		})
	}]
};

module.exports = [{
	name: 'client',
	entry: __dirname + '/client.js',
	plugins: plugins,
	output: {
		path: __dirname + '/build',
		filename: 'client.js',
	},
	module: modules
}, {
	name: 'server',
	entry: __dirname + '/server.js',
	output: {
		path: __dirname + '/build',
		libraryTarget: 'commonjs2',
		filename: 'server.js',
		publicPath: '/assets/'
	},
	plugins: plugins,
	target: 'node',
	module: modules,

	devtool: 'source-map',

	resolve: {
		modules	  : [
			__dirname,
			__dirname + '/node_modules',
			__dirname + '/node_modules/app'
		],
	}
}];
