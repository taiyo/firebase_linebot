const functions = require('firebase-functions');
const line = require('@line/bot-sdk');
const path = require('path');
const os = require('os');
const fs = require('fs');
const cloudinary = require('cloudinary');

const admin = require('firebase-admin');
admin.initializeApp();

// create LINE SDK config from env variables
const config = {
  channelAccessToken: functions.config().line.channel_access_token,
  channelSecret: functions.config().line.channel_secret,
};

// create LINE SDK client
const client = new line.Client(config);

cloudinary.config({
  cloud_name: functions.config().cloudinary.cloud_name,
  api_key: functions.config().cloudinary.api_key,
  api_secret: functions.config().cloudinary.api_secret
});

exports.line = functions.https.onRequest((request, response) => {
  Promise
    .all(request.body.events.map(handleEvent))
    .then((result) => response.json(result))
    .catch((err) => {
      console.error(err);
      response.status(500).end();
    });
});

function handleEvent(event) {
  console.log(JSON.stringify(event));
  if (event.type !== 'message') {
    // ignore non-text-message event
    return Promise.resolve(null);
  }

  if (event.message.type === 'text') {
    const echo = { type: 'text', text: event.message.text };
    return client.replyMessage(event.replyToken, echo);
  } else if (event.message.type === 'image') {
    return downloadContent(event.message.id)
      .then(saveContent)
      .then(client.replyMessage(event.replyToken, { type: 'text', text: '画像アップロードしたよ' }))
  } else {
    return Promise.resolve(null);
  }
}

function downloadContent(messageId) {
  const tmpPath = path.join(os.tmpdir(), messageId + '.jpg');
  return client.getMessageContent(messageId)
    .then((stream) => new Promise((resolve, reject) => {
      const writable = fs.createWriteStream(tmpPath);
      stream.pipe(writable);
      stream.on('end', () => {
        resolve(tmpPath);
      });
      stream.on('error', reject);
    }));
}

function saveContent(path) {
  return admin.storage().bucket().upload(path);
}

// function downloadContent(messageId) {
//   console.log(messageId);
//   var data = [];
//   return client.getMessageContent(messageId)
//     .then((stream) => new Promise((resolve, reject) => {
//       stream.on('data', (chunk) => data.push(new Buffer(chunk)));
//       stream.on('end', () => {
//         console.log(data.length);
//         resolve(Buffer.concat(data));
//       });
//       stream.on('error', (err)=> {
//         console.log(err);
//         reject(err);
//       });
//     }))
//     .catch((err) => {
//       console.log(err);
//       reject(err);
//     });
// }

// Take the text parameter passed to this HTTP endpoint and insert it into the
// Realtime Database under the path /messages/:pushId/original
exports.addMessage = functions.https.onRequest((req, res) => {
  // Grab the text parameter.
  const original = req.query.text;
  // Push the new message into the Realtime Database using the Firebase Admin SDK.
  return admin.database().ref('/messages').push({original: original}).then((snapshot) => {
    // Redirect with 303 SEE OTHER to the URL of the pushed object in the Firebase console.
    return res.redirect(303, snapshot.ref.toString());
  });
});