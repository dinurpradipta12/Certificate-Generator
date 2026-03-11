export interface AssessmentField {
  id: string;
  name: string;
}

export interface AssessmentCategory {
  id: string;
  name: string;
  fields: AssessmentField[];
}

export interface StudentData {
  id: string;
  name: string;
  program: string;
  certId: string;
  periode: string;
  scores: Record<string, number>; // fieldId -> score
  categoryAverages: Record<string, number>; // categoryId -> average
  finalAverage: number;
  grade: string;
  description: string;
}

export interface CustomFont {
  id: string;
  name: string;
  data: string; // base64
}

export interface CertificateField {
  id: string;
  label: string;
  type: 'name' | 'average' | 'grade' | 'description' | 'date' | 'custom' | 'category_avg' | 'program' | 'certId' | 'periode';
  categoryId?: string; // For category_avg type
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  fontSize: number;
  color: string;
  bold: boolean;
  fontFamily: string;
  align: 'left' | 'center' | 'right';
  page: 1 | 2;
}

export interface AppConfig {
  defaultProgramName?: string;
  assessmentCategories: AssessmentCategory[];
  certificateFields: CertificateField[];
  customFonts: CustomFont[];
  templateImages: {
    page1: string | null;
    page2: string | null;
  };
}
