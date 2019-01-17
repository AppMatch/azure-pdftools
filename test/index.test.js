const should = require('should');
const mutool = require('..');

describe('#mutool', () => {

  it('should return title', (done) => {
    const filePath = `${__dirname}/pdf/SundanceTermite.pdf`;
    const Mutool = mutool(['info', filePath]);

    Mutool.exec((err, meta) => {
      if (err) return done(err);

      meta.pages.should.equal(9);
      done();
    });
  });

  it('should generate an png for given page', (done) => {

    const startPage = 1;
    const endPage = 1;
    const filePath = `${__dirname}\\pdf\\SundanceTermite.pdf`;
    const outputFile = `${__dirname}\\png\\x-p${startPage}--%d.png`;
    const resolution = 288;

    const Mutool = mutool(['draw', `-s -r ${resolution} -c gray -o ${outputFile}`, filePath, `${startPage}-${endPage}`]);

    Mutool.exec((err) => {
      if (err) return done(err);

      done();
    });
  })
});
