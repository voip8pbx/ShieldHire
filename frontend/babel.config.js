module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    ['module:react-native-dotenv', {
      moduleName: '@env',
      path: '../.env',           // reads root .env at Metro bundle time
      safe: false,            // don't require all vars to be defined in .env.example
      allowUndefined: true,   // return undefined instead of throwing for missing vars
    }],
  ],
};
