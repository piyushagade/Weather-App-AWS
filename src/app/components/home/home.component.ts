import { Component, Output, EventEmitter, animate, style, state, transition, trigger } from '@angular/core';

import { AngularFire, AuthProviders, AuthMethods, FirebaseListObservable } from 'angularfire2';

import { GeolocationService } from '../../services/location.service';
import { WeatherService } from '../../services/weather.service';
import { GeocoderService } from '../../services/geocoder.service';
import { SharerService } from '../../services/sharer.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.view.html',
  styleUrls: [
    '../../../assets/css/main.css',
    './home.styles.css'
  ],
  providers: [ GeolocationService, WeatherService, GeocoderService, SharerService ],
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
  showChangeLocationTip = false;
  weatherLoaded = false;
  locationDenied: boolean = false;

  custom_city: string = "";



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
  location_cityName: string;

  @Output() weatherReceived = new EventEmitter();
  
  constructor(public af: AngularFire, private _gl: GeolocationService, private _ws: WeatherService, private _gc: GeocoderService, private _s: SharerService) {
    
    // Get current coordinates using Geolocation API
    this.isBusy = true;
    // this._gl.getCurrentPosition().forEach(
    //     (position: Position) => {
    //         // Get the name of the place using Google's geocoder API
    //         this.current_lat = position.coords.latitude.toString();
    //         this.current_lng = position.coords.longitude.toString();
    //         this.location_lat = this.current_lat;
    //         this.location_lng = this.current_lng;

    //         this.getCityName(this.current_lat, this.current_lng);
    //     }
    //   )
    //   .then(() => {
        
    //   })
      

    this._gl.getCurrentPositionAPI()
      .subscribe(
        response => {
          console.log(response.location.lat.toString(), response.location.lng.toString())
          this.current_lat = response.location.lat.toString();
          this.current_lng = response.location.lng.toString();
          this.location_lat = this.current_lat;
          this.location_lng = this.current_lng;
          
          this.getCityName(this.current_lat, this.current_lng);

          // Get weather data for current coordinates
          this.weatherLoaded = false;
          this.cityName = this.location_cityName;
          this.getWeatherByCityName();
        }
      )}

  // Get city name from coordinates acquired in the constructor
  getCityName(lat: string, long: string){
    this._gc.getCityName(lat, long).subscribe(
      response => {
          this.cityName = JSON.stringify(response.results[0].formatted_address).replace(/"/g,'');
          if(this.location_cityName === undefined) this.location_cityName = this.cityName;

          // Share cityName
          this._s.sendCityName({ cityName: this.cityName });
      },
      error => console.log("Couldn't get city name.")
    );
  }


  // Get coordinates from city name when user switches to another location
  changeLocation(name: string){
    this.cityName = name;

    this.setBusy();
    this.getWeatherByCityName();
  }

  // Show weather from user's location when asked for manually
  goToMyLocation(){
    this.getWeatherByCityName();
  }

  // Get weather data for current coordinates
  getWeatherByCityName(){
    // Share cityName
    this._s.sendCityName({ cityName: this.cityName });    

    // Set weatherData
    this._ws.getWeather(this.cityName)
      .subscribe(
        response => {
          this.weatherData = response.current;
          this.weatherHistory = response.history
        },
        error => console.log("Error while getting weather data"),
        () => this.onWeatherGet()
      );
  }


  // Set variables when new weather data is acquired
  onWeatherGet(){
    this.setIdle();

    this.wd_timezone = this.weatherData.timezone.replace(/_/g," ");
    this.wd_currently = this.weatherData.currently;
    this.wd_hourly = this.weatherData.hourly;
    this.wd_daily = this.weatherData.daily;
    this.wd_currently_icon = this.weatherData.currently.icon.trim();
    this.wd_current_temperature = this.wd_currently.temperature;

    // Share data to other components do they can update their views
    this._s.sendWeatherData(this.weatherData);
    this._s.sendWeatherHistory(this.weatherHistory);
  }

  // Handle if user denies permission to obtain user location
  onLocationDeny(){
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
}
