<template>
  <b-table :data="ranks" :columns="columns"></b-table>
</template>

<script>
import Vue from 'vue'
import Axios from 'axios'
import Buefy from 'buefy'
import 'buefy/lib/buefy.css'

Vue.use(Buefy)

export default {
  data () {
    return {
      columns: [
        { field: 'rank', label: 'ランキング' },
        { field: 'profile.displayName', label: '名前' },
        { field: 'count', label: '投稿数' }
      ],
      ranks: []
    }
  },
  created () {
    const self = this
    Axios.get(process.env.RANK_URL).then(res => {
      self.ranks = res.data
    })
  }
}
</script>

<style scoped>
</style>
