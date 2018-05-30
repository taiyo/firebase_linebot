<template>
  <b-table :data="ranks" :columns="columns"></b-table>
</template>

<script>
import Axios from 'axios'

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
