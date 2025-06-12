module.exports = {
  webpack: (config, { isMain }) => {
    if (isMain) {
      // Force CommonJS output
      config.output = {
        ...config.output,
        libraryTarget: 'commonjs2'
      };
      
      config.externals = {
        ...config.externals,
        'puppeteer': 'commonjs puppeteer',
        'puppeteer-extra': 'commonjs puppeteer-extra',
        'puppeteer-extra-plugin-stealth': 'commonjs puppeteer-extra-plugin-stealth',
        'proxy-agent': 'commonjs proxy-agent',
        'axios': 'commonjs axios',
        'better-sqlite3': 'commonjs better-sqlite3'
      };
      
      // Add target for Electron main process
      config.target = 'electron-main';
      
      // Disable webpack optimization for native modules
      config.optimization = {
        ...config.optimization,
        minimize: false
      };
    }
    return config;
  },
};
