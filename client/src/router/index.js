import Vue from 'vue'
import Router from 'vue-router'
import Ranking from '@/components/Ranking'
import Gallery from '@/components/Gallery'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      component: Gallery
    },
    {
      path: '/rank',
      component: Ranking
    }
  ]
})
