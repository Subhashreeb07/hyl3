import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SessionService } from '../../core/services/session.service';

@Component({
  selector: 'app-landing-redirect',
  standalone: true,
  template: ''
})
export class LandingRedirectComponent implements OnInit {
  constructor(
    private readonly router: Router,
    private readonly sessionService: SessionService
  ) {}

  ngOnInit(): void {
    if (this.sessionService.getToken()) {
      if ((this.sessionService.getRole() ?? '').toUpperCase() === 'ADMIN') {
        this.router.navigateByUrl('/admin/dashboard');
      } else {
        this.router.navigateByUrl('/employee/dashboard');
      }
      return;
    }
    this.router.navigateByUrl('/login');
  }
}
