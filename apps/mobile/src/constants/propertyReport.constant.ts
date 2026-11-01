import { PropertyReportCategory } from '../enums/propertyReportCategory.enum';

export const MOBILE_PROPERTY_REPORT_LABELS: Record<PropertyReportCategory, string> = {
  [PropertyReportCategory.UNSAFE]: 'Safety concern',
  [PropertyReportCategory.FALSE_LISTING]: 'Details are inaccurate',
  [PropertyReportCategory.PRICE_MISMATCH]: 'Price does not match',
  [PropertyReportCategory.UNRESPONSIVE_LANDLORD]: 'No landlord response',
  [PropertyReportCategory.OTHER]: 'Other issue',
};
