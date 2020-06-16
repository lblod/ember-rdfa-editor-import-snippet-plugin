import Component from '@glimmer/component';
import isEmpty from '@lblod/ember-rdfa-editor/utils/is-empty';
import { inject as service } from '@ember/service';
import { action } from '@ember/object';

export default class SuggestedSnippetsImport extends Component {
  @service importRdfaSnippet;

  get info() {
    return this.args.info;
  }

  get editor() {
    return this.info.editor;
  }

  @action
  insert(snippet){
    if (snippet.type == 'roadsign') {
      const selection = this.editor.selectContext(this.editor.currentSelection, { typeof: 'http://data.vlaanderen.be/ns/besluit#Besluit'});
      if (! isEmpty(selection)) {
        this.editor.update(selection, {
          append: {
            innerHTML: `Bijlage uit externe bron
                     <div property="http://data.europa.eu/eli/ontology#cites" resource="${snippet.source}">
                         <div property="http://www.w3.org/ns/prov#value">${snippet.content}</div>
                     </div>`,
            property: 'http://lblod.data.gift/vocabularies/editor/isLumpNode'
          }
        });
      }
      else {
        // not inside a decision, just dump it where the cursor is?
        this.editor.update(this.editor.selectCurrentSelection(), {
          set: {
            innerHTML: snippet.content
          }
        });
      }
    }
    else {
      this.editor.update(this.editor.selectCurrentSelection(), {
        set: {
          innerHTML: snippet.content
        }
      });
    }
    this.importRdfaSnippet.removeSnippet(snippet);
    this.closeHints();
  }
}
