export default {
  workers: {
    AssetExporter: {
      entry: {
        core: '**/core/**/*.css',
        components: '**/components/**/*.css',
        typography: '**/typography/**/*.css',
      },
      options: {
        includeLiteral: [
          {
            entry: 'core',
            export: 'css',
            import: 'https://cdn.jsdelivr.net/gh/lit/dist@2.2.1/core/lit-core.min.js',
          },
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
        core: '**/core/**/**.scss',
        components: '**/components/**/**.scss',
        typography: '**/typography/**/**.scss',
      },
    },
    StyleguideHelper: {
      options: {
        ignoreKeywords: ['ambacht'],
        configurationExtensions: ['yml', 'yaml', 'json'],
        ignoreInitial: true,
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
