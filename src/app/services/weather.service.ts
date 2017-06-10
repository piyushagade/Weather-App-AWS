import { Injectable } from '@angular/core';
import { Http, Jsonp } from '@angular/http'
import { Observable } from 'rxjs/Observable';

@Injectable()
export class WeatherService{
    server = 'ec2-54-202-210-202.us-west-2.compute.amazonaws.com'
    weather = "http://" + this.server + ":3000/weather/**"
    
    constructor(private _jsonp: Jsonp, private _http: Http){}

    // Get weather data from backend api
    getWeather(name: string){
        return this._http.get(this.weather.replace("**", name))
            .map(response => response.json())
            .catch(error => {
                console.log("Error fetching JSON");
                return Observable.throw(error.json())
            });
    }
}