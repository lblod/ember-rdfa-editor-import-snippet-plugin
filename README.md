@lblod/ember-rdfa-editor-import-snippet-plugin
==============================================================================
Plugin allowing importing of external RDFA snippets and inserting it in the document.

Compatibility
-------------------------------------------------------------------------------

* Ember.js v3.16 or above
* Ember CLI v2.13 or above
* Node.js v10 or above

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

### How to trigger it on GN

This is just an example for developers on how to trigger this plugin and check if the changes made to the package work.
1 - First go to this url: https://dev.kleinbord.lblod.info/select-road-sign
2 - Fill the form and press the button
3 - GN will open and you have to go to a new or existing meeting, and edit a behandeling.
4 - Then you have 2 different options: the first one is to click on the template button and select directly the "document invoegen" in order to insert the data into the document. The second one is to insert a besluit and insert the data as an attachment,for this you will need to insert a besluit template and click on the button "Bijlage invoegen"

## rdfa-editor-import-snippet-plugin
This is the main plugin service, to be used as other plugins. This will scan the document and see whether it can match snippets with resources in your document.

Contributing
------------------------------------------------------------------------------

See the [Contributing](CONTRIBUTING.md) guide for details.


License
------------------------------------------------------------------------------

This project is licensed under the [MIT License](LICENSE.md).
