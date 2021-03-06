import { Component, Output, EventEmitter, animate, style, state, transition, trigger } from '@angular/core';
import { AngularFire, AuthProviders, AuthMethods, FirebaseListObservable } from 'angularfire2';

import { GeolocationService } from '../../services/location.service';
import { WeatherService } from '../../services/weather.service';
import { GeocoderService } from '../../services/geocoder.service';
import { SharerService } from '../../services/sharer.service';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.view.html',
  styleUrls: [
    './home.styles.css'
  ],
  providers: [ GeolocationService, WeatherService, GeocoderService, SharerService, UserService ],
  animations: [
    trigger("fadeInOut", [
      state("open", style({opacity: 1})),
      state("closed", style({opacity: 0})),
      transition("open => closed", animate( "1200ms" )),
      transition("closed => open", animate( "400ms" )),
    ])
  ],
})

export class HomeComponent {
  // Flags
  isBusy: boolean = true;
  showChangeLocationTip: boolean = false;
  weatherLoaded: boolean = false;
  locationDenied: boolean = false;
  cachedWeather: boolean = false;
  error: string = "";

  // Weather information
  weatherData: any;
  weatherHistory: Object[] = [];
  factor = [1, 7, 30, 180, 365, 1825, 3650, 7300];
  cityName: string;
  wd_current_temperature: string = "";
  wd_currently: any = [];
  wd_hourly: any = [];
  wd_daily: any = [];
  wd_timezone: string;
  wd_icon: string;
  wd_currently_icon: string = "clear-day";

  // Location data
  current_lat: string;
  current_lng: string;
  location_lat: string;
  location_lng: string;
  custom_city: string = "";
  location_cityName: string;
  
  constructor(public af: AngularFire, 
    private _gl: GeolocationService, 
    private _ws: WeatherService, 
    private _gc: GeocoderService, 
    private _s: SharerService, 
    private _us: UserService) {
    
    // Get current coordinates using Geolocation API and show its weather
    this.isBusy = true;
    this._gl.getCurrentPositionAPI()
      .subscribe(
        response => {
          this.current_lat = response.location.lat.toString();
          this.current_lng = response.location.lng.toString();
          this.location_lat = this.current_lat;
          this.location_lng = this.current_lng;
          
          this.getCityName(this.current_lat, this.current_lng);
        }
      )
  }

  // Get city name from coordinates acquired in the constructor
  getCityName(lat: string, long: string){
    this._gc.getCityName(lat, long).subscribe(
      response => {
          this.cityName = JSON.stringify(response.results[0].formatted_address).replace(/"/g,'');
          if(this.location_cityName === undefined) this.location_cityName = this.cityName;
          
          // Get weather data for current coordinates
          this.weatherLoaded = false;
          this.getWeatherByCityName();
      },
      error => console.log("Couldn't get city name.")
    );
  }


  // When user wants to change location
  changeLocation(name: string){
    this.cityName = name;
    this.getWeatherByCityName();
  }

  // Show weather from user's location when asked for manually
  goToMyLocation(){
    this.cityName = this.location_cityName;
    this.getWeatherByCityName();
  }

  // Get weather data for current coordinates
  getWeatherByCityName(){
    this.setBusy();
    this._ws.getWeather(this.cityName)
      .subscribe(
        response => {
          this.cachedWeather = response.cache.weather;
          this.weatherData = response.current;
          this.weatherHistory = response.history;
          this.onWeatherGet();
        },
        error => {
          this.error = "network";
          console.log("Error while getting weather data")
        }
      );
  }


  // Set variables when new weather data is acquired
  onWeatherGet(){
    // Reset error
    this.error = "";

    //Set idle
    this.setIdle();

    // Share cityName
    this._s.sendCityName({ cityName: this.cityName });

    this.wd_timezone = this.weatherData.timezone.replace(/_/g," ");
    this.wd_currently = this.weatherData.currently;
    this.wd_hourly = this.weatherData.hourly;
    this.wd_daily = this.weatherData.daily;
    this.wd_currently_icon = this.weatherData.currently.icon.trim();
    this.wd_current_temperature = this.wd_currently.temperature;

    // Share data to other components so they can update their views
    this._s.sendWeatherData({weather: this.weatherData, cached: this.cachedWeather});
    this._s.sendWeatherHistory(this.weatherHistory);
  }

  // Handle if user denies permission to obtain user location
  onLocationDenied(){
    this.locationDenied = true;

    // So, show weather of a random city instead
    let cities = ['Abu Dhabi', 'Chelsea', 'Cairo', 'Paris', 'New Delhi', 'Bangkok', 'Sydney', 'Tampa', 'San Francisco', 'Venice'];
    let city = cities[Math.floor(Math.random() * 9)];
    this.changeLocation(city);
    
    // Share cityName
    this._s.sendCityName({ cityName: city });

    // Let every component know
    this._s.sendLocationDenied({ locationDenied: this.locationDenied });
  }

  // Show spinner
  setBusy(){
    this.weatherLoaded = false;
    this.isBusy = true;
  }

  // Hide spinner
  setIdle(){
    this.isBusy = false;
    setTimeout(function() {
      this.weatherLoaded = true;
    }.bind(this), 1400);
  }

  // Try resolving network error
  resolveError(){
    this.getWeatherByCityName();
  }
}
