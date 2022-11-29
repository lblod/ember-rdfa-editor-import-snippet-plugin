import { RdfaEditorPlugin } from '@lblod/ember-rdfa-editor';
export default class ImportSnippetPlugin extends RdfaEditorPlugin {
  widgets(){
    return [
      {
        componentName: 'import-snippet-card',
        desiredLocation: 'sidebar',
      }
    ]
  }
}