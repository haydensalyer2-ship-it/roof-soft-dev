export type ClaimStatus = 
  | 'new'
  | 'inspection' 
  | 'claim_filed' 
  | 'adjustment' 
  | 'approved_or_denied' 
  | 'contract_signed' 
  | 'completed';

export type DamageType = 'hail' | 'wind' | 'missing_shingles' | 'water_leak' | 'structural';
export type CollateralItem = 'gutters' | 'downspouts' | 'window_screens' | 'ac_unit' | 'siding' | 'fence';

export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  zip: string;
}

export interface TestSquare {
  id: string;
  slope: 'Front' | 'Back' | 'Left' | 'Right' | 'Flat';
  hailHits: number;
  windDamagedShingles: number;
}

export interface DamageReport {
  id: string;
  inspectionDate: string;
  inspectorName: string;
  roofAgeEstimate: number;
  roofType: string;
  testSquares: TestSquare[];
  collateralDamage: CollateralItem[];
  notes: string;
  photosUploaded: number;
  /** AI-authored fields used by the instant report builder. */
  damageSummary?: string;
  recommendation?: string;
  damageTypes?: string[];
  createdAt?: string;
  status?: 'draft' | 'ready';
}

export interface InsuranceClaim {
  id: string;
  insuranceCompany: string;
  claimNumber: string;
  policyNumber: string;
  dateOfLoss: string;
  adjustmentDate?: string;
  adjusterName?: string;
  adjusterPhone?: string;
  adjusterEmail?: string;
  status: ClaimStatus;
  
  // Financials
  rcv: number; // Replacement Cost Value
  acv: number; // Actual Cash Value
  depreciation: number; // Recoverable Depreciation
  deductible: number;
  supplementAmount: number;
  totalCollected?: number; // Payments explicitly collected from homeowner
}

export interface TeamMember {
  id: string;
  userId: string; // the organization/admin who owns this rep
  managerId?: string; // If this rep is assigned to a manager
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: 'owner' | 'manager' | 'sales_rep';
  status: 'active' | 'inactive';
  createdAt?: any;
}

export interface ProjectDocument {
  id: string;
  name: string;
  type: string;
  url: string;
  uploadedAt: string;
}

export interface Project {
  id: string;
  userId?: string;
  repName?: string;
  customer: Customer;
  status: ClaimStatus;
  createdAt: any;
  updatedAt?: any;
  damageReport?: DamageReport;
  damageReports?: DamageReport[];
  claim?: InsuranceClaim;
  documents?: ProjectDocument[];
}


export type KnockStatus = 'not_home' | 'conversation' | 'inspection' | 'dnc';
export interface Knock {
  id: string;
  userId: string;
  repName?: string;
  lat: number;
  lng: number;
  status: KnockStatus;
  address?: string;
  notes?: string;
  createdAt: any;
}
