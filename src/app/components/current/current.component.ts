import { Component, Input, Output, EventEmitter, OnInit, 
  OnDestroy, trigger, state, animate, transition, style 
} from '@angular/core';

import { GeolocationService } from '../../services/location.service';
import { WeatherService } from '../../services/weather.service';
import { GeocoderService } from '../../services/geocoder.service';
import { SharerService } from '../../services/sharer.service';
import { UserService } from '../../services/user.service';

import { AngularFire, 
  AuthProviders,
  AuthMethods 
} from 'angularfire2';

import { Subscription } from 'rxjs/Subscription';
import { LocalStorageService } from 'angular-2-local-storage';

@Component({
    selector: 'sc-current',
    templateUrl: './current.view.html',
    styleUrls: [
        './current.styles.css'
    ],
    providers: [ GeolocationService, WeatherService, GeocoderService, UserService ]
})


export class CurrentComponent implements OnInit, OnDestroy{
    // Authentication variables
    name: any;
    username: string;
    uid: string;
    
    // Flags
    loggedIn= false;
    isBusy: boolean = true;
    locationDenied = false;
    showChangeLocationTip = false;
    temperatureUnits = true;
    cachedWeather = false;
    showHelp = false;
    isWorkingInBackground = false;

    custom_city = "";
    @Output() newCityName = new EventEmitter();
    @Output() goToMyLocationEvent = new EventEmitter();

    // Weather information
    @Input() weatherData;
    cityName: string;
    wd_current_temperature: string = "";
    wd_current_temperature_display: string = ""
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
    
    
    // Favourites
    location_favourites = [];
    favouriteCities: string[] = [];

    // Search history
    _searchHistory: any = [];
    localSearchHistory = {};

    // Location data
    current_lat: string;
    current_lng: string;
    location_lat: string;
    location_lng: string;
    location_cityName: string;
    suggestions: string[] = [];
    cities = ['Abu Dhabi', 'Chelsea', 'Cairo', 'Paris', 'New Delhi', 'Sydney', 'San Francisco'];
    location_input = "";

    // Subscriptions
    private subscription: Subscription;
    private favourite_subscriber: Subscription;
    private history_subscriber: Subscription;


  constructor(private _lss: LocalStorageService, 
    private af: AngularFire, 
    private _gl: GeolocationService, 
    private _ws: WeatherService, 
    private _gc: GeocoderService, 
    private _s: SharerService, 
    private _us: UserService) {

    // If first run
    if(!this._lss.get('searches')){
      this._lss.set('searches', []);
      this._lss.set('unit', true);
    }

    // Get localStorage data
    this.localSearchHistory = this._lss.get('searches');

    // Get units from local storage
    this.temperatureUnits = this._lss.get('unit') === true;
    
    // Check if user is logged in
    this.af.auth.subscribe(auth => {
      if(auth) {
        this.name = auth;
        this.loggedIn = true;
        this.username = this.name.facebook.displayName;
        this.uid = this.name.facebook.uid;        

        // Get list of favourite cities
        this._us.getFavourite(this.uid)
          .subscribe(
            response => {
              for(let j = 0; j < response.length; j++){
                this.location_favourites[j] = { _id: response[j]._id, name: response[j].name};
                this.favouriteCities[j] = this.location_favourites[j].name;
              }
            }
          )
      }
      else{
        this.loggedIn = false;
      }
    });
  }

  // Alter authentication states
  login() {
    this.af.auth.login({
      provider: AuthProviders.Facebook,
      method: AuthMethods.Popup
    });
  }

  logout() {
     this.af.auth.logout();
     this.name = null;
     
     if(this.favourite_subscriber) this.favourite_subscriber.unsubscribe();
     if(this.history_subscriber) this.history_subscriber.unsubscribe();
  }

  // Get weather data for the custom city entered by the user
  getWeather(name: string, flag: boolean){
    //Capitalize words
    if(flag) name = name.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()});

    this._searchHistory = this.localSearchHistory;

    // Maintain recent search list to be of lenght 5
    if(this._searchHistory.length >= 5) {
      this._searchHistory.splice(0, 1);    
    }
    
    // Save in searchHistory array
    if(this._searchHistory.indexOf(name) == -1)
      this._searchHistory.push(name);

    //Save localSearchHistory on localStorage
    this.localSearchHistory = this._searchHistory;
    this._lss.set('searches', this.localSearchHistory);
  
    // Emit event and load weather data
    this.newCityName.emit(name);
  }

  // Show places suggestion
  showSuggestions(name: string){
    this.location_input = name;
    if(name && 
      (name.length % 3 == 0 ||
      name.length == 1) &&
      name != ""){
      this.suggestions.length = 0;

      // Get suggested locations
      this._gc.getSuggestions(name).subscribe(
        response => {
          let address_component;

            if(response.results[0]) {
            for(let i = 0; i < response.results[0].address_components.length; i++) {
              
              address_component = response.results[0].address_components[i];  
              
              if(address_component &&
              address_component.short_name.toString().length > 2 &&
              address_component.short_name !== 'Undefined' &&
              this.suggestions.indexOf(address_component.short_name) == -1) {
                  this.suggestions.push(address_component.short_name);
              }
            } 
          }
        },
        error => console.log("Couldn't get city name.")
      );
    }
  }

  // When user clicks on the input text box
  onChangeLocationFocus(name: string){
    this.showChangeLocationTip = true;
  }

  // When user leaves the input text box
  onChangeLocationBlur(){
    this.showChangeLocationTip = false;
  }

  ngOnInit() {
    // Subscribe to incoming data from home component
    this.subscription = this._s.notifyObservable$.subscribe((res) => {
        if (res.hasOwnProperty('weather')) this.onWeatherGet(res);
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
    this.cachedWeather = res.cached;

    res = res.weather;
    this.weatherData = res;
    this.wd_timezone = this.weatherData.timezone.replace(/_/g," ");
    this.wd_timezone_offset = parseInt(this.weatherData.offset);
    this.wd_currently = this.weatherData.currently;
    this.wd_hourly = this.weatherData.hourly;
    this.wd_daily = this.weatherData.daily;
    this.wd_current_temperature = this.wd_currently.temperature;
    if(this.temperatureUnits) this.wd_current_temperature_display = this.wd_current_temperature;
    else this.wd_current_temperature_display = ((parseInt(this.wd_current_temperature) - 32) * 5 / 9).toString();

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

  // Show help
  toggleHelp(){
    this.showHelp = !this.showHelp;
  }

  // Refresh cached data
  refreshCachedData(){
    this.newCityName.emit(this.cityName);
  }

  // Save a location as favourite
  saveLocation(){
    this.setWait(true);

    // If already in favourites, don't add it
    if(this.favouriteCities.indexOf(this.cityName) > -1) return;

    // Add to favourites on the cloud
    this._us.addFavourite(this.cityName, this.uid)
      .subscribe(() => {
        // Get updated list from backend
        this._us.getFavourite(this.uid)
          .subscribe(
            response => {
              for(let j = 0; j < response.length; j++){
                this.location_favourites[j] = { _id: response[j]._id, name: response[j].name};
                this.favouriteCities[j] = this.location_favourites[j].name;
              }
            }
          )
          this.setWait(false);
      });
  }

  // Remove the location from favourites list
  removeLocation(){
    this.setWait(true);
    var _id;

    for(let i = 0; i < this.location_favourites.length; i++){
      if(this.location_favourites[i].name == this.cityName){
        _id = this.location_favourites[i]._id;
        this._us.removeFavourite(_id).subscribe();
        this.favouriteCities.splice(this.favouriteCities.indexOf(this.cityName), 1);
        this.location_favourites.splice(i, 1);
        
        this.setWait(false);
      }
    }
  }

  // Change temperatur units
  changeUnits(){
    this.temperatureUnits = !this.temperatureUnits;

    // Save in local storage
    this._lss.set('unit', this.temperatureUnits);

    if(this.temperatureUnits) this.wd_current_temperature_display = this.wd_current_temperature;
    else
      this.wd_current_temperature_display = ((parseInt(this.wd_current_temperature) - 32) * 5 / 9).toString();
  }
  
  // Handle click from suggestions
  suggestionSelected(index){
    this.getWeather(this.suggestions[index], false);
    this.suggestions = [];    
  }

  // Handle click from random city suggestion
  randomCitySelected(index){
    this.getWeather(this.cities[index], false);
  }


  // Handle click from favourites dropdown menu
  favouriteSelected(index){
    this.getWeather(this.favouriteCities[index], false);
  }

  localHistorySelected(index){
    this.getWeather(this.localSearchHistory[index], false);
  }

  // Spinner functions
  setBusy(){
    this.isBusy = true;
  }

  setIdle(){
    this.isBusy = false;
  }

  // Wait functions
  setWait(wait){
    this.isBusy = wait;

    if(wait) this.isWorkingInBackground = true;
    else setTimeout(() => this.isWorkingInBackground = false , 2000);
  }
}