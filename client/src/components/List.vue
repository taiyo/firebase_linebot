<template>
  <b-table :data="lists" :columns="columns"></b-table>
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
        { field: 'index', label: '投稿' },
        { field: 'profile.displayName', label: '名前' },
        { field: 'image', label: '画像' },
        { field: 'time', label: '時間' },
      ],
      lists: []
    }
  },
  created () {
    const self = this
    Axios.get(process.env.LIST_URL).then(res => {
      var data = res.data
      data.sort((a, b) => a.timestamp - b.timestamp)
      data = data.map((row, index) => Object.assign({
        'index': index + 1,
        'time': new Date(row.timestamp).toString()
      }, row));
      self.lists = data
    })
  }
}
</script>

<style scoped>
</style>
