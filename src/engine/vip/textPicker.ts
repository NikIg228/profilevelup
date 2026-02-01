import { AgeGroupKey } from '../../types/payload';
import textModulesData from '../../data/text_modules.json';

export type ModuleName = 'motivation' | 'activation' | 'communication' | 'expression' | 'confidence';

export function getBand(value: number): 'L' | 'M' | 'R' {
  if (value <= 35) return 'L';
  if (value <= 64) return 'M';
  return 'R';
}

// Type matching the JSON structure
type TextModules = {
  ageGroups: Record<string, Record<string, Record<string, string>>>;
};

const modules = textModulesData as TextModules;

export function pickText(ageGroup: AgeGroupKey, moduleName: ModuleName, value: number): string {
  const band = getBand(value);
  
  const groupData = modules.ageGroups[ageGroup];
  if (!groupData) return '';

  const moduleData = groupData[moduleName];
  if (!moduleData) return '';

  return moduleData[band] || '';
}

