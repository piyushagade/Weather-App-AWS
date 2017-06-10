import { Component } from '@angular/core';

import { AngularFire, AuthProviders, AuthMethods, FirebaseListObservable } from 'angularfire2';

@Component({
  selector: 'app-root',
  template: `
      <router-outlet class="container"></router-outlet>
    `,
})

export class EntryComponent {

}
