var https       = require('https');
var nodemailer  = require('nodemailer');
var config      = require('./config');

console.log(new Date().toUTCString() + ': Starting');
https.get('https://ws.ovh.com/dedicated/r2/ws.dispatcher/getAvailability2',
    (response) => {
      var buffer = '';

      response.on('data', (data) => {
        buffer += data;
      });

      response.on('end', () => {
        console.log(new Date().toUTCString() + ': Fetched JSON');
        json = JSON.parse(buffer);

        json.answer.availability.forEach((elem) => {
          config.tracking.references.forEach((ref) => {
            if (elem.reference.toLowerCase() !== ref.toLowerCase())
              return;

            elem.metaZones.forEach((mz) => {
              config.tracking.regions.forEach((region) => {
                if (mz.zone.toLowerCase() !== region.toLowerCase()
                    || mz.availability === 'unavailable')
                  return;

                console.log(new Date().toUTCString() + 'Found ' + elem.reference);
                sendMail(elem);
              });
            });
          });
        });
      });
});

function sendMail(elem) {
  var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: config.mail.from,
      pass: config.mail.password
    }
  });

  var options = {
    from: '"' + config.mail.senderName + '" <' + config.mail.from + '>',
    to: config.mail.to,
    subject: config.mail.subject.replace('{ref}', elem.reference),
    html: '<a href="' + config.mail.link + '">'
      + config.mail.link + '</a><br /><br />'
  };

  transporter.sendMail(options, (error, info) => {
    if (error)
      return console.error(error);

    console.log(new Date().toUTCString() + 'Main sent!');
    console.log('Mail sent!');
  });
}
