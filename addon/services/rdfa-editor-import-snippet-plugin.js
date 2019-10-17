import Service, { inject as service } from '@ember/service';
import EmberObject from '@ember/object';
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
  },


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

    /*
     * When the resource matches a snippet, we want the region of the toplevel node describing the resource hinted.
     * Basically the capital 'R' nodes:
     *                       o
     *                      /  \
     *        This one <--  R   o
     *                     /|\  |\
     *                    r r r o R  -> This one
                                  /\
     *                           r  r
     * Note: this is not going to work for self referring (nested) resources.
     * TODO: On second thought, the logic might be very complicated and there will be probably some tools (context,
     *       pernet to counter this...)
     */
    for(let context of contexts){
      let potentialContext = context.context.slice(-1)[0] || {}; // We take the most specific subject of the context.
      let snippets = this.snippetsForContext(potentialContext); //TODO: assumes the snippets download is ready.
      if (snippets.length === 0 ) continue;

      let semanticNodeLocation = [ context.semanticNode.start, context.semanticNode.end ];

      // We store largest region from hint, so there can only be one hint with region containing other regions for a resource.
      //TODO: I assume the hrId hasn't evolved since this function is a sync block
      // Note: max one hint is expected, since we store only the biggest region
      let existingHintContainingLocation = this.getHintContainingLocationForResource(myHints, semanticNodeLocation, potentialContext.subject);
      let newHintContainingLocation = this.getHintContainingLocationForResource(hints, semanticNodeLocation, potentialContext.subject);

      // Case: we have found hints in the registry which contains current location
      // Then take this location and add the latest state of snippets data to it.
      if(existingHintContainingLocation && !newHintContainingLocation){
        hintsRegistry.removeHintsAtLocation(existingHintContainingLocation.location, hrId, this.get('who'));
        hints.push(this.generateCard(hrId, hintsRegistry, editor, existingHintContainingLocation.location, 'Nieuwe snippets', snippets));
        continue;
      }

      // Case: no bigger regions have been found, not in the hintsRegistry, nor in the newly created hints
      // If the currentLocation contains the one in the registry, we clean the registry.
      // After, we simply add the hint.
      if(!existingHintContainingLocation && !newHintContainingLocation){

        // Check if the new location does contains contain hints from registry
        // Note: this check is not needed for newHintContainingLocation, since context scanner goes depth first.
        // Note: multiple hints may be contained by the new location. (see. e.g. topNode in example doc above)
        let containedHints = this.getHintsForResourceContainedByLocation(myHints, semanticNodeLocation, potentialContext.subject);
        if(containedHints.length > 0){
          containedHints.forEach(h => hintsRegistry.removeHintsAtLocation(h.location, hrId, this.get('who')));
        }
        hintsRegistry.removeHintsAtLocation(semanticNodeLocation, hrId, this.get('who'));
        hints.push(this.generateCard(hrId, hintsRegistry, editor, semanticNodeLocation, 'Nieuwe snippets', snippets));
        continue;
      }

      // Case: we have found new hint wich contains current location
      // We do nothing, the bigger hint wins and will be inserted
      if(newHintContainingLocation){
        continue;
      }

    }

    if(hints.length > 0){
      hintsRegistry.addHints(hrId, this.get('who'), hints);
    }
  }),

  getHintContainingLocationForResource(hints, location, resource){
    return hints.filter(h => this.containsLocation(h.location, location) && h.info.resource === resource)[0];
  },

  getHintsForResourceContainedByLocation(hints, location, resource){
    return hints.filter(h => this.containsLocation(location, h.location) && h.info.resource === resource);
  },

  containsLocation(refLocation, testLocation){
      return refLocation[0] <= testLocation[0] && testLocation[1] <= refLocation[1];
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
        who: this.get('who'),
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
