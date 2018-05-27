const functions = require('firebase-functions');
const line = require('@line/bot-sdk');
const path = require('path');
const os = require('os');
const fs = require('fs');
const dl = require('datalib');
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
      .then((path) => saveMessageInfo(event, path))
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

function saveContent(imagePath) {
  return admin.storage().bucket().upload(imagePath).then(() => path.basename(imagePath));
}

function saveMessageInfo(info, image) {
  var savedInfo = {
    source: info.source,
    timestamp: info.timestamp,
    image: image,
  }
  return admin.database().ref('/messages').push(savedInfo);
}

exports.rank = functions.https.onRequest((request, response) => {
  Promise.resolve()
    .then(getUploadRank)
    .then((result) => response.json(result))
    .catch((err) => {
      console.error(err);
      response.status(500).end();
    });
});

function getUploadRank() {
  return admin.database().ref('/messages').once('value')
    .then((snapshot) => {
      var rank = calcRank(snapshot);
      return getLineUserInfo(rank);
    });
}

function calcRank(snapshot) {
  var val = snapshot.val();
  var data = Object.keys(val).map((key) => {
    return val[key];
  });

  var dlData = dl.read(data);
  var count = dl.groupby('source.userId').count().execute(dlData).sort(dl.comparator('-count'));
  var rank = count.map((data, index) => Object.assign({
    'rank': index + 1
  }, data));

  return rank;
}

function getLineUserInfo(data) {
  return Promise.all(data.map((d) => {
    return client.getProfile(d['source.userId'])
      .then((profile) => {
        var newData = Object.assign({'profile': profile}, d);
        delete newData['source.userId'];
        return newData;
      })
      .catch(Promise.reject);
  }));
}