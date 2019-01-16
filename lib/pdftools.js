/**
 * Module Dependencies
 */

const spawn = require('child_process').spawn, 
      EventEmitter = require('events').EventEmitter, 
      stream = require('stream'), 
      pathModel = require('path');

/**
 * Expose `mutool`.
 */

module.exports = tools;

/**
 * Initialize a new `mutool`.
 *
 * @param {String} path path to pdf
 * @param {Object} opts options for `mutool`
 * @return {mutool} for chaining...
 * @api public
 */

function tools(path, opts, execOptions) {
  if (!(this instanceof tools)) return new tools(path, opts, execOptions);

  if (path instanceof stream) {
    // handle streams
    this._input = '-';
    this._stream = path;
  } else {
    this._input = path;
  }

  this._options = opts || [];
  this.errors = true;

  this._execPath = 'mutool';
  
  if (process.platform == 'win32' || process.platform == 'win64') {
    if (process.arch == 'x64') {
      this._execPath = pathModel.join(__dirname, '../common/mutool', 'mutool');
    } else {
      this._execPath = pathModel.join(__dirname, '../common/mutool', 'mutool');
    }
  }

  return this;
}

/**
 * Inherits `EventEmitter`.
 */

tools.prototype.__proto__ = EventEmitter.prototype;

/**
 * Executes spawn process.
 *
 * @param {Function} next callback
 * @return {tools} for chaining...
 * @api private
 */

tools.prototype.exec = function (next) {

  const self = this;

  if (!this._input) return next.call(self, new Error('No input specified'));

  const process = spawn(this._execPath, this._options.concat([this._input]));

  process.stdin.on('error', next);
  process.stdout.on('error', next);

  const _data = [];
  let totalBytes = 0;

  if (this._input === '-') {
    // we're handling streams
    this._stream.pipe(process.stdin);
  }

  process.stdout.on('data', (data) => {
    //console.log('process stdout data triggered', data);
    totalBytes += data.length;
    _data.push(data);
    self.emit('data', data.toString());
  });

  process.stderr.on('data', (data) => {
    console.error(`process stderr data:\n${data}`);
  });

  process.on('close', () => {
    
    const buf = Buffer.concat(_data, totalBytes);
    const data = buf.toString();

    if (data) {
      next.call(self, null, parse(data));
    } else if (self.errors) {
      next.call(self, new Error('File is not a PDF'));
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
 * Alias for `#exec()`
 *
 * @param {Function} next callback
 * @return {mutool} for chaining...
 * @api public
 */

tools.prototype.mutool = tools.prototype.exec;

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
