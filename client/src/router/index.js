import Vue from 'vue'
import Router from 'vue-router'
import Gallery from '@/components/Gallery'
import Ranking from '@/components/Ranking'

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
