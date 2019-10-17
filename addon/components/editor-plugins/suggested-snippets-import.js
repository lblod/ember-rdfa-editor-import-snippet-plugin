import Component from '@ember/component';
import layout from '../../templates/components/editor-plugins/suggested-snippets-import';
import { reads } from '@ember/object/computed';
import { inject as service } from '@ember/service';

export default Component.extend({
  layout,

  importRdfaSnippet: service(),

  editor: reads('info.editor'),
  snippets: reads('info.snippets'),

  actions: {
    closeHints() {
      this.closeHints();
    },

    insert(snippet){
      // TODO Brutal addition of vocab and prefixes on inserted snippet.
      // Needs further discussion how we can merged these with the wrapping node's vocab and prefixes.
      const resourceNode = snippet.resourceNode;
      const snippetPrefixes = resourceNode.rdfaPrefixes || {};

      const selection = this.editor.selectCurrentSelection();

      const setResource = {
        resource: snippet.resourceUri,
        typeof: snippet.resourceTypes.join(' '),
      };

      const vocab = snippetPrefixes[''];
      if (vocab){
        setResource['vocab'] = vocab;
      }

      const prefixes = Object.keys(snippetPrefixes).filter(k => k != '');
      if (prefixes.length){
        setResource['prefix'] = prefixes.map(k => `${k}: ${snippetPrefixes[k]}`).join(' ');
      }

       this.editor.update(selection, {
         set: setResource
       });

      this.editor.update(selection, {
        set: {
          innerHTML: resourceNode.domNode.innerHTML
        }
      });

      this.importRdfaSnippet.removeAllSnippetsForResource(snippet.resourceUri);
      this.closeHints();
    }
  }
});
