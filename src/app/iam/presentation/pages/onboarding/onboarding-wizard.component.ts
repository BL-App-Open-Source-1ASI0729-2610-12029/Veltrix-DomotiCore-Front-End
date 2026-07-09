import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { AccountType, AccountTypeOption } from '../../../domain/model/account-type.entity';
import { AuthService } from '../../../application/auth.service';
import { OnboardingStore } from '../../../application/onboarding.store';
import { MATERIAL_IMPORTS } from '../../../../shared/material';

@Component({
  selector: 'app-onboarding-wizard',
  standalone: true,
  imports: [CommonModule, TranslateModule, ...MATERIAL_IMPORTS],
  templateUrl: './onboarding-wizard.component.html',
  styleUrls: ['./onboarding-wizard.component.css'],
})
export class OnboardingWizardComponent implements OnInit {
  readonly store = inject(OnboardingStore);
  private readonly auth = inject(AuthService);

  readonly steps = [1, 2, 3] as const;

  ngOnInit(): void {
    this.store.reset();
  }

  get userName(): string {
    return this.auth.currentUser?.name ?? '';
  }

  get userAvatar(): string | undefined {
    return this.auth.currentUser?.avatar;
  }

  get userInitials(): string {
    return this.userName
      .trim()
      .split(/\s+/)
      .map(part => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }

  get selectedOption(): AccountTypeOption | undefined {
    const type = this.store.selectedType();
    return this.store.accountTypeOptions.find(option => option.id === type);
  }

  selectType(type: AccountType): void {
    this.store.selectAccountType(type);
  }

  getDestinationLabel(type: AccountType): string {
    return type === 'smart-home'
      ? 'onboarding.destinations.smartHome'
      : 'onboarding.destinations.smallBusiness';
  }
}
