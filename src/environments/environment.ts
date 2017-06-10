// The file contents for the current environment will overwrite these during build.
// The build system defaults to the dev environment which uses `environment.ts`, but if you do
// `ng build --env=prod` then `environment.prod.ts` will be used instead.
// The list of which env maps to which file can be found in `angular-cli.json`.

export const environment = {
  production: true,
  firebase: {
    apiKey: "AIzaSyCOwzHSWAYL2cYRF7t7MCVF9I2W8LRzlvo",
    authDomain: "skycast-pa-aws.firebaseapp.com",
    databaseURL: "https://skycast-pa-aws.firebaseio.com",
    projectId: "skycast-pa-aws",
    storageBucket: "skycast-pa-aws.appspot.com",
    messagingSenderId: "359491823283"
  }
};
