#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const dedent = require('dedent')
const { lint, linti18n } = require('.')
const args = require('minimist')(process.argv.slice(2))
const exists = require('path-exists').sync

var docsPath = args._[0] /*|| 'docs/api'*/
var version = args.version || process.env.npm_package_version
var outfile = args.outfile
var infile = args.infile

if (outfile && infile) usage('both arguments outfile and infile are incompatible')

// docsPath is required
if (!docsPath) usage('specify a pathname, .e.g ~/my/electron/electron')

// resolve docsPath as relative to current working directory
docsPath = path.resolve(process.cwd(), docsPath)

// resolve outfile as relative to current working directory
if (outfile) outfile = path.resolve(process.cwd(), outfile)

// version is required if writing to a file
if (outfile && !version) usage('`version` is required if `outfile` is specified')

// Use a placeholder version if not writing to a file
if (!version) version = '0.0.0'

const spinner = require('ora')('Parsing electron documentation').start()

if (!infile) {
  lint(docsPath, version).then(function (apis) {
    spinner.stop().clear()

    apis.forEach(api => console.error(api.report()))

    if (apis.some(api => !api.valid)) process.exit(1)

    if (outfile) {
      fs.writeFileSync(outfile, JSON.stringify(apis, null, 2))
      console.log(dedent`
      Created ${path.relative(process.cwd(), outfile)}
    `)
    } else {
      console.log(dedent`
      Docs are good to go!\n
      To write the docs schema to a file, specify \`version\` and \`outfile\`:\n
      electron-docs-linter ${path.relative(process.cwd(), docsPath)} --version=1.2.3 --outfile=electron.json
    `)
    }

    process.exit()
  }).catch(error => {
    console.error(error)
    process.exit(1)
  })
} else {
  if (!exists(infile)) {
    throw new TypeError(`\`infile\` must be an existing path on the filesystem. Got: ${infile}`)
  }

  var apis = JSON.parse(fs.readFileSync(infile, 'utf8'));

  linti18n(docsPath, apis).then(function (apis18n) {
    spinner.stop().clear()

    apis18n.forEach(api => console.error(api.report()))

    if (apis18n.some(api => !api.valid)) process.exit(1)

    process.exit()
  }).catch(error => {
    console.error(error)
    process.exit(1)
  })
}

function usage (reason) {
  if (reason) console.error(`Error: ${reason}`)

  console.error(dedent`
    Usage: electron-docs-linter <pathname>\n
    To save the parsed JSON schema:\n
    electron-docs-linter <pathname> --version=1.2.3 --outfile=electron.json\n
    To verify translated docs with an existing parsed JSON schema:\n
    electron-docs-linter <pathname> --version=1.2.3 --infile=electron.json\n`)
  process.exit(1)
}
