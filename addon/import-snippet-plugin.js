/**
 * Entry point for ImportSnippetPlugin
 *
 * @module ember-rdfa-editor-import-snippet
 * @class ImportSnippetPlugin
 * @constructor
 * @extends EmberService
 */
export default class ImportSnippetPlugin {
  get name() {
    return 'import-snippet';
  }

  initialize(transaction, controller) {
    transaction.registerWidget(
      {
        componentName: 'import-snippet-card',
        identifier: 'import-snippet-plugin/card',
        desiredLocation: 'sidebar',
      },
      controller
    );
  }
}
