import { PropertyReportCategory } from '../enums/propertyReportCategory.enum';

export const WEB_PROPERTY_REPORT_LABELS: Record<PropertyReportCategory, string> = {
  [PropertyReportCategory.UNSAFE]: 'Safety concern',
  [PropertyReportCategory.FALSE_LISTING]: 'Listing details are inaccurate',
  [PropertyReportCategory.PRICE_MISMATCH]: 'Price does not match',
  [PropertyReportCategory.UNRESPONSIVE_LANDLORD]: 'Landlord is not responding',
  [PropertyReportCategory.OTHER]: 'Other issue',
};
