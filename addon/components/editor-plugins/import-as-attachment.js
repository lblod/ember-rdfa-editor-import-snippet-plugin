import Component from '@glimmer/component';
import { inject as service } from '@ember/service';
import { action } from '@ember/object';

export default class EditorPluginsImportAsAttachmentComponent extends Component {
  @service importRdfaSnippet;

  get editor() {
    return this.args.info.editor;
  }

  get snippets() {
    return this.importRdfaSnippet.snippetsForType('roadsign');
  }


  get hintsRegistry() {
    return this.args.info.hintsRegistry;
  }

  get info() {
    return this.args.info;
  }

  @action
  insert(snippet){
    const selection = this.editor.selectContext(this.info.location, this.info.selectionContext);
    this.editor.update(selection, {
      append: {
        innerHTML: `Bijlage uit externe bron
                     <div property="http://data.europa.eu/eli/ontology#cites" resource="${snippet.source}">
                         <div property="http://www.w3.org/ns/prov#value">${snippet.content}</div>
                     </div>`,
        property: 'http://lblod.data.gift/vocabularies/editor/isLumpNode'
      }
    });
    this.hintsRegistry.removeHintsAtLocation(this.info.location, this.info.card);
  }
}
