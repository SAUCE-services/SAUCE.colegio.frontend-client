import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, ], // Ya no necesitamos RouterLink ni ColegioServ aquí
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class HomeComponent {
  // Eliminamos la inyección del servicio y la lógica del ngOnInit 
  // para que la Home cargue de forma instantánea y limpia.
}