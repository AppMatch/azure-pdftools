const should = require('should'),
      mutool = require('..'),
      path = require('path');

describe('#mutool', () => {

  it('should return title', (done) => {
    const filePath = path.join(__dirname, '/pdf/SundanceTermite.pdf');
    const Mutool = mutool({
      tempPath: 'D:/local/Temp'
    });

    Mutool.exec(`info ${filePath}`).then(meta => {
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
    const Mutool = mutool({
      tempPath: 'D:/local/Temp'
    });

    Mutool.exec(`draw -r ${resolution} -c gray -o ${outputFile} ${filePath} ${startPage}-${endPage}`).then(data => {
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
    const Mutool = mutool({
      tempPath: 'D:/local/Temp'
    });

    try {

      for (let page = 1; page <= pageCount; page++) { 
        let outputFile = `${__dirname}\\pdfs\\SundanceTermite-p${page}.pdf`;  
        work.push(Mutool.exec(`clean -l ${filePath} ${outputFile} ${page}`));
      }

      await Promise.all(work);

      return;
    } catch (error) {
      throw error;
    }
  });
});
