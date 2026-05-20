export interface PatientRecord {
  id: number;
  name: string;
  age: number;
  urea: number;
  cr: number;
  hba1c: number;
  chol: number;
  tg: number;
  hdl: number;
  ldl: number;
  vldl: number;
  bmi: number;
  riskClass: 'Diabetic' | 'Predicted Diabetic' | 'Non-Diabetic';
  ccValue: number;
  dPlus: number;
  dMinus: number;
}

export interface AHPCriteria {
  name: string;
  weight: number;
  type: 'Benefit' | 'Cost';
}

export interface AHPResult {
  lambdaMax: number;
  ci: number;
  cr: number;
  isConsistent: boolean;
}