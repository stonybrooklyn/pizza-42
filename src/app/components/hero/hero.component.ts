import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-hero',
  templateUrl: './hero.component.html',
})
export class HeroComponent implements OnInit {
  heroLogo = "assets\img\axa-logo.png";

  constructor() {}

  ngOnInit(): void {}
}
