import Service, { inject as service } from '@ember/service';
// TODO: this import is not exactly pretty
import {  findUniqueRichNodes } from '@lblod/ember-rdfa-editor/utils/rdfa/rdfa-rich-node-helpers';
const IMPORT_COMPONENT = 'editor-plugins/import-as-attachment';
/**
 * Service responsible for matching rdfa-snippets.
 *
 * @module editor-import-snippet-plugin
 * @class RdfaEditorImportSnippetPlugin
 * @constructor
 * @extends EmberService
 */
export default class RdfaEditorImportSnippetPlugin extends Service {
  editorApi = "0.1"

  @service importRdfaSnippet;

  /**
   * When pressing the '+' button, a card is shown.
   * @method suggestHint
   * @public
   */
  async suggestHints(context, editor) {
    const snippets = this.importRdfaSnippet.snippets;
    if (snippets.length) {
      return [{
        component: 'editor-plugins/suggested-snippets-import',
        info: { snippets, editor }
      }];
    } else {
      return [];
    }
  }


  /**
   * Currently creates a (hidden) hint for every decision and has the card check whether it really has anything to hint
   * this way we can avoid cleaning up existing hints when a snippet is consumed
   *
   * @method execute
   *
   * @param {Array} rdfaBlocks
   * @param {Object} hintsRegistry Registry of hints in the editor
   * @param {Object} editor The RDFa editor instance
   *
   *
   * @public
   */
  async execute(rdfaBlocks, hintsRegistry, editor) {
    hintsRegistry.removeHints({rdfaBlocks, scope: IMPORT_COMPONENT});
    const uniqueRichNodes = findUniqueRichNodes(rdfaBlocks, { typeof: 'http://data.vlaanderen.be/ns/besluit#Besluit' });
    for (const richNode of uniqueRichNodes) {
      hintsRegistry.removeHints({region: richNode.region, scope: IMPORT_COMPONENT});
      const location = richNode.region;
      hintsRegistry.addHint( IMPORT_COMPONENT, {
        location,
        card: IMPORT_COMPONENT,
        info: {
          card: IMPORT_COMPONENT,
          hintsRegistry,
          editor,
          location,
          selectionContext: { typeof: 'http://data.vlaanderen.be/ns/besluit#Besluit' }
        },
        options: { noHighlight: true }
      });
    }
  }
}
