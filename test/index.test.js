const should = require('should');
const mutool = require('..');

describe('#mutool', () => {

  it('should return title', (done) => {
    const filePath = `${__dirname}/pdf/SundanceTermite.pdf`;
    const command = mutool(`info ${filePath}`);

    command.exec().then(meta => {
      meta.pages.should.equal(9);
      done();
    }).catch(err => {
      done(err);
    });
  });

  it('should generate a png image for given page', (done) => {

    const startPage = 1;
    const endPage = 1;
    const filePath = `${__dirname}\\pdf\\cupertino_usd.pdf`;
    const outputFile = `${__dirname}\\png\\cupertino_usd-p${startPage}--%d.png`;
    const resolution = 288;

    const command = mutool(`draw -r ${resolution} -c gray -o ${outputFile} ${filePath} ${startPage}-${endPage}`);

    command.exec().then(data => {
      done();
    }).catch(err => {
      console.error(err);
      done(err);
    });
  });

  it('should split the given pdf into multiple (per page) pdfs', async () => {

    const pageCount = 7;
    const filePath = `${__dirname}\\pdf\\SundanceTermite.pdf`;
    const work = [];

    try {

      for (let page = 1; page <= pageCount; page++) { 
        let outputFile = `${__dirname}\\pdfs\\SundanceTermite-p${page}.pdf`;
        let command = mutool(`clean -l ${filePath} ${outputFile} ${page}`);
  
        work.push(command.exec());
      }

      await Promise.all(work);

      return;
    } catch (error) {
      throw error;
    }
  });
});
