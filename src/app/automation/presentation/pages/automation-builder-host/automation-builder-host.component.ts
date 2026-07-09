import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../../iam/application/auth.service';
import { AutomationBuilderComponent } from '../automation-builder/automation-builder.component';

@Component({
  selector: 'app-automation-builder-host',
  standalone: true,
  imports: [AutomationBuilderComponent],
  templateUrl: './automation-builder-host.component.html',
})
export class AutomationBuilderHostComponent implements OnInit {
  readonly auth = inject(AuthService);

  private readonly router = inject(Router);

  ngOnInit(): void {
    if (this.auth.getAccountType() !== 'smart-home') {
      void this.router.navigate(['/app/automation/center']);
    }
  }
}
