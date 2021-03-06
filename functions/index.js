const functions = require('firebase-functions');
const cors = require('cors')({origin: true});
const line = require('@line/bot-sdk');
const path = require('path');
const os = require('os');
const fs = require('fs');
const dl = require('datalib');
const cloudinary = require('cloudinary');

// Firebase
const admin = require('firebase-admin');
admin.initializeApp();

// LINE
const config = {
  channelAccessToken: functions.config().line.channel_access_token,
  channelSecret: functions.config().line.channel_secret,
};
const client = new line.Client(config);

// cloudinary
cloudinary.config({
  cloud_name: functions.config().cloudinary.cloud_name,
  api_key: functions.config().cloudinary.api_key,
  api_secret: functions.config().cloudinary.api_secret
});

/** Lineからのwebhookを処理して画像を保存する */
exports.line = functions.https.onRequest((request, response) => {
  Promise
    .all(request.body.events.map(handleEvent))
    .then((result) => response.json(result))
    .catch((err) => {
      console.error(err);
      response.status(500).end();
    });
});

/**
 * LineからのWebhookを処理する。
 * 
 * @param {any} event 
 * @returns 
 */
function handleEvent(event) {
  console.log(JSON.stringify(event));
  if (event.type !== 'message') {
    // ignore non-text-message event
    return Promise.resolve(null);
  }

  var messageType = event.message.type;
  if (messageType === 'text') {
    const echo = { type: 'text', text: event.message.text };
    return saveTextMessage(event)
      .then(client.replyMessage(event.replyToken, { type: 'text', text: functions.config().line.text_reply_message }))
  } else if (messageType === 'image' || messageType === 'video') {
    return downloadContent(event.message.id, messageType)
      .then((path) => saveContent(path, messageType))
      .then((path) => saveMessageInfo(event, path))
      .then(client.replyMessage(event.replyToken, { type: 'text', text: functions.config().line.uploaded_message }))
  } else {
    return Promise.resolve(null);
  }
}

/**
 * テキストメッセージを保存する
 * 
 * @param {*} event 
 */
function saveTextMessage(event) {
  var info = {
    source: event.source,
    timestamp: event.timestamp,
    message: event.message,
  }
  return admin.database().ref('/texts').push(info);
}

/**
 * Lineに投稿されたコンテンツを取得する
 * 
 * @param {any} messageId 
 * @returns 
 */
function downloadContent(messageId, type) {
  var ext = type === 'image' ? '.jpg' : '.mp4';
  const tmpPath = path.join(os.tmpdir(), messageId + ext);
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

/**
 * Storageにファイルを保存する。
 * 
 * @param {any} imagePath 
 * @returns 
 */
function saveContent(imagePath, type) {
  return new Promise((resolve, reject) => {
    if (type === 'image') {
      cloudinary.v2.uploader.upload(imagePath, (err, result) => {
        if (err) return reject(err);
        resolve(result);
      });
    } else {
      cloudinary.v2.uploader.upload(imagePath, { resource_type: "video" }, (err, result) => {
        if (err) return reject(err);
        resolve(result);
      });
    }
  })
  .then((cloudinary) => admin.database().ref('/cloudinary').push(cloudinary))
  .then(admin.storage().bucket().upload(imagePath))
  .then(() => path.basename(imagePath));
}

/**
 * メッセージの情報（投稿者、時間、画像）を保存する。
 * 
 * @param {any} info 
 * @param {any} image 
 * @returns 
 */
function saveMessageInfo(info, image) {
  var savedInfo = {
    source: info.source,
    timestamp: info.timestamp,
    image: image,
  }
  return admin.database().ref('/messages').push(savedInfo);
}

/** 投稿のランキングを集計し、結果を返す。 */
exports.rank = functions.https.onRequest((request, response) => {
  cors(request, response, () => {
    Promise.resolve()
      .then(getUploadRank)
      .then((result) => response.json(result))
      .catch((err) => {
        console.error(err);
        response.status(500).end();
      });
  });
});

/**
 * 投稿のランキングを取得する。
 * 
 * @returns 
 */
function getUploadRank() {
  return admin.database().ref('/messages').once('value')
    .then((snapshot) => {
      var rank = calcRank(snapshot);
      return appendLineUserInfo(rank);
    });
}

/**
 * ユーザIDをキーにしてカウント集計し、ランキングを計算する。
 * 
 * @param {any} snapshot 
 * @returns 
 */
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

/**
 * ユーザIDからLineのプロファイル情報を取得し付与する。
 * 
 * @param {any} data 
 * @returns 
 */
function appendLineUserInfo(data) {
  console.log(data);
  return Promise.all(data.map((d) => {
    console.log(d['source.userId']);
    
    return client.getProfile(d['source.userId'])
      .then((profile) => {
        console.log(profile);
        
        var newData = Object.assign({'profile': profile}, d);
        delete newData['source.userId'];
        return newData;
      })
      .catch(Promise.reject);
  }));
}

/** 投稿情報のリストを返す */
exports.list = functions.https.onRequest((request, response) => {
  cors(request, response, () => {
    Promise.resolve()
      .then(getUploadedList)
      .then((result) => response.json(result))
      .catch((err) => {
        console.error(err);
        response.status(500).end();
      });
  });
});

function getUploadedList() {
  return admin.database().ref('/messages').once('value')
    .then((snapshot) => {
      console.log(snapshot);
      var val = snapshot.val();
      var data = Object.keys(val).map((key) => {
        return val[key];
      });
      return appendLineUserInfo2(data);
    });
}

function appendLineUserInfo2(data) {
  console.log(data);
  return Promise.all(data.map((d) => {
    console.log(d.source.userId);
    
    return client.getProfile(d.source.userId)
      .then((profile) => {
        console.log(profile);
        
        var newData = Object.assign({'profile': profile}, d);
        delete newData.source.userId;
        return newData;
      })
      .catch(Promise.reject);
  }));
}
