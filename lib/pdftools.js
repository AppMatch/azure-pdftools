/**
 * Module Dependencies
 */

const spawn = require('child_process').spawn
  , EventEmitter = require('events').EventEmitter
  , stream = require('stream')
  , pathModel = require('path');

/**
 * Expose `mutool`.
 */

module.exports = tools;

/**
 * Initialize a new `mutook`.
 *
 * @param {String} path path to pdf
 * @param {Object} opts options for `mutool`
 * @return {mutool} for chaining...
 * @api public
 */

function tools(path, opts, execOptions) {
  if (!(this instanceof mutool)) return new tools(path, opts, execOptions);

  if (path instanceof stream) {
    // handle streams
    this._input = "-";
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
//console.log(this.before_exec+this._execPath, this._options.concat([this._input]));
tools.prototype.exec = function (next) {

  const self = this;

  if (!this._input) return next.call(self, new Error('No input specified'));

  const process = spawn(this._execPath, this._options.concat([this._input]));

  process.stdin.on('error', next);
  process.stdout.on('error', next);

  const _data = [];
  const totalBytes = 0;

  if (this._input === "-") {
    // we're handling streams
    this._stream.pipe(process.stdin);
  }

  process.stdout.on('data', function (data) {
    totalBytes += data.length;
    _data.push(data);
    self.emit('data', data.toString());
  })

  process.on('close', function () {
    const buf = Buffer.concat(_data, totalBytes);
    const data = buf.toString();

    if (data) {
      next.call(self, null, map(data));
    } else if (self.errors) {
      next.call(self, new Error('File is not a PDF'));
    } else {
      next.call(self, null, {});
    }

    self.emit('close');
  })

  process.on('exit', function () {
    process.kill();
    self.emit('exit');
  })

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

tools.prototype.getPageCount = function (onComplete) {
  this.info((err, meta) => {
    if (err) return onComplete(err);
    if (meta && meta.pages) {
      return onComplete(err, meta.pages);
    }
    onComplete(new Error('Can not get page length'));
  });
}

/**
 * Parses meta info.
 *
 * @param {String} str meta content
 * @return {Array} parsed pdf meta attributes
 * @api private
 */

function parse(str) {

  if (!str) return;

  var meta = [];
  var lines = str.split(/\n/g);

  for (var i in lines) {
    var _attr = lines[i].split(/:\s+/);
    var key = _attr[0];
    var val = _attr[1];
    if (key && val) {
      key = key.toLowerCase().replace(/\s/g, '_');
      var attr = pretty(key, val);
      meta.push(attr);
    }
  }

  return meta;
}

/**
 * Maps parsed meta array to object.
 *
 * @param {Array} results parsed meta results
 * @return {Object} parsed meta attributes as object
 * @api private
 */

function map(results) {

  var meta = {};

  if (results) {
    for (var i in results) {
      var attr = results[i];
      meta[attr.k] = attr.v;
    }
  }
  return meta;
}

/**
 * Converts parsed attribute into something pretty.
 *
 * @param {String} key meta attribue name
 * @param {String} val meta attribute value
 * @return {Object} converted meta attribute value
 * @api private
 */

function pretty(key, val) {

  var type = {};

  // rename attributes
  switch (key) {
    case 'creationdate':
      type.k = 'created';
      break;
    case 'moddate':
      type.k = 'modified';
      break;
    default:
      type.k = key;
  }

  // Convert 'no' = false / 'none' = null
  type.v = val === 'no' ? false : (val === 'none' ? null : val);

  // Convert string to number
  if (typeof type.v === 'string' && !isNaN(Number(type.v))) {
    type.v = Number(type.v);
  }

  return type;
}