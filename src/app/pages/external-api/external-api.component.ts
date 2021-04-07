import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';

import {environment as env} from '../../../environments/environment';


interface OrderMessage {
    msg: string;
    order: string;
}

interface Message{
  message:string;
}
@Component({
  selector: 'app-external-api',
  templateUrl: './external-api.component.html',
})
export class ExternalApiComponent implements OnInit {
  message: string = null;
  order: string =null;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {}

  callApi (): void {

    this.http.get(`${env.dev.apiUrl}/api/messages/public-message`)
    .subscribe((result: Message)=> {

      this.message = result.message;

    })

  }
  callSecureApi (): void {

    this.http.post<OrderMessage>(`${env.dev.apiUrl}/api/orders`, { pizzaOrder: 'Large Hawaiin Pizza' }).subscribe({
        next: data => {
            this.message = data.msg;
            this.order = data.order;
        },
        error: error => {
            //this.errorMessage = error.message;
            console.error('There was an error!', error);
        }
    })
    /*this.http.get(`${env.dev.apiUrl}/api/messages/protected-message`)
    .subscribe((result: Message)=> {

    this.message = result.message;

  })*/

  }


}
