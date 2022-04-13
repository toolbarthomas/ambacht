export default {
  workers: {
    AssetExporter: {
      entry: {
        components: '**/components/**/*.css',
        typography: '**/typography/**/*.css',
      },
      options: {
        includeLiteral: [
          {
            entry: 'components',
            export: 'css',
            import: 'https://cdn.jsdelivr.net/gh/lit/dist@2.2.1/core/lit-core.min.js',
          },
          {
            entry: 'typography',
            export: 'css',
            import: 'https://cdn.jsdelivr.net/gh/lit/dist@2.2.1/core/lit-core.min.js',
          },
        ],
      },
    },
    JsCompiler: {
      entry: {
        core: 'core/**/**.js',
        components: 'components/**/**.js',
        typography: 'typography/**/**.js',
      },
    },
    Resolver: {
      entry: {
        '@webcomponents/webcomponentsjs': 'webcomponents-loader.js',
        '@lit/reactive-element/polyfill-support.js': 'polyfill-support.js',
      },
    },
    SassCompiler: {
      entry: {
        components: '**/components/**/**.scss',
        typography: '**/typography/**/**.scss',
      },
    },
  },
  plugins: {
    Watcher: {
      instances: {
        stylesheets: {
          event: 'change',
          path: '**/**.scss',
          workers: ['SassCompiler', 'AssetExporter'],
        },
        javascripts: {
          event: 'change',
          path: '**/**.js',
          workers: ['JsCompiler'],
        },
      },
    },
  },
};
