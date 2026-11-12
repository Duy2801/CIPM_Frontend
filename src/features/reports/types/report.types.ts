export interface ReportType {
  id: string;
  name: string;
  custom?: boolean;
}

export interface ReportFile {
  id: string;
  typeId?: string;
  name: string;
  size: number;
  uploadedAt: number;
  uploadedBy: string;
}

export interface StoredReportFile extends ReportFile {
  blob: Blob;
}
