/**
 * Module Dependencies
 */

const exec = require('child_process').exec,
      EventEmitter = require('events').EventEmitter, 
      path = require('path'),
      fs = require('fs');

/**
 * Expose `mutool`.
 */

module.exports = mutool;

/**
 * Initialize a new `mutool`.
 *
 * @param {Object} opts options for `mutool`
 * @return {mutool} for chaining...
 * @api public
 */

function mutool(opts) {
  if (!(this instanceof mutool)) return new mutool(opts);

  this.errors = [];

  if (process.platform == 'win32' || process.platform == 'win64') {  
    const execPath = path.join(__dirname, '../common/mutool', 'mutool');

    let tempPath;

    if (opts && opts.tempPath) {
      tempPath = opts.tempPath + '/mutool';

      if (!fs.existsSync(tempPath))
        fs.copySync(execPath, tempPath);
    }

    this._execPath = tempPath || execPath;
  } else 
    throw new Error("Unsupported platform.");

  return this;
}

/**
 * Inherits `EventEmitter`.
 */

mutool.prototype.__proto__ = EventEmitter.prototype;

/**
 * Executes spawn process.
 *
 * @return {Promise}
 */

mutool.prototype.exec = function (command) {

  if (!command)
    throw new Error('Missing command');

  const _command = this._execPath + ' ' + command;

  return new Promise((resolve, reject) => {
    exec(_command, function (err, stdout, stderr) {
      let out = null;

      if (err) {
        reject(err);
        return;
      }

      if (stderr && stderr.includes('error:')) {
        reject(new Error(stderr));
        return
      } else if (stderr) {
        out = stderr;
      } else if (stdout) {
        out = parse(stdout);
      }

      resolve(out);
      return;
    });
  });
};

/**
 * Parses meta info.
 *
 * @param {String} str pdf info content
 * @return {Object} parsed pdf info attributes
 * @api private
 */

function parse(str) {

  if (!str) return;

  const meta = {};
  const lines = str.split(/\n/g);

  for (let i in lines) {
    const _attr = lines[i].split(/:\s+/);
    let key = _attr[0];
    let val = _attr[1];

    if (key && val) {
      key = formatKey(key, val);
      val = formatValue(key, val);

      if (key && val)
        meta[key] = val;
    }
  }

  return meta;
}

/**
 * Converts parsed attribute key into something readable
 * 
 * @param {String} key attribute name
 * @param {String} val attribute value
 * @return {String} Readable key 
 */

function formatKey(key, value) {
  let formatted = key.toLowerCase().replace(/\s/g, '');

  value = value.trim()

  switch(formatted) {
    case '1(10r)': 
        const firstChar = value.slice(0, 1);
        const lastChar = value.slice(-1);

        if (firstChar === '[' && lastChar === ']') 
          formatted = 'dimensions';

      break;
  }

  return formatted;
}

/**
 * Converts parsed attribute value into something readable
 * 
 * @param {String} key attribute name
 * @param {String} val attribute value
 * @return {String} Readable value 
 */

function formatValue(key, value) {
  let formatted = null;

  switch(key) {
    case 'dimensions':
        formatted = value.replace(/\r/g, '');
        const dimensions = formatted.slice(1, formatted.length - 1).trim();
        formatted = dimensions.split(' ');
      break;
    case 'pages':
        formatted = value.replace(/\r/g, '');
        formatted = parseInt(formatted);
      break;
  }

  return formatted;
}
