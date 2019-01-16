const should = require('should');
const tools = require('..');

describe('#tools', function(){

  it('should return title', function(done){
    const pdf = tools(__dirname + '/pdf/SundanceTermite.pdf', ['info']);

    pdf.exec(function(err, meta) {
      if (err) return done(err);

      meta.pages.should.equal(9);
      done();
    });
  });
});
