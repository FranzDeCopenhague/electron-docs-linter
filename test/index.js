const path = require('path')
const expect = require('chai').expect
const lint = require('..')
const they = it

var apis

describe('apis', function () {
  this.timeout(10 * 1000)

  before(function (done) {
    var docPath = path.join(__dirname, '../vendor/electron/docs/api')
    lint(docPath, '1.2.3')
      .then(function (_apis) {
        apis = _apis
        done()
      })
      .catch(function (err) {
        console.error(err)
      })
  })

  it('exports a linting function', function () {
    expect(lint).to.be.a('function')
  })

  it('returns an array of api objects', function () {
    expect(apis).to.be.an('array')
    expect(apis.length).to.be.at.least(30)
    expect(apis.every(api => typeof api === 'object'))
    expect(apis.every(api => api.constructor.name === 'API'))
  })

  it('adds basic properties to each object', function () {
    expect(apis.every(api => api.name.length > 0)).to.be.true
    expect(apis.every(api => api.slug.length > 0)).to.be.true
    expect(apis.every(api => api.type.length > 0)).to.be.true
    expect(apis.every(api => api.version.length > 0)).to.be.true

    var win = apis.BrowserWindow
    expect(win.name).to.eq('BrowserWindow')
    expect(win.slug).to.eq('browser-window')
    expect(win.type).to.eq('Class')
  })

  it('validates every API against a JSON schema', function () {
    apis.forEach(api => {
      if (!api.valid) {
        console.error(`\n\nError in ${api.name} API`)
        console.error(api.validationErrors)
      }
    })
    expect(apis.every(api => api.valid)).to.be.true
  })

  describe('process', function () {
    it('is an object with `main` and `renderer` keys', function () {
      expect(apis.Tray.process.main).to.equal(true)
      expect(apis.Tray.process.renderer).to.equal(false)
    })
  })

  describe('Classes', function () {
    it('sets class type on all the clases', function () {
      expect(apis.Session.type).to.eq('Class')
      expect(apis.Cookies.type).to.eq('Class')
      expect(apis.WebRequest.type).to.eq('Class')
    })
  })

  describe('Methods', function () {
    they('have basic properties', function () {
      var method = apis.app.methods.exit
      expect(method.name).to.eq('exit')
      expect(method.signature).to.eq('(exitCode)')
      expect(method.parameters[0].name).to.equal('exitCode')
      expect(method.parameters[0].type).to.equal('Integer')
    })

    they('sometimes have a platform array', function () {
      expect(apis.app.methods.hide.platforms[0]).to.eq('macOS')
    })

    they('always have documented parameters', function () {
      var assertions = 0
      apis.forEach(api => {
        (api.methods || []).forEach(method => {
          if (method.signatureParameters.length) {
            expect(method.signatureParameters).to.deep.equal(
              method.parameters.map(arg => arg.name),
              `${api.name}.${method.name}${method.signature} is missing parameter docs`
            )
            assertions++
          }
        })
      })
      expect(assertions).to.be.above(80)
    })
  })

  describe('Parameters', function () {
    it('preserves code backticks in descriptions and converts HTML to text', function () {
      var callback = apis.WebContents.instanceMethods.savePage.parameters.callback
      expect(callback.description).to.equal('`(error) => {}`.')
    })

    it('detects when parameters are required', function () {
      expect(apis.BrowserWindow.instanceMethods.setSize.parameters.animate.required).to.eq(false)
    })

    they('do not have a `required` key if they are for an event', function () {
      var keys = Object.keys(apis.app.events.activate.returns.hasVisibleWindows)
      expect(keys).to.include('name')
      expect(keys).to.include('type')
      expect(keys).to.not.include('required')
    })

    they('can have ENUM values', function () {
      var values = apis.WebContents.instanceMethods.savePage.parameters.saveType.possibleValues
      expect(values.length).to.equal(3)
      expect(values[0].value).to.equal('HTMLOnly')
      expect(values[0].description).to.equal('Save only the HTML of the page.')
      expect(values[2].value).to.equal('MHTML')
      expect(values[2].description).to.equal('Save complete-html page as MHTML.')

      values = apis.powerSaveBlocker.methods.start.parameters.type.possibleValues
      expect(values[0].value).to.equal('prevent-app-suspension')
      expect(values[1].value).to.equal('prevent-display-sleep')
    })
  })

  describe('Static Methods', function () {
    they('have basic properties', function () {
      var method = apis.BrowserWindow.staticMethods.getAllWindows
      expect(method.name).to.eq('getAllWindows')
      expect(method.signature).to.eq('()')
      expect(method.description).to.eq('Returns an array of all opened browser windows.')
    })

    they('always have documented parameters', function () {
      var assertions = 0
      apis.forEach(api => {
        (api.staticMethods || []).forEach(method => {
          if (method.signatureParameters.length) {
            expect(method.signatureParameters).to.deep.equal(
              method.parameters.map(param => param.name),
              `${api.name}.${method.name}${method.signature} is missing parameter docs`
            )
            assertions++
          }
        })
      })
      expect(assertions).to.be.above(5)
    })
  })

  describe('Instance Methods', function () {
    they('have basic properties', function () {
      var method = apis.BrowserWindow.instanceMethods.setContentSize
      expect(method.name).to.eq('setContentSize')
      expect(method.signature).to.eq('(width, height[, animate])')
      expect(method.description).to.include('Resizes the window')
    })

    they('are defined for classes that are among many in a module', function () {
      expect(apis.WebRequest.instanceMethods.onBeforeRequest.signature).to.eq('([filter, ]listener)')
    })

    they('are defined for classes that are unique to a module', function () {
      expect(apis.NativeImage.instanceMethods.toJPEG.signature).to.eq('(quality)')
    })

    they('can have a platform array', function () {
      expect(apis.BrowserWindow.instanceMethods.setAspectRatio.platforms[0]).to.eq('macOS')
    })

    they('always have documented parameters', function () {
      var assertions = 0
      apis.forEach(api => {
        (api.instanceMethods || []).forEach(method => {
          if (method.signatureParameters.length) {
            expect(method.signatureParameters).to.deep.equal(
              method.parameters.map(arg => arg.name),
              `${api.name}.${method.name}${method.signature} is missing parameter docs`
            )
            assertions++
          }
        })
      })
      expect(assertions).to.be.above(80)
    })
  })

  describe('Instance Properties', function () {
    they('are present on every class that should have them, with name and description', function () {
      var apisWithInstanceProperties = [
        'BrowserWindow',
        'MenuItem',
        'Menu',
        'Session',
        'WebContents'
      ]

      apisWithInstanceProperties.forEach(api => {
        var props = apis[api].instanceProperties
        expect(props).to.not.be.empty
        expect(props.every(prop => prop.name.length > 0)).to.be.true
        expect(props.every(prop => prop.description.length > 0)).to.be.true
      })
    })

    they('have properly parsed name and description', function () {
      var props = apis.BrowserWindow.instanceProperties
      expect(props.length).to.equal(2)
      expect(props[0].name).to.equal('webContents')
      expect(props[0].description).to.include('object this window owns')
      expect(props[1].name).to.equal('id')
      expect(props[1].description).to.equal('The unique ID of the window.')
    })
  })

  describe('Events', function () {
    it('is an array of event objects', function () {
      expect(apis.app.events.length).to.be.above(10)
      expect(apis.app.events.every(event => event.name.length > 0)).to.be.true
    })

    they('have a name, description, and type', function () {
      var event = apis.app.events.quit
      expect(event.description).to.eq('Emitted when the application is quitting.')
      expect(event.returns[0].name).to.eq('event')
      expect(event.returns[0].type).to.eq('Event')
    })

    they('sometimes have a platforms array', function () {
      var event = apis.app.events['open-file']
      expect(event.platforms[0]).to.eq('macOS')
    })

    they('sometimes have return values that are complex objects', function () {
      var event = apis.app.events['certificate-error']
      var properties = event.returns[4].properties
      expect(properties.length).to.be.above(5)
      expect(properties[0].name).to.eq('data')
      expect(properties[0].type).to.eq('Buffer')
      expect(properties[0].description).to.eq('PEM encoded data')
    })
  })

  describe('JSON serialization/stringification', function () {
    it('preserves desired properties and omits the unwanted ones', function () {
      var app = JSON.parse(JSON.stringify(apis.app))

      // common to all APIs
      expect(app.name).to.exist
      expect(app.description).to.exist
      expect(app.type).to.exist
      expect(app.slug).to.exist
      expect(app.websiteUrl).to.exist
      expect(app.repoUrl).to.exist

      // unwanted
      expect(app.errors).to.not.exist
      expect(app.docs).to.not.exist

      // events
      var _process = JSON.parse(JSON.stringify(apis.process))
      expect(_process.events).to.exist

      // instanceEvents
      var Tray = JSON.parse(JSON.stringify(apis.Tray))
      expect(Tray.instanceEvents).to.exist

      // methods
      var remote = JSON.parse(JSON.stringify(apis.remote))
      expect(remote.methods).to.exist

      // instanceMethods
      var win = JSON.parse(JSON.stringify(apis.BrowserWindow))
      expect(win.instanceMethods).to.exist
    })
  })

  describe('Convenience URLs', function () {
    it('sets a websiteUrl', function () {
      var url = 'http://electron.atom.io/docs/api/tray'
      expect(apis.Tray.websiteUrl).to.equal(url)
    })

    it('sets a repoUrl', function () {
      var url = 'https://github.com/electron/electron/blob/v1.2.3/docs/api/tray.md'
      expect(apis.Tray.repoUrl).to.equal(url)
    })
  })
})
