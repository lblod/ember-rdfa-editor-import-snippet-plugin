import Component from '@ember/component';
import layout from '../../templates/components/editor-plugins/suggested-snippets-import';
import { reads } from '@ember/object/computed';

export default Component.extend({
  layout,
  editor: reads('info.editor'),
  actions: {
    closeHints() {
      this.closeHints();
    }
  }
});
