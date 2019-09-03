import Service from '@ember/service';
import { A } from '@ember/array';
import fetch from 'fetch';
import ContextScanner from '@lblod/marawa/rdfa-context-scanner';

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
    let data =  await this.getSnippet(params);
    if(!data) return;
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
      if(!data){
        this.errors.pushObject({source: params.source, 'details': `No data found for ${params.uri}`});
      }
    }
    catch(err){
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
    try{
      let snippet = await data.text();
      let template = this.htmlToElement(snippet);
      let rdfaBlocks = this.contextScanner.analyse(template);
      let outerRdfaBlock = rdfaBlocks.find(b => b.context.find(c => c.subject));
      if(!outerRdfaBlock){
        this.errors.pushObject({source: params.source, 'details': `No RDFA content found for ${params.uri}`});
        return;
      }
      let resourceUri = (outerRdfaBlock.context.find(c =>  c.subject )).subject;

      this.storeSnippet(resourceUri, params.source, snippet);
    }
    catch(err){
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
  htmlToElement(html) {
    let template = document.createElement('template');
    template.innerHTML = html;
    return template.content.firstChild;
  },

  /**
   * Stores snippet
   * @method storeSnippet
   * @param {String} uri
   * @param {String} sourceUri
   * @param {String} snippet
   * @private
  */
  storeSnippet(resourceUri, source, snippet){
    this.snippets.pushObject({ resourceUri, source, snippet } );
  }

});
//Test with:
// EDIT
//http://localhost:4200/import/edit?source=http://localhost:4203/snippets/example-2.html&target=http://foo&mock=true
// NEW
//http://localhost:4200/import/new?source=http://localhost:4203/snippets/example-2.html&mock=true
