const marky = require('marky-markdown-lite')

class API18n {
    constructor(apidoc) {
        Object.assign(this, apidoc)
        this.parseDoc()
        this.name = this.parseName()
    }

    parseDoc() {
        this.$ = marky(this.doc.markdown_content)
    }

    parseName() {
        const h1 = this.$('h1').first().text()
        if (h1) return h1;
        return this.$('h2').first().text();
    }

    get collectionErrors () {
        // return cached errors if they were already computed
        if (this._collectionErrors) return this._collectionErrors;

        var errors = []
        
        var expectedName = this.api.name;
        if (this.api.name === 'webviewTag') {
            expectedName = 'webview';
        }
        if (this.name.indexOf(expectedName) == -1) {
            errors.push(`expected '${this.api.name}' Heading but found '${this.name}'`)
        }

        // cache the result to avoid excess computation
        this._collectionErrors = errors
        return errors
    }

    get valid () {
        return this.collectionErrors.length === 0
      }

    report () {
        if (this.valid) return `✓ ${this.api.name}`
    
        var errors = this.collectionErrors; // this.validationErrors.concat(this.collectionErrors)
        return `✘ ${this.api.name}\n${errors.map(e => `  - ${e}`)}`
      }

}

module.exports = API18n