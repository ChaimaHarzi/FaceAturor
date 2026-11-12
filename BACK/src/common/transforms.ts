import { Transform } from 'class-transformer';

/**
 * Multipart forms send arrays as repeated fields, a JSON string or a single
 * value; normalise all of them to string[].
 */
export const ToStringArray = () =>
  Transform(({ value }) => {
    if (value === undefined || value === null) return undefined;
    if (value === '') return [];
    if (Array.isArray(value)) return value.map(String);
    if (typeof value === 'string' && value.trim().startsWith('[')) {
      try {
        return (JSON.parse(value) as unknown[]).map(String);
      } catch {
        return [value];
      }
    }
    return String(value)
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean);
  });

/** Empty strings from forms become undefined so @IsOptional() applies. */
export const EmptyToUndefined = () =>
  Transform(({ value }) => (value === '' || value === null ? undefined : value));
