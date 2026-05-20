/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PatientRecord, AHPCriteria, AHPResult } from './types';

export const PATIENT_DUMMY_DATA: PatientRecord[] = [];

// PERBAIKAN: Cr → Cost, VLDL → Cost (sesuai dokumen metodologi)
export const AHP_CRITERIA_DATA: AHPCriteria[] = [
  { name: 'HbA1c', weight: 0.35, type: 'Benefit' }, // j=0
  { name: 'BMI',   weight: 0.20, type: 'Benefit' }, // j=1
  { name: 'Urea',  weight: 0.10, type: 'Benefit' }, // j=2
  { name: 'Cr',    weight: 0.08, type: 'Cost'    }, // j=3 ← DIPERBAIKI: Cost
  { name: 'AGE',   weight: 0.07, type: 'Benefit' }, // j=4
  { name: 'Chol',  weight: 0.05, type: 'Benefit' }, // j=5
  { name: 'TG',    weight: 0.05, type: 'Benefit' }, // j=6
  { name: 'HDL',   weight: 0.04, type: 'Cost'    }, // j=7 (sudah benar)
  { name: 'LDL',   weight: 0.03, type: 'Benefit' }, // j=8
  { name: 'VLDL',  weight: 0.03, type: 'Cost'    }, // j=9 ← DIPERBAIKI: Cost
];

export const AHP_MATRIX: number[][] = [
  [1,    2,    3,    4,    5,    6,    7,    8,    9,    9   ],
  [0.5,  1,    2,    3,    4,    5,    6,    7,    8,    8   ],
  [0.33, 0.5,  1,    2,    3,    4,    5,    6,    7,    7   ],
  [0.25, 0.33, 0.5,  1,    2,    3,    4,    5,    6,    6   ],
  [0.2,  0.25, 0.33, 0.5,  1,    2,    3,    4,    5,    5   ],
  [0.17, 0.2,  0.25, 0.33, 0.5,  1,    2,    3,    4,    4   ],
  [0.14, 0.17, 0.2,  0.25, 0.33, 0.5,  1,    2,    3,    3   ],
  [0.12, 0.14, 0.17, 0.2,  0.25, 0.33, 0.5,  1,    2,    2   ],
  [0.11, 0.12, 0.14, 0.17, 0.2,  0.25, 0.33, 0.5,  1,    1   ],
  [0.11, 0.12, 0.14, 0.17, 0.2,  0.25, 0.33, 0.5,  1,    1   ],
];

export const AHP_CONSISTENCY: AHPResult = {
  lambdaMax: 10.85,
  ci: 0.09,
  cr: 0.06,
  isConsistent: true,
};