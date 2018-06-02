<template>
  <div>
    <gallery :images="images" :index="index" @close="index = null"></gallery>
    <div
      class="image"
      v-for="(image, imageIndex) in images"
      :key="imageIndex"
      @click="index = imageIndex"
      :style="{ backgroundImage: 'url(' + image + ')', width: '300px', height: '200px' }"
    ></div>
  </div>
</template>

<script>
import Vue from 'vue'
import VueGallery from 'vue-gallery'
import VueFire from 'vuefire'
import firebase from 'firebase'

Vue.use(VueFire)

// var firebaseApp = firebase.initializeApp({})
var firebaseApp = firebase.initializeApp({
  apiKey: process.env.FIREBASE_API_KEY,
  databaseURL: process.env.FIREBASE_DATABASE_URL
})

firebaseApp.database().ref('/cloudinary').once('value').then(function (snapshot) {
  console.log(snapshot)
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
      return this.cloudinary.map(e => e.url)
    }
  },

  components: {
    gallery: VueGallery
  }
}
</script>

<style scoped>
.image {
  float: left;
  background-size: cover;
  background-repeat: no-repeat;
  background-position: center center;
  border: 1px solid #ebebeb;
  margin: 5px;
}
</style>
