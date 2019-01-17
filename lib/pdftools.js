/**
 * Module Dependencies
 */

const spawn = require('child_process').spawn, 
      EventEmitter = require('events').EventEmitter, 
      pathModel = require('path');

/**
 * Expose `mutool`.
 */

module.exports = mutool;

/**
 * Initialize a new `mutool`.
 *
 * @param {String} path path to pdf
 * @param {Object} opts options for `mutool`
 * @return {mutool} for chaining...
 * @api public
 */

function mutool(opts, execOptions) {
  if (!(this instanceof mutool)) return new mutool(opts, execOptions);

  this._options = opts || [];
  this.errors = [];

  this._execPath = 'mutool';
  
  if (process.platform == 'win32' || process.platform == 'win64') 
    this._execPath = pathModel.join(__dirname, '../common/mutool', 'mutool');

  return this;
}

/**
 * Inherits `EventEmitter`.
 */

mutool.prototype.__proto__ = EventEmitter.prototype;

/**
 * Executes spawn process.
 *
 * @param {Function} next callback
 * @return {tools} for chaining...
 * @api private
 */

mutool.prototype.exec = function (next) {

  const self = this;
  const process = spawn(this._execPath, this._options);

  process.stdin.on('error', (error) => {
    console.error("on stdin error", error);
    next()
  });

  process.stdout.on('error', (error) => {
    console.error("on stdout error", error);
    next()
  });

  const _data = [];
  let totalBytes = 0;

  process.stdout.on('data', (data) => {
    console.log('process stdout data triggered', data);
    totalBytes += data.length;
    _data.push(data);
    self.emit('data', data.toString());
  });

  process.stderr.on('data', (data) => {
    console.error(`process stderr data:\n${data}`);
    self.errors.push(data);
  });

  process.on('error', (error) => {
    console.error('Process ERROR', error);
  });

  process.on('close', () => {

    const buf = Buffer.concat(_data, totalBytes);
    const data = buf.toString();

    if (self.errors.length > 0) {
      next.call(self, new Error(self.errors.join(",")));
    } else if (data) {
      next.call(self, null, parse(data));
    } else {
      next.call(self, null, {});
    }

    self.emit('close');
  });

  process.on('exit', () => {
    process.kill();
    self.emit('exit');
  });

  return this;
};

/**
 * Parses meta info.
 *
 * @param {String} str meta content
 * @return {Array} parsed pdf meta attributes
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
