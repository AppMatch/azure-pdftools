
const fs = require('fs');
const tools = require('..');

describe('#tools', function(){

  it('should return title', function(done){
    const pdf = tools(__dirname + '/pdf/basic.pdf');

    pdf.exec(function(err, meta){
      if (err) return done(err);
      meta.title.should.equal('basic');
      done();
    })
  })

  it('should return pages', function(done){
    const pdf = tools(__dirname + '/pdf/pages.pdf');

    pdf.exec(function(err, meta){
      if (err) return done(err);
      meta.pages.should.equal(6);
      done();
    })
  })

  it('should return tagged', function(done){
    const pdf = tools(__dirname + '/pdf/pages.pdf');

    pdf.exec(function(err, meta){
      if (err) return done(err);
      meta.tagged.should.equal(false);
      done();
    })
  })

  it('should throw error when a file is not a tools', function(done){
    const pdf = tools(__dirname + '/pdf/dummy.txt');

    pdf.exec(function(err, meta){
      err.should.be.instanceof(Error);
      done();
    })
  })

  it('should not crash when a file is not a tools', function(done){
    const pdf = tools(__dirname + '/pdf/dummy.txt');

    pdf.errors = false;
    pdf.exec(function(err, meta){
      if (err) return done(err);
      meta.should.be.a.Object;
      done();
    })
  })

  it('should return title from stream', function(done){
    const stream = fs.createReadStream(__dirname + '/pdf/basic.pdf');
    const pdf = tools(stream);

    pdf.exec(function(err, meta){
      if (err) return done(err);
      meta.title.should.equal('basic');
      done();
    })
  })

})
