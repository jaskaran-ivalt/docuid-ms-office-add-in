/* eslint-disable no-undef */

require('dotenv').config();

const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { DefinePlugin } = require('webpack');

const urlDev = 'https://localhost:3000/';
// Use environment variable for production URL (Vercel sets VERCEL_URL)
const urlProd = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}/`
  : process.env.PRODUCTION_URL
    ? process.env.PRODUCTION_URL
    : 'https://addon.docuid.net/';

// ============================================================
// API BACKEND CONFIGURATION
// Set to true to use local DocuID backend, false for dev server
// ============================================================
const USE_LOCAL_BACKEND = false;

// Backend URLs
const API_TARGETS = {
  local: {
    url: 'http://localhost:3001',
    secure: false,
  },
  remote: {
    url: 'https://www.docuid.net',
    secure: true,
  },
};

// Get current API target based on USE_LOCAL_BACKEND flag
const apiTarget = USE_LOCAL_BACKEND ? API_TARGETS.local : API_TARGETS.remote;

async function getHttpsOptions() {
  const devCerts = require('office-addin-dev-certs');
  const httpsOptions = await devCerts.getHttpsServerOptions();
  return { ca: httpsOptions.ca, key: httpsOptions.key, cert: httpsOptions.cert };
}

module.exports = async (env, options) => {
  const dev = options.mode === 'development';

  // Log which backend is being used
  console.log(`\n🔌 API Backend: ${USE_LOCAL_BACKEND ? 'LOCAL' : 'REMOTE'} (${apiTarget.url})\n`);

  const config = {
    devtool: 'source-map',
    // Office Add-ins run inside a desktop application with reliable caching.
    // The 244 KB default limit is designed for public web pages; 2 MB is
    // a reasonable threshold for this context.
    performance: {
      maxAssetSize: 2 * 1024 * 1024,
      maxEntrypointSize: 2 * 1024 * 1024,
      hints: dev ? false : 'warning',
    },
    optimization: {
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          // Split @fluentui/react into its own chunk — it's 832 KB and
          // rarely changes, so it can be cached independently of app code.
          fluentui: {
            test: /[\\/]node_modules[\\/]@fluentui[\\/]/,
            name: 'fluentui',
            chunks: 'all',
            priority: 20,
          },
          // Split react-dom into its own chunk — 533 KB, never changes.
          reactdom: {
            test: /[\\/]node_modules[\\/](react-dom|scheduler)[\\/]/,
            name: 'react-dom',
            chunks: 'all',
            priority: 10,
          },
          // Everything else from node_modules.
          vendors: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            priority: 5,
          },
        },
      },
    },
    entry: {
      polyfill: ['core-js/stable', 'regenerator-runtime/runtime'],
      taskpane: ['./src/taskpane/index.tsx'],
      commands: './src/commands/commands.ts',
    },
    output: {
      clean: true,
      path: require('path').resolve(__dirname, 'dist'),
      publicPath: dev ? '/' : '/',
    },
    resolve: {
      extensions: ['.ts', '.tsx', '.js', '.jsx', '.html'],
      alias: {
        '@': require('path').resolve(__dirname, 'src'),
      },
    },
    module: {
      rules: [
        {
          test: /\.(ts|tsx)$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
          },
        },
        {
          test: /\.html$/,
          exclude: /node_modules/,
          use: 'html-loader',
        },
        {
          test: /\.(png|jpg|jpeg|gif|ico)$/,
          type: 'asset/resource',
          generator: {
            filename: 'assets/[path][name][ext][query]',
          },
        },
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader', 'postcss-loader'],
        },
      ],
    },
    plugins: [
      new HtmlWebpackPlugin({
        filename: 'taskpane.html',
        template: './src/taskpane/taskpane.html',
        chunks: ['polyfill', 'taskpane'],
      }),
      new CopyWebpackPlugin({
        patterns: [
          {
            from: 'assets/*',
            to: 'assets/[name][ext][query]',
          },
          {
            from: 'assets/icons/*',
            to: 'assets/icons/[name][ext][query]',
          },
          {
            from: 'manifests/manifest*.xml',
            to: '[name][ext]',
            transform(content) {
              if (dev) {
                return content;
              } else {
                return content.toString().replace(new RegExp(urlDev, 'g'), urlProd);
              }
            },
          },
          // Copy production manifest in production builds
          ...(dev
            ? []
            : [
                {
                  from: 'manifests/manifest-production.xml',
                  to: 'manifest-production.xml',
                  transform(content) {
                    // Replace placeholder URL with actual production URL
                    return content
                      .toString()
                      .replace(/https:\/\/docuid-addin\.vercel\.app\//g, urlProd);
                  },
                },
              ]),
        ],
      }),
      new HtmlWebpackPlugin({
        filename: 'commands.html',
        template: './src/commands/commands.html',
        chunks: ['polyfill', 'commands'],
      }),
      // Inject environment variables into the client bundle at build time.
      // DEMO_PHONE and DEMO_TOKEN are only set in .env for local dev/demo builds.
      // In production Vercel builds these are unset, so demo mode is disabled.
      new DefinePlugin({
        'process.env.DEMO_PHONE': JSON.stringify(process.env.DEMO_PHONE || ''),
        'process.env.DEMO_TOKEN': JSON.stringify(process.env.DEMO_TOKEN || ''),
      }),
      new HtmlWebpackPlugin({
        filename: 'privacy-policy.html',
        template: './src/taskpane/privacy-policy.html',
        chunks: ['polyfill'],
      }),
      new HtmlWebpackPlugin({
        filename: 'eula.html',
        template: './src/taskpane/eula.html',
        chunks: ['polyfill'],
      }),
      new HtmlWebpackPlugin({
        filename: 'support.html',
        template: './src/taskpane/support.html',
        chunks: ['polyfill'],
      }),
    ],
    devServer: {
      historyApiFallback: {
        index: '/taskpane.html',
      },
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      server: {
        type: 'https',
        options: dev
          ? env.WEBPACK_BUILD || options.https !== undefined
            ? options.https
            : await getHttpsOptions()
          : {},
      },
      port: process.env.npm_package_config_dev_server_port || 3000,
      proxy: [
        // Biometric auth endpoints: /api/docuid/biometric/* -> /api/biometric/*
        // x-api-key is injected here (server-side proxy) — never sent from the browser.
        {
          context: ['/api/docuid/biometric'],
          target: apiTarget.url,
          changeOrigin: true,
          secure: apiTarget.secure,
          // Rewrite the backend's `.docuid.net` cookie domain to host-only so the
          // browser accepts the session cookie on localhost (cookie-based auth).
          cookieDomainRewrite: '',
          headers: {
            'x-api-key': process.env.BIOMETRIC_API_KEY || '',
          },
          pathRewrite: {
            '^/api/docuid/biometric': '/api/biometric',
          },
          logLevel: 'debug',
        },
        // Dashboard endpoints (document lists, access, shares):
        // /api/docuid/dashboard/* -> /api/dashboard/*
        // Mirrors the production Vercel rewrite (/api/dashboard/:path*).
        {
          context: ['/api/docuid/dashboard'],
          target: apiTarget.url,
          changeOrigin: true,
          secure: apiTarget.secure,
          cookieDomainRewrite: '',
          pathRewrite: {
            '^/api/docuid/dashboard': '/api/dashboard',
          },
          logLevel: 'debug',
        },
        // Document download/content endpoints:
        // /api/docuid/documents/:id/(download|content) -> /api/documents/:id/...
        {
          context: ['/api/docuid/documents'],
          target: apiTarget.url,
          changeOrigin: true,
          secure: apiTarget.secure,
          cookieDomainRewrite: '',
          pathRewrite: {
            '^/api/docuid/documents': '/api/documents',
          },
          logLevel: 'debug',
        },
      ],
    },
  };

  return config;
};
