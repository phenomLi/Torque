

module.exports = {
    entry: './src/torque.ts',
    output: {
		filename: './torque.js',
     	libraryTarget: 'umd'
    },
    resolve: {
		// 先尝试以ts为后缀的TypeScript源码文件
		extensions: ['.ts', '.js']
	},
	module: {
		rules: [
			{
				test: /\.ts$/,
				exclude: /node_modules/, 
				loader: 'awesome-typescript-loader'
			}
		]
	}
};
