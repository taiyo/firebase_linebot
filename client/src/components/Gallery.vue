<template>
  <vue-picture-swipe :items="items"></vue-picture-swipe>
</template>

<script>
import Vue from 'vue'
import VuePictureSwipe from 'vue-picture-swipe' // eslint-disable-line

Vue.component('vue-picture-swipe', VuePictureSwipe)

export default {
  name: 'gallery',
  data () {
    return {
      items: [
        {
          src: 'http://via.placeholder.com/600x400',
          thumbnail: 'http://via.placeholder.com/64x64',
          w: 600,
          h: 400
        },
        {
          src: 'http://via.placeholder.com/1200x900',
          thumbnail: 'http://via.placeholder.com/64x64',
          w: 1200,
          h: 900
        }
      ]
    }
  }
}
</script>
