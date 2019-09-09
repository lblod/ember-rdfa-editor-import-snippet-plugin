import Component from '@ember/component';
import layout from '../../templates/components/editor-plugins/suggested-snippets-import';
import { reads } from '@ember/object/computed';
import ContextScanner from '@lblod/marawa/rdfa-context-scanner';
import { inject as service } from '@ember/service';

export default Component.extend({
  layout,
  editor: reads('info.editor'),
  importRdfaSnippet: service(),

  getVocab(rdfaBlock){
    return (((rdfaBlock || {}).semanticNode || {}).rdfaAttributes || {}).vocab;
  },

  getPrefixes(rdfaBlock){
    return ((rdfaBlock || {}).semanticNode || {}).rdfaPrefixes || {};
  },

  actions: {
    closeHints() {
      this.closeHints();
    },

    insert(){
      //Brutally inserts snippet for now
      //TODO: needs further discussion on how the selectionApi may be used to get current vocab and prefix
      let rdfaBlock = this.importRdfaSnippet.snippets.firstObject.rdfaBlock;
      let newPrefixes = this.getPrefixes(rdfaBlock);
      let newVocab = this.getVocab(rdfaBlock);
      const selection = this.editor.selectCurrentSelection();

      this.editor.update(selection, {
        set: {
          typeof: rdfaBlock.semanticNode.rdfaAttributes.typeof.join(" ")
        }
      });

      this.editor.update(selection, {
        add: {
          prefix: Object.keys(newPrefixes).map(k => `${k}: ${newPrefixes[k]}`).join(' ')
        }
      });

      if(newVocab){
        this.editor.update(selection, {
          add: {
            vocab: newVocab
          }
        });
      }

      this.editor.update(selection, {
        set: {
          innerHTML: rdfaBlock.semanticNode.domNode.innerHTML
        }
      });

    }
  }
});
