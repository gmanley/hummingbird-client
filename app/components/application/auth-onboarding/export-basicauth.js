import Component from 'ember-component';
import get from 'ember-metal/get';
import set from 'ember-metal/set';
import service from 'ember-service/inject';
import { invokeAction } from 'ember-invoke-action';
import { task } from 'ember-concurrency';
import errorMessages from 'client/utils/error-messages';
import computed from 'ember-computed';

export default Component.extend({
  editedExporter: undefined,
  username: undefined,
  password: undefined,
  notify: service(),
  session: service(),
  store: service(),

  token: computed('username', 'password', {
    get() {
      const username = get(this, 'username');
      const password = get(this, 'password');
      return btoa(`${username}:${password}`);
    }
  }),

  createExport: task(function* () {
    const exporter = get(this, 'store').createRecord('linked-account', {
      externalUserId: get(this, 'username'),
      token: get(this, 'password'),
      kind: `LinkedAccount::${get(this, 'siteName')}`,
      shareFrom: false,
      shareTo: false,
      syncTo: true,
      user: get(this, 'session.account')
    });

    set(this, 'editedExporter', exporter);
    return yield exporter.save();
  }).drop(),

  init() {
    this._super(...arguments);
    set(this, 'siteName', get(this, 'componentData.siteName'));
  },

  actions: {
    setupExport() {
      get(this, 'createExport').perform()
        .then(() => invokeAction(this, 'close'))
        .catch((err) => {
          get(this, 'notify').error(errorMessages(err));
          get(this, 'editedExporter').deleteRecord();
        });
    },

    changeComponent(component, siteName) {
      invokeAction(this, 'changeComponent', component, { ...get(this, 'componentData'), siteName });
    }
  }
});
