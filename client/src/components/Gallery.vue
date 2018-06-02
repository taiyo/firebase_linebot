<template>
  <div>
    <vue-picture-swipe :items="images"></vue-picture-swipe>
  </div>
</template>

<script>
import Vue from 'vue'
import VueFire from 'vuefire'
import firebase from 'firebase'
import VuePictureSwipe from 'vue-picture-swipe';

Vue.use(VueFire)

Vue.component('vue-picture-swipe', VuePictureSwipe);

// var firebaseApp = firebase.initializeApp({})
var firebaseApp = firebase.initializeApp({
  apiKey: process.env.FIREBASE_API_KEY,
  databaseURL: process.env.FIREBASE_DATABASE_URL
})

export default {

  firebase: {
    cloudinary: firebaseApp.database().ref('/cloudinary')
  },

  data: function () {
    return {
      index: null
    }
  },

  computed: {
    images () {
      return this.cloudinary.map(e => {
        var url = e.url
        var thumUrl = url.replace(/\/v(.*)\//g, '/c_pad,b_black,h_200,w_200/')
        return {
          src: url,
          thumbnail: thumUrl,
          w: e.width,
          h: e.height
        }
      })
    }
  }
}
</script>

<style>
html {
  background-color: black
}
</style>
