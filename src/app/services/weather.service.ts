import { Injectable } from '@angular/core';
import { Http, Jsonp } from '@angular/http'
import { Observable } from 'rxjs/Observable';

@Injectable()
export class WeatherService{
    weather = "http://ec2-54-149-154-184.us-west-2.compute.amazonaws.com:3000/weather/**/**"
    
    constructor(private _jsonp: Jsonp, private _http: Http){}

    // Get weather data from backend api
    getWeather(lat: string, lng: string){
        return this._http.get(this.weather.replace("**", lat).replace("**", lng))
            .map(response => response.json())
            .catch(error => {
                console.log("Error fetching JSON");
                return Observable.throw(error.json())
            });
    }
}