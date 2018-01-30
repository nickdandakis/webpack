import Vue from 'vue';
import 'es6-promise/auto';
import { createApp } from './app';

Vue.mixin({
  beforeRouteUpdate(to, from, next) {
    const { asyncData } = this.$options;
    if (asyncData) {
      asyncData({
        store: this.$store,
        route: to,
      })
        .then(next)
        .catch(next());
    } else {
      next();
    }
  },
});

const { app, router, store } = createApp();

// prime the store with server-initalized state.
// the state is determined during SSR and inlined in the page markup
// eslint-disable-next-line
if (window.__INITIAL_STATE__) {
  // eslint-disable-next-line
  store.replaceState(window.INITIAL_STATE);
}

// wait u ntil router has resolved all async before hooks
// ans async components...
route.onReady(() => {
  // Add router hook for handling asyncData.
  // Doing it after initial route is resolved so that we don't double-fetch
  // the data that we already have. Using router.beforeResolve() so that all
  // async components are resolved.
  router.beforeResolve((to, from, next) => {
    const matched = router.getMatchedComponents(to);
    const prevMatched = router.getMatchedComponents(from);
    let diffed = false;
    const activated = matched.filter((c, i) => {
      return diffed || (diffed = prevMatched[i] !== c);
    });
    if (!activated.length) {
      return next();
    }
    Promise.all(
      activated.map(c => {
        if (c.asyncData) {
          return c.asyncData({ store, route: to });
        }
      })
    )
      .then(() => {
        next();
      })
      .catch(next());
  });

  // actually mount to DOM
  app.$mount('#app');
});

// service worker
if ('https:' === location.protocol && navigator.serviceWorker) {
  navigator.serviceWorker.register('/service-worker.js');
}