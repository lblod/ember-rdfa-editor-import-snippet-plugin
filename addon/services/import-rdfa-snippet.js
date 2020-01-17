import Service from '@ember/service';
import { A } from '@ember/array';
import fetch from 'fetch';
import ContextScanner from '@lblod/marawa/rdfa-context-scanner';

class RdfaSnippet {
  constructor(resourceUri, resourceTypes, source, content, resourceNode) {
    this.resourceUri = resourceUri;
    this.resourceTypes = resourceTypes;
    this.source = source;
    this.content = content;
    this.resourceNode = resourceNode;
  }

  get resourceTypeString() {
    return (this.resourceTypes || []).join(', ');
  }
}

/**
 * Service responsible for fetching and storing a snippet
 *
 * Assumptions
 * -----------
 *  - one toplevel rdfa block per snippet
 *
 * @module editor-import-snippet-plugin
 * @class ImportRdfaSnippet
 * @constructor
 * @extends EmberService
 */
export default Service.extend({
  errors: null,
  snippets: null,

  init() {
    this._super(...arguments);
    this.set('snippets', A([]));
    this.set('errors', A([]));
    this.set('contextScanner', new ContextScanner());
  },

  /**
   * Download, processes and stores snippet
   * @method downloadSnippet
   * @param {Object}: {source}
   * @return {String}
   * @public
  */
  async downloadSnippet(params){
    const data =  await this.getSnippet(params);
    if (data)
      await this.processSnippet(params, data);
  },

  /**
   * Returns all snippets for a resource URI or empty array;
   * @method snippetsForResource
   * @param {String} uri
   * @return [ { SnippetDataFields } ]
   * @public
  */
  snippetsForResource(resourceUri){
    return this.snippets.filter(s => s.resourceUri == resourceUri); //if this turns out too slow, we can move this to hash
  },

  /**
   * Removes all snippets for a resource URI;
   * @method removeAllSnippetsForResource
   * @param {String} uri
   * @public
  */
  removeAllSnippetsForResource(resourceUri){
    const updatedSnippets = this.snippets.filter(s => s.resourceUri != resourceUri); //if this turns out too slow, we can move this to hash
    this.set('snippets', updatedSnippets);
  },

  /**
   * Fetches snippet from remote
   * @method processSnippet
   * @param {Object} { source }
   * @param {Object} { text } (result from ember fetch call)
   * @private
  */
  async getSnippet(params){
    let data = null;
    try {
      data = await fetch(params.source, { headers: { 'Accept': 'text/html' } });
      if (!data) {
        this.errors.pushObject({source: params.source, 'details': `No data found for ${params.uri}`});
      }
    } catch(err) {
      this.errors.pushObject({source: params.source, 'details': `Error fetching data ${params.uri}: ${err}`});
    }
    return data;
  },

  /**
   * Processes and stores snippet
   * @method processSnippet
   * @param {Object} { source }
   * @param {Object} { text } (result from ember fetch call)
   * @private
  */
  async processSnippet(params, data){
    try {
      const snippet = await data.text();
      const snippetElements = this.htmlToElements(snippet);
      const rdfaBlocks = snippetElements
            .map(e => this.contextScanner.analyse(e))
            .reduce((acc, blocks) => [...acc, ...blocks], []);

      // TODO the way the outerRdfaBlock is selected is not correct.
      // The semanticNode of the first RDFa block is not necessarily the node containing the top-level subject.
      // The new context scanner interface should offer us a way to easily get an annoted parent rich node.
      let outerRdfaBlock = rdfaBlocks.find(b => b.context.length);
      if (!outerRdfaBlock){
        this.errors.pushObject({source: params.source, 'details': `No RDFa content found for ${params.uri}`});
      } else {
        const resourceUri = outerRdfaBlock.context.find(t => t.subject).subject;  // first triple might not have a subject if the snippet starts with property="..."
        const resourceTypes = outerRdfaBlock.context.filter(t => t.subject == resourceUri && t.predicate == 'a').map(t => t.object);
        const resourceNode = outerRdfaBlock.semanticNode;
        this.storeSnippet(resourceUri, resourceTypes, params.source, snippet, resourceNode);
      }
    }
    catch(err) {
      this.errors.pushObject({source: params.source, 'details': `Error fetching data ${params.uri}: ${err}`});
    }
  },

  /**
   * Make HTML Content Template from string
   * @method htmlToElement
   * @param {String}
   * @return {Object}
   * @private
  */
  htmlToElements(html) {
    const template = document.createElement('template');
    template.innerHTML = html;
    return [...template.content.children];
  },

  /**
   * Stores snippet
   * @method storeSnippet
   * @param {String} resourceUri
   * @param {String} source
   * @param {String} content
   * @param {RichNode} resourceNode
   * @private
  */
  storeSnippet(resourceUri, resourceTypes, source, content, resourceNode){
    this.snippets.pushObject(new RdfaSnippet(resourceUri, resourceTypes, source, content, resourceNode));
  }

});
