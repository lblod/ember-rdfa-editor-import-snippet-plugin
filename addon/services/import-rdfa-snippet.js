import Service from '@ember/service';
import { A } from '@ember/array';
import fetch from 'fetch';
import ContextScanner from '@lblod/marawa/rdfa-context-scanner';

class RdfaSnippet {
  constructor(source, content, blocks) {
    this.source = source;
    this.content = content;
    this.blocks = blocks;
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
   * @param params.omitCredentials {String} if truthy, the fetch call will omit credentials (this is important for endpoints that only provide simple CORS headers). When not set or falsy we fetch with "include" credentials. This means the endpoint needs to provide the Access-Control-Allow-Credentials and Access-Controlled-Allow-Origin needs to be set to the requesting domain ('*' is not allowed)
   * @param params.source {String} the URL of the document to fetch
   * @result {Response} result from ember fetch call
   * @private
  */
  async getSnippet(params){
    let data = null;
    try {
      const credentials = params.omitCredentials ? "omit" : "include";
      data = await fetch(params.source, { credentials } );

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
      this.storeSnippet(params.source, snippet, rdfaBlocks);
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
   * @param {String} source the source url of the snippet
   * @param {String} content the unparsed text content of the snippet
   * @param {Array} block array of richnodes representing the content of the snippet
   * @private
  */
  storeSnippet(source, content, blocks){
    this.snippets.pushObject(new RdfaSnippet(source, content, blocks));
  }

});
