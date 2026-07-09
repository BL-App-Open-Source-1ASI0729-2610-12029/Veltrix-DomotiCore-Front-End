import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClientService } from '../../shared/services/api-client.service';
import { CostAnalysisResponse } from './cost-analysis-response';

const ANALYSIS_PATH = 'cost-analysis';
const MOCK_FILE = 'cost-analysis';

@Injectable({ providedIn: 'root' })
export class CostAnalysisApiService {
  private readonly api = inject(ApiClientService);

  getCostAnalysis(): Observable<CostAnalysisResponse> {
    return this.api.getObject<CostAnalysisResponse>(ANALYSIS_PATH, MOCK_FILE);
  }
}
