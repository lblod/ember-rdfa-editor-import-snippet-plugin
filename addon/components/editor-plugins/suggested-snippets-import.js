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
      let snippetData = this.importRdfaSnippet.snippets.firstObject;
      let rdfaBlock = snippetData.rdfaBlock;
      let newPrefixes = this.getPrefixes(rdfaBlock);
      let newVocab = this.getVocab(rdfaBlock);
      const selection = this.editor.selectCurrentSelection();

      let setResource = {
        typeof: rdfaBlock.semanticNode.rdfaAttributes.typeof.join(" "),
        resource: snippetData.resourceUri
      };

      if(Object.keys(newPrefixes).length > 0){
        setResource['prefix'] = Object.keys(newPrefixes).map(k => `${k}: ${newPrefixes[k]}`).join(' ');
      }

      if(newVocab){
        setResource['vocab'] = newVocab;
      }

       this.editor.update(selection, {
         set: setResource
       });

      this.editor.update(selection, {
        set: {
          innerHTML: rdfaBlock.semanticNode.domNode.innerHTML
        }
      });

    }
  }
});
