import { Component } from '@angular/core';
// Importamos las directivas de rutas necesarias
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  // Agregamos RouterLink y RouterLinkActive para que reconozca los enlaces de la navbar
  imports: [RouterOutlet, RouterLink, RouterLinkActive], 
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
}