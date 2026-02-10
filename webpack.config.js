/* eslint-disable no-undef */

const devCerts = require("office-addin-dev-certs");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");

const urlDev = "https://localhost:3000/";
// Use environment variable for production URL (Vercel sets VERCEL_URL)
const urlProd = process.env.VERCEL_URL 
  ? `https://${process.env.VERCEL_URL}/` 
  : process.env.PRODUCTION_URL 
    ? process.env.PRODUCTION_URL 
    : "https://docuid-ms-office-add-in.vercel.app/";

// ============================================================
// API BACKEND CONFIGURATION
// Set to true to use local DocuID backend, false for dev server
// ============================================================
const USE_LOCAL_BACKEND = false;

// Backend URLs
const API_TARGETS = {
  local: {
    url: 'http://localhost:3001',
    secure: false
  },
  remote: {
    url: 'https://dev.docuid.net',
    secure: true
  }
};

// Get current API target based on USE_LOCAL_BACKEND flag
const apiTarget = USE_LOCAL_BACKEND ? API_TARGETS.local : API_TARGETS.remote;

async function getHttpsOptions() {
  const httpsOptions = await devCerts.getHttpsServerOptions();
  return { ca: httpsOptions.ca, key: httpsOptions.key, cert: httpsOptions.cert };
}

module.exports = async (env, options) => {
  const dev = options.mode === "development";
  
  // Log which backend is being used
  console.log(`\n🔌 API Backend: ${USE_LOCAL_BACKEND ? 'LOCAL' : 'REMOTE'} (${apiTarget.url})\n`);
  
  const config = {
    devtool: "source-map",
    entry: {
      polyfill: ["core-js/stable", "regenerator-runtime/runtime"],
      taskpane: ["./src/taskpane/index.tsx"],
      commands: "./src/commands/commands.ts",
    },
    output: {
      clean: true,
      path: require("path").resolve(__dirname, "dist"),
      publicPath: dev ? "/" : "/",
    },
    resolve: {
      extensions: [".ts", ".tsx", ".js", ".jsx", ".html"],
      alias: {
        "@": require("path").resolve(__dirname, "src"),
      },
    },
    module: {
      rules: [
        {
          test: /\.(ts|tsx)$/,
          exclude: /node_modules/,
          use: {
            loader: "babel-loader",
          },
        },
        {
          test: /\.html$/,
          exclude: /node_modules/,
          use: "html-loader",
        },
        {
          test: /\.(png|jpg|jpeg|gif|ico)$/,
          type: "asset/resource",
          generator: {
            filename: "assets/[path][name][ext][query]",
          },
        },
        {
          test: /\.css$/,
          use: ["style-loader", "css-loader", "postcss-loader"],
        },
      ],
    },
    plugins: [
      new HtmlWebpackPlugin({
        filename: "taskpane.html",
        template: "./src/taskpane/taskpane.html",
        chunks: ["polyfill", "taskpane"],
      }),
      new CopyWebpackPlugin({
        patterns: [
          {
            from: "assets/*",
            to: "assets/[name][ext][query]",
          },
          {
            from: "assets/icons/*",
            to: "assets/icons/[name][ext][query]",
          },
          {
            from: "manifest*.xml",
            to: "[name]" + "[ext]",
            transform(content) {
              if (dev) {
                return content;
              } else {
                return content.toString().replace(new RegExp(urlDev, "g"), urlProd);
              }
            },
          },
          // Copy production manifest in production builds
          ...(dev ? [] : [{
            from: "manifest-production.xml",
            to: "manifest-production.xml",
            transform(content) {
              // Replace placeholder URL with actual production URL
              return content.toString().replace(/https:\/\/docuid-addin\.vercel\.app\//g, urlProd);
            },
          }]),
        ],
      }),
      new HtmlWebpackPlugin({
        filename: "commands.html",
        template: "./src/commands/commands.html",
        chunks: ["polyfill", "commands"],
      }),
    ],
    devServer: {
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      server: {
        type: "https",
        options:
          env.WEBPACK_BUILD || options.https !== undefined
            ? options.https
            : await getHttpsOptions(),
      },
      port: process.env.npm_package_config_dev_server_port || 3000,
      proxy: [
        // Biometric auth endpoints: /api/docuid/biometric/* -> /api/biometric/*
        {
          context: ['/api/docuid/biometric'],
          target: apiTarget.url,
          changeOrigin: true,
          secure: apiTarget.secure,
          pathRewrite: {
            '^/api/docuid/biometric': '/api/biometric'
          },
          logLevel: 'debug'
        },
        // Document endpoints: handles both /api/documents/* and /api/dashboard/documents/*
        // Download/content endpoints go to /api/documents/
        // Other endpoints (word-files, access, etc.) go to /api/dashboard/documents/
        {
          context: ['/api/docuid/documents'],
          target: apiTarget.url,
          changeOrigin: true,
          secure: apiTarget.secure,
          pathRewrite: (path, req) => {
            console.log(`📡 Proxy pathRewrite: ${path}`);
            // Check if this is a download or content endpoint
            if (path.match(/\/api\/docuid\/documents\/\d+\/(download|content)$/)) {
              const newPath = path.replace('/api/docuid/documents', '/api/documents');
              console.log(`   → Rewriting to: ${newPath} (download/content)`);
              return newPath;
            }
            // All other document endpoints go to /api/dashboard/documents/
            const newPath = path.replace('/api/docuid/documents', '/api/dashboard/documents');
            console.log(`   → Rewriting to: ${newPath} (dashboard)`);
            return newPath;
          },
          logLevel: 'debug'
        },
        // Share endpoints: /api/docuid/shares/* -> /api/dashboard/shares/*
        {
          context: ['/api/docuid/shares'],
          target: apiTarget.url,
          changeOrigin: true,
          secure: apiTarget.secure,
          pathRewrite: {
            '^/api/docuid/shares': '/api/dashboard/shares'
          },
          logLevel: 'debug'
        }
      ]
    },
  };

  return config;
};
