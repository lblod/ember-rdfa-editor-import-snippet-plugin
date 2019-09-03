import { getOwner } from '@ember/application';
import Service from '@ember/service';
import { inject as service } from '@ember/service';
import EmberObject, { computed } from '@ember/object';
import { task } from 'ember-concurrency';

/**
 * Service responsible for matching rdfa-snippets
 *
 * @module editor-import-snippet-plugin
 * @class RdfaEditorImportSnippetPlugin
 * @constructor
 * @extends EmberService
 */
const RdfaEditorImportSnippetPlugin = Service.extend({

  importRdfaSnippet: service(),

  /**
   * task to handle the incoming events from the editor dispatcher
   *
   * @method execute
   *
   * @param {string} hrId Unique identifier of the event in the hintsRegistry
   * @param {Array} contexts RDFa contexts of the text snippets the event applies on
   * @param {Object} hintsRegistry Registry of hints in the editor
   * @param {Object} editor The RDFa editor instance
   *
   * @public
   */
  execute: task(function * (hrId, contexts, hintsRegistry, editor) {
    if (contexts.length === 0) return;
    let myHints = hintsRegistry.getHintsFromPlugin(this.get('who'));

    const hints = [];
    for(let context of contexts){
      let potentialContext = context.context.slice(-1)[0] || {}; // We take the most specific subject of the context.
      let snippets = this.snippetsForContext(potentialContext); //TODO: assumes the snippets download is ready.
      if (snippets.length === 0 ) continue;

      let semanticNodeLocation = [ context.semanticNode.start, context.semanticNode.end ];
      let updatedSemanticNodeLocation = hintsRegistry.updateLocationToCurrentIndex(hrId, semanticNodeLocation);

      // We store largest region from hint, so there can only be one hint with region containing other regions for a resource.
      let existingHintContainingLocation = this.getHintContainingLocationForResource(myHints, updatedSemanticNodeLocation, potentialContext.subject);
      let newHintContainingLocation = this.getHintContainingLocationForResource(hints, semanticNodeLocation, potentialContext.subject);

      // Case: no bigger regions have been found, not in the hintsRegistry, nor in the newly created hints
      // We can simply add the hint.
      if(!existingHintContainingLocation && !newHintContainingLocation){
        hintsRegistry.removeHintsInRegion(semanticNodeLocation, hrId, this.get('who'));
        hints.push(this.generateCard(hrId, hintsRegistry, editor, semanticNodeLocation, 'Nieuwe snippets', snippets));
        continue;
      }

      // Case: we have found hints in the registry which contains current location
      // Then append the new snippet data to the hint
      if(existingHintContainingLocation && !newHintContainingLocation){
        let updatedSnippets = this.appendSnippets(existingHintContainingLocation.info.snippets, snippets);
        hintsRegistry.removeHintsInRegion(existingHintContainingLocation.location, hintsRegistry.currentIndex(), this.get('who'));
        hints.push(this.generateCard(hintsRegistry.currentIndex(), hintsRegistry, editor, existingHintContainingLocation.location, 'Nieuwe snippets', updatedSnippets));
      }

      // if(newHintContainingLocation) => means hint will be pushed after current loop, no further action is needed.
      // Not possible there is an additionnal snippet since the state of importRdfaSnippet didn't change
      // during the exection of this method
    }
    if(hints.length > 0){
      hintsRegistry.addHints(hrId, this.get('who'), hints);
    }
  }),

  getHintContainingLocationForResource(hints, location, resource){
    return hints.filter(h => h.location[0] <= location[0] && location[1] <= h.location[1] && h.info.resource === resource)[0];
  },

  appendSnippets(existingSnippets, newSnippets){
    let mergedSnippets = existingSnippets;
    newSnippets.forEach(ns => {
      if(!existingSnippets.find(es => ns.snippet == es.snippet)){
        mergedSnippets.pushObject(ns);
      }
    });
    return mergedSnippets;
  },

  /**
   * When pressing the '+' button, a card is shown.
   * @method suggestHint
   *
   */
  async suggestHints(context, editor) {
    let snippets = this.get('importRdfaSnippet.snippets');
    if(snippets.length === 0) return [];
    else
      return [{ component: 'editor-plugins/suggested-snippets-import', info: {snippets, editor}}];
  },

  /**
   * Tries to find snippets for context
   *
   * @method snippetsForContext
   *
   * @param {Object} context Text snippet at a specific location with an RDFa context
   *
   * @return {Array} [ snippet ]
   *
   * @private
   */
  snippetsForContext(context){
    return this.importRdfaSnippet.snippetsForResource(context.subject);
  },

  /**
   * Generates a card given a hint
   *
   * @method generateCard
   *
   * @param {string} hrId Unique identifier of the event in the hintsRegistry
   * @param {Object} hintsRegistry Registry of hints in the editor
   * @param {Object} editor The RDFa editor instance
   * @param {Object} hint containing the hinted string and the location of this string
   *
   * @return {Object} The card to hint for a given template
   *
   * @private
   */
  generateCard(hrId, hintsRegistry, editor, location, text, snippets){
    return EmberObject.create({
      info: {
        label: this.get('who'),
        plainValue: text,
        location: location,
        resource: snippets[0].resourceUri,
        snippets,
        hrId, hintsRegistry, editor
      },
      location,
      card: this.get('who')
    });
  }
});

RdfaEditorImportSnippetPlugin.reopen({
  who: 'editor-plugins/import-snippet-card'
});
export default RdfaEditorImportSnippetPlugin;
