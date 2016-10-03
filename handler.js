'use strict';

const aws = require('aws-sdk'),
  s3 = new aws.S3({ apiVersion: '2006-03-01' }),
  md5 = require('md5'),
  svg2png = require("svg2png"),
  env = require('./env.js'),
  hash = md5(new Date().getTime()),
  imageKey = `${hash}.png`,
  phantomjsCmd = './phantomjs';

module.exports.convert = (event, context) => {
  const params = event.body;

  if (params === undefined) {
    return context.done(null,{
      status: 'error',
      msg: 'you should check params.',
      your_params: event,
      sample_params: {
        "body": {
          svgString: 'xxx',
        }
      }
    });
  }

  const svgString = decodeURIComponent(params.svgString);
  const sourceBuffer = new Buffer(svgString);
  const options = params.local ? {} : { phantomjsPath: phantomjsCmd };

  svg2png(sourceBuffer, options)
    .then(buffer => {
      s3.putObject(
        {
          'Bucket': env.BUKKET,
          'ACL': 'public-read',
          'Key': imageKey,
          'ContentType': 'image/png',
          'Body': buffer
        },
        function (error) {
          if(error === null) {
            return context.done(null,{
              status: 'success',
              msg: `https://s3-${env.REGION}.amazonaws.com/${env.BUKKET}/${imageKey}`,
            });
          } else {
            return context.done(null, {
              status: 'error',
              msg: error
            });
          }
        }
      );
    })
    .catch(e => {
      return context.done(null, {
        status: 'error',
        msg: e
      });
    });
};
