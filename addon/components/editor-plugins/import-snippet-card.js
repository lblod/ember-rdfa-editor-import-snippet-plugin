import { reads } from '@ember/object/computed';
import Component from '@ember/component';
import layout from '../../templates/components/editor-plugins/import-snippet-card';
import ContextScanner from '@lblod/marawa/rdfa-context-scanner';
import { inject as service } from '@ember/service';

/**
* Card displaying a hint of the Date plugin
*
* @module editor-import-snippet-plugin
* @class ImportSnippetCard
* @extends Ember.Component
*/
export default Component.extend({
  layout,

  importRdfaSnippet: service(),

  /**
   * Region on which the card applies
   * @property location
   * @type [number,number]
   * @private
  */
  location: reads('info.location'),

  /**
   * Unique identifier of the event in the hints registry
   * @property hrId
   * @type Object
   * @private
  */
  hrId: reads('info.hrId'),

  /**
   * The RDFa editor instance
   * @property editor
   * @type RdfaEditor
   * @private
  */
  editor: reads('info.editor'),

  /**
   * Hints registry storing the cards
   * @property hintsRegistry
   * @type HintsRegistry
   * @private
  */
  hintsRegistry: reads('info.hintsRegistry'),

  resource: reads('info.resource'),

  snippets: reads('info.snippets'),

  who: reads('info.who'),

  getVocab(rdfaBlock){
    return (((rdfaBlock || {}).semanticNode || {}).rdfaAttributes || {}).vocab;
  },

  getOuterRdfaBlockForResource(domNode, resource, location = []){
    let contextScanner = new ContextScanner();
    let rdfaBlocks = contextScanner.analyse(domNode, location);
    let outerRdfaBlock = rdfaBlocks.find(b => b.context.find(c => c.subject == resource ));
    return outerRdfaBlock;
  },

  getPrefixes(rdfaBlock){
    return ((rdfaBlock || {}).semanticNode || {}).rdfaPrefixes || {};
  },

  diffObjectBfromA(b, a){
    return Object.keys(b).reduce((acc, key) => {
      if(!a[key]){
        acc[key] = b[key];
      }
      else if (a[key] !== b[key]){
        acc[key] = b[key];
      }
      return acc;
    }, {});
  },

  cleanUpRemainingSnippets(){
    this.importRdfaSnippet.removeAllSnippetsForResource(this.resource);
    let myHints = this.hintsRegistry.getHintsFromPlugin(this.get('who'));
    myHints.forEach(h => {
      if(h.info.resource == this.resource){
        this.hintsRegistry.removeHintsAtLocation(h.location, this.hrId, this.who);
      }
    });
  },

  actions: {
    insert(){
      let updatedLocation = this.get('hintsRegistry').updateLocationToCurrentIndex(this.get('hrId'), this.get('location'));
      let rdfaBlockDoc = this.getOuterRdfaBlockForResource(this.editor.rootNode, this.resource, updatedLocation);
      let prefixBlockDoc = this.getPrefixes(rdfaBlockDoc);
      let prefixesSnippet = this.getPrefixes(this.snippets[0].rdfaBlock);
      let newPrefixes = this.diffObjectBfromA(prefixesSnippet, prefixBlockDoc);
      let newVocab = this.getVocab(rdfaBlockDoc) == this.getVocab(this.snippets[0].rdfaBlock) ? null : this.getVocab(this.snippets[0].rdfaBlock);

      const selection = this.editor.selectContext(updatedLocation, {
        resource: this.resource
      });

      this.cleanUpRemainingSnippets();

      this.editor.update(selection, {
        set: {
          typeof: this.snippets[0].rdfaBlock.semanticNode.rdfaAttributes.typeof.join(" ")
        }
      });

      if(Object.keys(newPrefixes).length > 0){
        this.editor.update(selection, {
          add: {
            prefix: Object.keys(newPrefixes).map(k => `${k}: ${newPrefixes[k]}`).join(' ')
          }
        });
      }

      if(newVocab){
        this.editor.update(selection, {
          add: {
            vocab: newVocab
          }
        });
      }

      this.editor.update(selection, {
        set: {
          innerHTML: this.snippets[0].rdfaBlock.semanticNode.domNode.innerHTML
        }
      });

    }
  }
});
