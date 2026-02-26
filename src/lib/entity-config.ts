export interface FieldConfig {
  key: string;
  label: string;
  type: 'text' | 'email' | 'number' | 'currency' | 'date' | 'datetime' | 'select' | 'boolean' | 'longText' | 'relationship';
  required?: boolean;
  options?: string[];
  relation?: { entity: string; displayField: string };
  showInTable?: boolean;
  showInForm?: boolean;
}

export interface EntityConfig {
  name: string;
  displayName: string;
  displayNamePlural: string;
  fields: FieldConfig[];
  displayField: string;
}
