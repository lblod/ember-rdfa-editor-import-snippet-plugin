import Component from '@glimmer/component';
import { inject as service } from '@ember/service';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';

export default class EditorPluginsImportAsAttachmentComponent extends Component {
  @service importRdfaSnippet;
  @tracked snippets = [];
  @tracked besluitNode;

  constructor() {
    super(...arguments);
    this.args.controller.onEvent(
      'selectionChanged',
      this.selectionChangedHandler
    );
  }

  @action
  selectionChangedHandler() {
    this.snippets = this.importRdfaSnippet.snippetsForType('roadsign');
    const limitedDatastore = this.args.controller.datastore.limitToRange(
      this.args.controller.selection.lastRange,
      'rangeIsInside'
    );
    const besluit = limitedDatastore
      .match(null, 'a', '>http://data.vlaanderen.be/ns/besluit#Besluit')
      .asSubjectNodes()
      .next().value;
    if (besluit) {
      this.besluitNode = [...besluit.nodes][0];
    } else {
      this.besluitNode = undefined;
    }
  }

  @action
  insert(snippet, type) {
    const html = this.generateSnippetHtml(snippet, type);
    let rangeToInsert;
    if (this.besluitNode) {
      rangeToInsert = this.args.controller.rangeFactory.fromInNode(
        this.besluitNode,
        this.besluitNode.getMaxOffset(),
        this.besluitNode.getMaxOffset()
      );
    } else {
      rangeToInsert = this.args.controller.selection.lastRange;
    }
    this.args.controller.executeCommand('insert-html', html, rangeToInsert);
    this.importRdfaSnippet.removeSnippet(snippet);
  }

  generateSnippetHtml(snippet, type) {
    if (type === 'attachment') {
      return `
        <div property="http://lblod.data.gift/vocabularies/editor/isLumpNode">
          <div 
            resource="${snippet.source}" 
            property="http://data.europa.eu/eli/ontology#related_to"
            typeof="http://xmlns.com/foaf/0.1/Document http://lblod.data.gift/vocabularies/editor/SnippetAttachment"
          >
            Bijlage uit externe bron <a href="${snippet.source}">${
        new URL(snippet.source).hostname
      }</a>
            <div property="http://www.w3.org/ns/prov#value">${
              snippet.content
            }</div>
          </div>
        </div>
      `;
    } else {
      return `
        <div property="http://lblod.data.gift/vocabularies/editor/isLumpNode">
          Bijlage uit externe bron
          <div property="http://data.europa.eu/eli/ontology#related_to" resource="${snippet.source}">
              <div property="http://www.w3.org/ns/prov#value">${snippet.content}</div>
          </div>
        </div>
      `;
    }
  }
}