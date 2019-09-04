@lblod/ember-rdfa-editor-import-snippet-plugin
==============================================================================
Plugin allowing importing of external RDFA snippets and inserting it in the document.

Compatibility
-------------------------------------------------------------------------------

* Ember.js v2.18 or above
* Ember CLI v2.13 or above
* Node.js v8 or above

Installation
-------------------------------------------------------------------------------
```
ember install @lblod/ember-rdfa-editor-import-snippet-plugin
```

Usage
-------------------------------------------------------------------------------
This plugin contains two services.

## import-rdfa-snippet

The main entry point to fetch an external RDFA snippet, process it and store it.

### How to use it
```
import { inject as service } from '@ember/service';


// An entry point to download the resouce (e.g a route) in your host app.
// (...)

    let downloadData = { source: http://remote/resource.html }
    await this.importRdfaSnippet.downloadSnippet(downloadData);
```

The service has two public properties availible you can use in the host app, to e.g. notify the users or manage the snippets
```
  errors: A([]),
  snippets: A([])
```

## rdfa-editor-import-snippet-plugin
This is the main plugin service, to be used as other plugins. This will scan the document and see wether it can match snippets with resources in your document.

Contributing
------------------------------------------------------------------------------

See the [Contributing](CONTRIBUTING.md) guide for details.


License
------------------------------------------------------------------------------

This project is licensed under the [MIT License](LICENSE.md).
