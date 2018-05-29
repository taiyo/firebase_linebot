import Vue from 'vue'
import Router from 'vue-router'
import Ranking from '@/components/Ranking'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'Ranking',
      component: Ranking
    }
  ]
})
