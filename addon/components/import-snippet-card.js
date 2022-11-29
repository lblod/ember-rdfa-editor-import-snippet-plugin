import Component from '@glimmer/component';
import { inject as service } from '@ember/service';
import { action } from '@ember/object';
import { DOMParser as ProseParser } from 'prosemirror-model';
export default class ImportSnippetCard extends Component {
  @service importRdfaSnippet;

  get controller() {
    return this.args.controller;
  }

  get snippets() {
    const selection = this.controller.state.selection;
    if (!selection.from) {
      console.info(
        'Selection did not have a from position, skipping handling of the selectionChanged event'
      );
      return [];
    }
    return this.importRdfaSnippet.snippetsForType('roadsign');
  }

  get insertRange() {
    let range = this.controller.state.selection;
    this.controller.state.doc.descendants((node, pos) => {
      if (
        node.attrs['typeof']?.includes('besluit:Besluit') ||
        node.attrs['typeof']?.includes(
          'http://data.vlaanderen.be/ns/besluit#Besluit'
        )
      ) {
        range = { from: pos + node.nodeSize - 1, to: pos + node.nodeSize - 1 };
        return false;
      }
    });
    return range;
  }

  @action
  insert(snippet, type) {
    const insertRange = this.insertRange;
    if (insertRange) {
      const node = this.generateSnippetHtml(snippet, type);
      this.controller.withTransaction((tr) => {
        return tr.replaceRangeWith(insertRange.from, insertRange.to, node);
      });
      this.importRdfaSnippet.removeSnippet(snippet);
    } else {
      console.warn('Could not find a range to insert, so we skipped inserting');
    }
  }

  @action
  generateSnippetHtml(snippet, type) {
    const domParser = new DOMParser();
    const contentFragment = ProseParser.fromSchema(
      this.controller.schema
    ).parse(domParser.parseFromString(snippet.content, 'text/html')).content;
    const { schema } = this.controller;
    if (type === 'attachment') {
      return schema.node(
        'block_rdfa',
        { property: 'http://lblod.data.gift/vocabularies/editor/isLumpNode' },
        [
          schema.node(
            'block_rdfa',
            {
              resource: snippet.resource,
              property: 'http://data.europa.eu/eli/ontology#related_to',
              typeof:
                'http://xmlns.com/foaf/0.1/Document http://lblod.data.gift/vocabularies/editor/SnippetAttachment',
            },
            [
              schema.node('paragraph', {}, [
                schema.text('Bijlage uit externe bron '),
                schema.text(new URL(snippet.source).hostname, [
                  schema.mark('link'),
                ]),
              ]),
              schema.node(
                'block_rdfa',
                { property: 'http://www.w3.org/ns/prov#value' },
                contentFragment
              ),
            ]
          ),
        ]
      );
    } else {
      return schema.node(
        'block_rdfa',
        { property: 'http://lblod.data.gift/vocabularies/editor/isLumpNode' },
        [
          schema.node('paragraph', {}, [
            schema.text('Bijlage uit externe bron'),
          ]),
          schema.node(
            'block_rdfa',
            {
              property: 'http://data.europa.eu/eli/ontology#related_to',
              resource: snippet.source,
            },
            [
              schema.node(
                'block_rdfa',
                { property: 'http://www.w3.org/ns/prov#value' },
                contentFragment
              ),
            ]
          ),
        ]
      );
    }
  }
}
