<template>
  <div>
    <vue-picture-swipe :items="images"></vue-picture-swipe>
    <img v-bind:src="images.length > 0 ? images[images.length - 1].src : ''" id="animation-image" style="opacity: 0;">
  </div>
</template>

<script>
import Vue from 'vue'
import VueFire from 'vuefire'
import firebase from 'firebase'
import VuePictureSwipe from 'vue-picture-swipe';
import { setTimeout } from 'timers';

Vue.use(VueFire)

Vue.component('vue-picture-swipe', VuePictureSwipe);

// var firebaseApp = firebase.initializeApp({})
var firebaseApp = firebase.initializeApp({
  apiKey: process.env.FIREBASE_API_KEY,
  databaseURL: process.env.FIREBASE_DATABASE_URL
})

export default {

  firebase: {
    cloudinary: firebaseApp.database().ref('/cloudinary').orderByChild('created_at')
  },

  data: function () {
    return {
      isLoading: false,
      isInit: false
    }
  },

  computed: {
    images () {
      return this.cloudinary.map(e => {
        var url = e.url
        var thumUrl = url.replace(/\/v(\d*)\//g, '/c_pad,b_black,h_128,w_128/')
        if (e.resource_type === 'video') {
          thumUrl = thumUrl.replace(/\/([^/]*)mp4/g, '/l_video_32/$1jpg')
        }
        return {
          src: url,
          thumbnail: thumUrl,
          w: e.width,
          h: e.height
        }
      })
    }
  },

  updated () {
    if (!this.isInit) {
      this.isInit = true
    } else {
      if (!this.isLoading) {
        var lastData = cloudinary[cloudinary.length - 1];
        // 動画は一旦保留
        if (lastData.resource_type === 'video') return;

        this.isLoading = true
        var img = document.getElementsByTagName('img')
        var targetImg = img[img.length - 2];
        var animationImg = document.getElementById("animation-image")
        targetImg.classList.add('disp-none')
        animationImg.classList.add("rotate-anime")
        setTimeout(() => {
            this.isLoading = false;
            targetImg.classList.remove('disp-none')
            animationImg.classList.remove('rotate-anime')
          }, 3000)
        }
      }
    }
  }
</script>

<style>
html {
  background-color: black
}
.disp-none {
  display: none;
}
.rotate-anime {
  animation: rotate-anime 3s ease-in;
  position:fixed;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  margin: auto;
  max-width: 100%;
  max-height: 100%;
}
@keyframes rotate-anime {
  0%  {transform: scale(1, 1); opacity: 1; }
  100%  {transform: scale(0, 0); opacity: 0;}
}
</style>
