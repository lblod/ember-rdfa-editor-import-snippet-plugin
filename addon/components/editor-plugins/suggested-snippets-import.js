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
      const selection = this.editor.selectCurrentSelection();
      console.log(selection);
      console.log(snippet);
      this.editor.update(selection, {
        set: {
          innerHTML: snippet.content
        }
      });

      this.importRdfaSnippet.removeAllSnippetsForResource(snippet.resourceUri);
      this.closeHints();
    }
  }
});
