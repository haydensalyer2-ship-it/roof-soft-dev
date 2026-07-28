import { Project } from '../types';

export const mockProjects: Project[] = [
  {
    id: 'PRJ-1001',
    repName: 'Mike Builder',
    createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    status: 'adjustment',
    customer: {
      id: 'CUST-837',
      firstName: 'John',
      lastName: 'Doe',
      phone: '(555) 123-4567',
      email: 'johndoe@example.com',
      address: '123 Maple Street',
      city: 'Springfield',
      state: 'IL',
      zip: '62704'
    },
    damageReport: {
      id: 'DR-1001',
      inspectionDate: new Date(Date.now() - 8 * 86400000).toISOString(),
      inspectorName: 'Mike Builder',
      roofAgeEstimate: 15,
      roofType: '3-Tab Asphalt',
      testSquares: [
        { id: 'ts-1', slope: 'Front', hailHits: 12, windDamagedShingles: 2 },
        { id: 'ts-2', slope: 'Back', hailHits: 8, windDamagedShingles: 0 },
        { id: 'ts-3', slope: 'Right', hailHits: 15, windDamagedShingles: 0 }
      ],
      collateralDamage: ['gutters', 'window_screens', 'ac_unit'],
      notes: 'Significant hail damage on front and right slopes. AC unit has severe comb damage. Gutters dinged across the front elevation.',
      photosUploaded: 24
    },
    claim: {
      id: 'CLM-1001',
      insuranceCompany: 'State Farm',
      claimNumber: 'SF-99482-XA',
      policyNumber: 'POL-3847291',
      dateOfLoss: new Date(Date.now() - 15 * 86400000).toISOString(),
      adjustmentDate: new Date(Date.now() + 2 * 86400000).toISOString(), // 2 days in the future
      adjusterName: 'Sarah Jenkins',
      adjusterPhone: '(555) 987-6543',
      status: 'adjustment',
      rcv: 0,
      acv: 0,
      depreciation: 0,
      deductible: 1000,
      supplementAmount: 0,
      totalCollected: 0
    }
  },
  {
    id: 'PRJ-1002',
    repName: 'David Roofer',
    createdAt: new Date(Date.now() - 25 * 86400000).toISOString(),
    status: 'approved_or_denied',
    customer: {
      id: 'CUST-838',
      firstName: 'Alissa',
      lastName: 'Smith',
      phone: '(555) 234-5678',
      email: 'alissa.smith@example.com',
      address: '456 Oak Avenue',
      city: 'Springfield',
      state: 'IL',
      zip: '62705'
    },
    damageReport: {
      id: 'DR-1002',
      inspectionDate: new Date(Date.now() - 24 * 86400000).toISOString(),
      inspectorName: 'David Roofer',
      roofAgeEstimate: 8,
      roofType: 'Architectural Shingle',
      testSquares: [
        { id: 'ts-4', slope: 'Front', hailHits: 0, windDamagedShingles: 15 },
        { id: 'ts-5', slope: 'Back', hailHits: 0, windDamagedShingles: 8 },
        { id: 'ts-6', slope: 'Left', hailHits: 0, windDamagedShingles: 22 }
      ],
      collateralDamage: ['siding'],
      notes: 'High wind event caused severe creasing and blow-offs on left and front slopes. Siding pulled loose on west wall.',
      photosUploaded: 18
    },
    claim: {
      id: 'CLM-1002',
      insuranceCompany: 'Allstate',
      claimNumber: 'ALL-884-219',
      policyNumber: 'POL-9928122',
      dateOfLoss: new Date(Date.now() - 30 * 86400000).toISOString(),
      adjusterName: 'Tom Riddle',
      status: 'approved_or_denied',
      rcv: 18500,
      acv: 12000,
      depreciation: 6500,
      deductible: 1500,
      supplementAmount: 0,
      totalCollected: 9250 // Has 50% Upfront Paid
    }
  },
  {
    id: 'PRJ-1003',
    repName: 'Mike Builder',
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    status: 'claim_filed',
    customer: {
      id: 'CUST-839',
      firstName: 'Robert',
      lastName: 'Johnson',
      phone: '(555) 876-5432',
      email: 'rjohnson88@example.com',
      address: '789 Pine Road',
      city: 'Springfield',
      state: 'IL',
      zip: '62703'
    },
    damageReport: {
      id: 'DR-1003',
      inspectionDate: new Date(Date.now() + 1 * 86400000).toISOString(), // Tomorrow
      inspectorName: 'Mike Builder',
      roofAgeEstimate: 20,
      roofType: 'Wood Shake',
      testSquares: [
        { id: 'ts-7', slope: 'Front', hailHits: 25, windDamagedShingles: 0 },
        { id: 'ts-8', slope: 'Right', hailHits: 30, windDamagedShingles: 0 }
      ],
      collateralDamage: ['gutters', 'window_screens'],
      notes: 'Extreme hail damage to old wood shake roof. Splitting and bruising widespread.',
      photosUploaded: 35
    },
    claim: {
      id: 'CLM-1003',
      insuranceCompany: 'Farmers',
      claimNumber: 'FRM-PENDING',
      policyNumber: 'POL-112349',
      dateOfLoss: new Date(Date.now() - 10 * 86400000).toISOString(),
      status: 'claim_filed',
      rcv: 0,
      acv: 0,
      depreciation: 0,
      deductible: 2000,
      supplementAmount: 0,
      totalCollected: 0
    }
  },
  {
    id: 'PRJ-1004',
    repName: 'Sarah Closer',
    createdAt: new Date(Date.now() - 40 * 86400000).toISOString(),
    status: 'contract_signed',
    customer: {
      id: 'CUST-840',
      firstName: 'Emily',
      lastName: 'Davis',
      phone: '(555) 345-6789',
      email: 'emilydavis.home@example.com',
      address: '221B Baker St',
      city: 'Springfield',
      state: 'IL',
      zip: '62701'
    },
    damageReport: {
      id: 'DR-1004',
      inspectionDate: new Date(Date.now() - 38 * 86400000).toISOString(),
      inspectorName: 'Sarah Closer',
      roofAgeEstimate: 12,
      roofType: 'Architectural Shingle',
      testSquares: [
        { id: 'ts-9', slope: 'Front', hailHits: 10, windDamagedShingles: 5 }
      ],
      collateralDamage: ['window_screens'],
      notes: 'Borderline claim, successfully pushed through adjustment.',
      photosUploaded: 12
    },
    claim: {
      id: 'CLM-1004',
      insuranceCompany: 'Travelers',
      claimNumber: 'TRV-0091-B',
      policyNumber: 'POL-555112',
      dateOfLoss: new Date(Date.now() - 45 * 86400000).toISOString(),
      status: 'contract_signed',
      rcv: 15200,
      acv: 9800,
      depreciation: 5400,
      deductible: 1000,
      supplementAmount: 1200,
      totalCollected: 7600
    }
  },
  {
    id: 'PRJ-1005',
    repName: 'Tom Nails',
    createdAt: new Date(Date.now() - 60 * 86400000).toISOString(),
    status: 'completed',
    customer: {
      id: 'CUST-841',
      firstName: 'Michael',
      lastName: 'Scott',
      phone: '(555) 456-7890',
      email: 'mscott@dundermifflin.com',
      address: '1725 Slough Avenue',
      city: 'Scranton',
      state: 'PA',
      zip: '18501'
    },
    damageReport: {
      id: 'DR-1005',
      inspectionDate: new Date(Date.now() - 58 * 86400000).toISOString(),
      inspectorName: 'Tom Nails',
      roofAgeEstimate: 5,
      roofType: 'Metal',
      testSquares: [
        { id: 'ts-10', slope: 'Front', hailHits: 40, windDamagedShingles: 0 }
      ],
      collateralDamage: ['siding', 'gutters', 'ac_unit'],
      notes: 'Severe cosmetic and functional damage to metal panels from golf-ball sized hail.',
      photosUploaded: 64
    },
    claim: {
      id: 'CLM-1005',
      insuranceCompany: 'Liberty Mutual',
      claimNumber: 'LM-998811',
      policyNumber: 'POL-000123',
      dateOfLoss: new Date(Date.now() - 65 * 86400000).toISOString(),
      status: 'completed',
      rcv: 32000,
      acv: 28000,
      depreciation: 4000,
      deductible: 5000,
      supplementAmount: 4500,
      totalCollected: 16000
    }
  },
  {
    id: 'PRJ-1006',
    repName: 'Sarah Closer',
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    status: 'inspection',
    customer: {
      id: 'CUST-842',
      firstName: 'Pam',
      lastName: 'Beesly',
      phone: '(555) 567-8901',
      email: 'pam.art@example.com',
      address: '8912 Linden Court',
      city: 'Scranton',
      state: 'PA',
      zip: '18504'
    }
  },
  {
    id: 'PRJ-1007',
    repName: 'David Roofer',
    createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
    status: 'contract_signed',
    customer: {
      id: 'CUST-843',
      firstName: 'Jim',
      lastName: 'Halpert',
      phone: '(555) 678-9012',
      email: 'jhalpert@example.com',
      address: '2242 Mulberry Rd',
      city: 'Scranton',
      state: 'PA',
      zip: '18503'
    },
    damageReport: {
      id: 'DR-1007',
      inspectionDate: new Date(Date.now() - 14 * 86400000).toISOString(),
      inspectorName: 'David Roofer',
      roofAgeEstimate: 18,
      roofType: '3-Tab Asphalt',
      testSquares: [
        { id: 'ts-11', slope: 'Back', hailHits: 0, windDamagedShingles: 25 },
        { id: 'ts-12', slope: 'Left', hailHits: 0, windDamagedShingles: 18 }
      ],
      collateralDamage: [],
      notes: 'Straight-line wind damage. Entire slopes unsealed.',
      photosUploaded: 22
    },
    claim: {
      id: 'CLM-1007',
      insuranceCompany: 'USAA',
      claimNumber: 'USAA-7741',
      policyNumber: 'POL-998811',
      dateOfLoss: new Date(Date.now() - 20 * 86400000).toISOString(),
      status: 'contract_signed',
      rcv: 14500,
      acv: 8000,
      depreciation: 6500,
      deductible: 1000,
      supplementAmount: 0,
      totalCollected: 0
    }
  },
  {
    id: 'PRJ-1008',
    repName: 'Mike Builder',
    createdAt: new Date(Date.now() - 90 * 86400000).toISOString(),
    status: 'completed',
    customer: {
      id: 'CUST-844',
      firstName: 'Dwight',
      lastName: 'Schrute',
      phone: '(555) 789-0123',
      email: 'beets@schrute.com',
      address: 'Schrute Farms Rd',
      city: 'Honesdale',
      state: 'PA',
      zip: '18431'
    },
    damageReport: {
      id: 'DR-1008',
      inspectionDate: new Date(Date.now() - 88 * 86400000).toISOString(),
      inspectorName: 'Mike Builder',
      roofAgeEstimate: 30,
      roofType: 'Slate',
      testSquares: [
        { id: 'ts-13', slope: 'Front', hailHits: 15, windDamagedShingles: 5 }
      ],
      collateralDamage: ['gutters'],
      notes: 'Historic slate roof. Took heavy damage from winter storm.',
      photosUploaded: 45
    },
    claim: {
      id: 'CLM-1008',
      insuranceCompany: 'Farmers',
      claimNumber: 'FRM-99182',
      policyNumber: 'POL-33211',
      dateOfLoss: new Date(Date.now() - 100 * 86400000).toISOString(),
      status: 'completed',
      rcv: 45000,
      acv: 45000,
      depreciation: 0,
      deductible: 5000,
      supplementAmount: 8200,
      totalCollected: 45000 // Paid in full
    }
  }
];
