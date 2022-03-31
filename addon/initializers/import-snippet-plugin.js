import ImportSnippetPlugin from '../import-snippet-plugin';

function pluginFactory(plugin) {
  return {
    create: (initializers) => {
      const pluginInstance = new plugin();
      Object.assign(pluginInstance, initializers);
      return pluginInstance;
    },
  };
}

export function initialize(application) {
  application.register(
    'plugin:import-snippet',
    pluginFactory(ImportSnippetPlugin),
    {
      singleton: false,
    }
  );
}

export default {
  initialize,
};
