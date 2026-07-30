export function getNestedValue(obj: any, path: string): unknown {
  return path.split('.').reduce((acc, part) => (acc != null ? acc[part] : undefined), obj);
}
