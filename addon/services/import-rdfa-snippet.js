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
   * Removes all snippets for a resource URI;
   * @method removeAllSnippetsForResource
   * @param {String} uri
   * @public
  */
  removeAllSnippetsForResource(resourceUri){
    let updatedSnippets = this.snippets.filter(s => s.resourceUri != resourceUri); //if this turns out too slow, we can move this to hash
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
      let origSnippet = await data.text();
      let template = this.htmlToElement(origSnippet);
      let rdfaBlocks = this.contextScanner.analyse(template);

      let outerRdfaBlock = rdfaBlocks.find(b => b.context.find(c => c.subject));
      if(!outerRdfaBlock){
        this.errors.pushObject({source: params.source, 'details': `No RDFA content found for ${params.uri}`});
        return;
      }
      let resourceUri = (outerRdfaBlock.context.find(c =>  c.subject )).subject;

      this.storeSnippet(resourceUri, params.source, origSnippet, outerRdfaBlock);
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
  storeSnippet(resourceUri, source, origSnippet, rdfaBlock){
    this.snippets.pushObject({ resourceUri, source, origSnippet, rdfaBlock} );
  }

});
