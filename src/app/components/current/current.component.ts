import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { GeolocationService } from '../../services/location.service';
import { WeatherService } from '../../services/weather.service';
import { GeocoderService } from '../../services/geocoder.service';
import { SharerService } from '../../services/sharer.service';
import { AngularFire, AuthProviders, AuthMethods, FirebaseListObservable, FirebaseObjectObservable } from 'angularfire2';
import { Subscription } from 'rxjs/Subscription';
import { LocalStorageService } from 'angular-2-local-storage';

@Component({
    selector: 'sc-current',
    templateUrl: './current.view.html',
    styleUrls: [
        './current.styles.css'
    ],
    providers: [ GeolocationService, WeatherService, GeocoderService ]
})


export class CurrentComponent implements OnInit, OnDestroy{
    // Authentication variables
    user_favourites: FirebaseListObservable<any>;
    user_history: FirebaseListObservable<any>;
    name: any;
    username: string;
    uid: string;
    
    // Flags
    loggedIn= false;
    isBusy: boolean = true;
    locationDenied = false;
    showChangeLocationTip = false;

    custom_city = "";
    @Output() newCityName = new EventEmitter();
    @Output() goToMyLocationEvent = new EventEmitter();
    @Output() isBusyEvent = new EventEmitter();

    // Weather information
    @Input() weatherData;
    cityName: string;
    wd_current_temperature: string = "";
    wd_currently: any = [];
    wd_hourly: any = [];
    wd_daily: any = [];
    wd_timezone: string;
    wd_timezone_offset: number;
    wd_icon: string;
    wd_weatherData_1hr = [];
    wd_weatherData_3hr = [];
    wd_weatherData_9hr = [];
    wd_currently_icon: string = "clear-day";
    favouriteCities: string[] = [];
    searchHistory: any = [];
    localSearchHistory = {};

    // Location data
    current_lat: string;
    current_lng: string;
    location_lat: string;
    location_lng: string;
    location_cityName: string;

    private subscription: Subscription;
    private favourite_subscriber;
    private history_subscriber;


  constructor(private _lss: LocalStorageService, public af: AngularFire, private _gl: GeolocationService, private _ws: WeatherService, private _gc: GeocoderService, private _s: SharerService) {
    
    // Reset local search history
    // this._lss.set('localSearchHistory', []);


    // Get localStorage data
    this.localSearchHistory = this._lss.get('searches');

    // If first run
    if(!this.localSearchHistory) this.localSearchHistory = [];
    
    // Check if user is logged in
    this.af.auth.subscribe(auth => {
      if(auth) {
        this.name = auth;
        this.loggedIn = true;
        this.username = this.name.facebook.displayName;
        this.uid = this.name.facebook.uid;

        this.user_favourites = af.database.list('/users/' + this.uid + '/favourites/', { preserveSnapshot: true });
        this.user_history = af.database.list('/users/' + this.uid + '/history/', {
              query: { 
                limitToLast: 5,
              }, 
              preserveSnapshot: true 
          }
        );
        
        // Get list of favourite cities from the cloud
        this.favourite_subscriber = this.user_favourites
            .subscribe(
              snapshots =>{ snapshots.forEach(snapshot => {
              if(this.favouriteCities.indexOf(snapshot.key) == -1) this.favouriteCities.push(snapshot.key);
            });
        })

        // Get search history from the cloud
        this.history_subscriber = this.user_history
            .subscribe(
              snapshots =>{ snapshots.forEach(snapshot => {
              if(this.searchHistory.indexOf(snapshot.key) == -1) this.searchHistory.push(snapshot.key);
            });
        })
        
        this.setIdle(); 
      }
      else{
        this.loggedIn = false;
        this.setIdle();    
      }
    });

  }

  // Alter authentications
  login() {
    this.af.auth.login({
      provider: AuthProviders.Facebook,
      method: AuthMethods.Popup
    });
    // Reset search history array to make place for cloud data
    this.searchHistory = [];
  }

  logout() {
     this.af.auth.logout();
     this.name = null;
     
     this.favourite_subscriber.unsubscribe();
     this.history_subscriber.unsubscribe();
  }

  // Get coordinates for the custom city entered by the user
  getCoords(name: string, flag: boolean){
    //Capitalize words
    if(flag) name = name.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()});

    if(!this.loggedIn) {
      this.searchHistory = this.localSearchHistory;
    }

    // Save searchHistory on cloud
    if(this.searchHistory.indexOf(name) != -1){
      this.searchHistory.splice(this.searchHistory.indexOf(name), 1);
      this.af.database.object('/users/' + this.uid + '/history/' + name)
      .remove()
      .catch(error => {
        console.log("Firebase disconnected. User has signed out.");
      });
    }

    // Maintain recent search list to be of lenght 5
    if(this.searchHistory.length >= 5) {
      console.log("History size greater than 5. Removing " + this.searchHistory[0]);
      this.af.database.object('/users/' + this.uid + '/history/' + this.searchHistory[0])
      .remove()
      .catch(error => {
        console.log("Firebase disconnected. User has signed out.");
      });
      this.searchHistory.splice(0, 1);    
      
    }
    
    // Save in searchHistory array
    this.searchHistory.push(name);

    //Save localSearchHistory on localStorage
    if(!this.loggedIn) {
      this.localSearchHistory = this.searchHistory;
      this._lss.set('searches', this.localSearchHistory);
    }

    // Save search history on cloud
    this.af.database.object('/users/' + this.uid + '/history/' + name)
      .set(Math.floor(Date.now() / 1000))
      .catch(error => {
        console.log("Firebase disconnected. User has signed out.");
      });

    
    // Emit event and load weather data
    this.newCityName.emit(name);
  }

  // When user clicks on the input text box
  onChangeLocationFocus(){
    this.showChangeLocationTip = true;
  }

  // When user leaves the input text box
  onChangeLocationBlur(){
    this.showChangeLocationTip = false;
  }

  ngOnInit() {
    // Subscribe to incoming data from home component
    this.subscription = this._s.notifyObservable$.subscribe((res) => {
        if (res.hasOwnProperty('currently')) this.onWeatherGet(res);
        else if (res.hasOwnProperty('cityName')) this.onCityNameGet(res);
        else if (res.hasOwnProperty('locationDenied')) this.onLocationDeniedGet(res);
    });
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
    this.favourite_subscriber.unsubscribe();
    this.history_subscriber.unsubscribe();
  }

  // Set weather variables once weather data is obtained from home component
  onWeatherGet(res){
    this.weatherData = res;
    this.wd_timezone = this.weatherData.timezone.replace(/_/g," ");
    this.wd_timezone_offset = parseInt(this.weatherData.offset);
    this.wd_currently = this.weatherData.currently;
    this.wd_hourly = this.weatherData.hourly;
    this.wd_daily = this.weatherData.daily;
    this.wd_current_temperature = this.wd_currently.temperature;

    // Set data for the weather icons
    this.wd_currently_icon = this.weatherData.currently.icon.trim();
    for(let i = 0; i < this.wd_hourly.data.length; i++){
      let target_1 = this.wd_hourly.data[0].time + 3600;
      let target_3 = this.wd_hourly.data[0].time + 3600 * 3;
      let target_9 = this.wd_hourly.data[0].time + 3600 * 9;
      
      // 1 hr later weather icon
      if(this.wd_hourly.data[i].time === target_1) {
        this.wd_weatherData_1hr = this.wd_hourly.data[i];
      }

      // 3 hrs later icon
      if(this.wd_hourly.data[i].time === target_3) {
        this.wd_weatherData_3hr = this.wd_hourly.data[i];
      }

      // 9 hrs later weather icon
      if(this.wd_hourly.data[i].time === target_9) {
        this.wd_weatherData_9hr = this.wd_hourly.data[i];
      }
    }
  }

  onCityNameGet(res){
      this.cityName = res.cityName;
      
      // Reset input box
      this.custom_city = "";
  }
  
  onLocationDeniedGet(res){
      this.locationDenied = res.locationDenied;
  }

  // Let home component know that user wants weather from his current loaction
  goToMyLocation(){
    this.goToMyLocationEvent.emit();
  }

  // Save a location as favourite
  saveLocation(){
    this.af.database.object('/users/' + this.uid + '/favourites/' + this.cityName)
      .set(Math.floor(Date.now() / 1000))
      .then(_ => console.log('Favourite city set.'))
      .catch(error => {
                console.log("Firebase disconnected. User has signed out.");
      });
  }

  // Remove the location from favourites list
  removeLocation(){
    this.af.database.object('/users/' + this.uid + '/favourites/' + this.cityName)
      .remove()
      .then(_ => console.log('Favourite city deleted.'))
      .catch(error => {
                console.log("Firebase disconnected. User has signed out.");
      });
      
      this.favouriteCities.splice(this.favouriteCities.indexOf(this.cityName), 1);
  }

  // Handle click from favourites dropdown menu
  favouriteSelected(index){
    this.getCoords(this.favouriteCities[index], false);
  }

  // Handle click from search history dropdown menu
  historySelected(index){
    this.getCoords(this.searchHistory[index], false);
  }

  localHistorySelected(index){
    this.getCoords(this.localSearchHistory[index], false);
  }

  // Spinner functions
  setBusy(){
    this.isBusy = true;
    this.isBusyEvent.emit(this.isBusy);
  }

  setIdle(){
    this.isBusy = false;
    this.isBusyEvent.emit(this.isBusy);
  }
}