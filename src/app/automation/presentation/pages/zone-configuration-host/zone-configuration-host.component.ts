import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../../iam/application/auth.service';
import { ZoneConfigurationComponent } from '../zone-configuration/zone-configuration.component';

@Component({
  selector: 'app-zone-configuration-host',
  standalone: true,
  imports: [ZoneConfigurationComponent],
  template: `
    @if (auth.getAccountType() === 'small-business') {
      <app-zone-configuration />
    }
  `,
})
export class ZoneConfigurationHostComponent implements OnInit {
  readonly auth = inject(AuthService);

  private readonly router = inject(Router);

  ngOnInit(): void {
    if (this.auth.getAccountType() !== 'small-business') {
      void this.router.navigate(['/app/automation/center']);
    }
  }
}
