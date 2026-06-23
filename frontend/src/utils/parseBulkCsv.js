const stripBom = (text) => text.replace(/^\uFEFF/, '');

const splitCsvLine = (line, delimiter = ',') => {
  if (delimiter === '\t') {
    return line.split('\t').map((s) => stripBom(s).trim());
  }

  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (ch === delimiter && !inQuotes) {
      result.push(stripBom(current).trim());
      current = '';
      continue;
    }
    current += ch;
  }
  result.push(stripBom(current).trim());
  return result;
};

const detectDelimiter = (line) => {
  const counts = {
    '\t': (line.match(/\t/g) || []).length,
    ',': (line.match(/,/g) || []).length,
    ';': (line.match(/;/g) || []).length,
  };
  const best = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  return best[1] > 0 ? best[0] : ',';
};

const splitLine = (line, delimiter) => {
  const clean = stripBom(line).trim();
  if (!clean) return [];
  return splitCsvLine(clean, delimiter);
};

const normalizeHeader = (h) =>
  stripBom(h)
    .toLowerCase()
    .replace(/\(.*?\)/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const headerMatches = (header, aliases) =>
  aliases.some((alias) => header === alias || header.startsWith(`${alias} `));

const COLUMN_ALIASES = {
  institute: ['institute'],
  academicDepartment: ['department', 'dept'],
  graduationYear: ['graduation year', 'graduationyear', 'grad year', 'batch year', 'year'],
  division: ['division', 'section'],
  enrollmentNumber: ['enrollment number', 'enrollment no', 'enrollment', 'enrolment number'],
  displayName: ['name', 'student name'],
  email: ['parul mail id', 'email', 'mail id', 'university email'],
  mobile: ['mobile number', 'mobile', 'phone', 'phone number'],
  leetcodeUsername: ['leetcode', 'leetcode username', 'leetcode url', 'leetcode profile'],
};

const mapHeaders = (headerCells) => {
  const normalized = headerCells.map((h) => normalizeHeader(h.replace(/^"|"$/g, '')));
  const indexByField = {};

  for (const [field, aliases] of Object.entries(COLUMN_ALIASES)) {
    const idx = normalized.findIndex((h) => headerMatches(h, aliases));
    if (idx >= 0) indexByField[field] = idx;
  }

  const hasNewFormat =
    indexByField.displayName != null &&
    indexByField.leetcodeUsername != null &&
    (indexByField.enrollmentNumber != null || indexByField.email != null);

  if (hasNewFormat) return indexByField;

  const legacyName = normalized.findIndex((h) => h === 'name' || h.startsWith('name '));
  const legacyUser = normalized.findIndex(
    (h) => h.includes('leetcode') || h.includes('username')
  );
  if (legacyName >= 0 && legacyUser >= 0) {
    const legacyDiv = normalized.findIndex(
      (h) => headerMatches(h, ['division', 'section'])
    );
    return {
      displayName: legacyName,
      leetcodeUsername: legacyUser,
      ...(legacyDiv >= 0 ? { division: legacyDiv } : {}),
    };
  }

  return null;
};

const cell = (parts, idx) => {
  if (idx == null || idx < 0) return '';
  return stripBom(parts[idx] ?? '')
    .replace(/^"|"$/g, '')
    .trim();
};

const parseRow = (parts, indexByField) => {
  const displayName = cell(parts, indexByField.displayName);
  const leetcodeUsername = cell(parts, indexByField.leetcodeUsername);
  const enrollmentNumber = cell(parts, indexByField.enrollmentNumber);
  const email = cell(parts, indexByField.email);

  if (!displayName && !leetcodeUsername && !enrollmentNumber) return null;

  const graduationRaw = cell(parts, indexByField.graduationYear);
  const graduationYear = graduationRaw ? Number(graduationRaw) : undefined;
  const divisionRaw = cell(parts, indexByField.division);

  const row = {
    displayName: displayName || enrollmentNumber || leetcodeUsername,
    leetcodeUsername,
    institute: cell(parts, indexByField.institute) || undefined,
    academicDepartment: cell(parts, indexByField.academicDepartment) || undefined,
    graduationYear: Number.isFinite(graduationYear) ? graduationYear : undefined,
    division: divisionRaw || undefined,
    enrollmentNumber: enrollmentNumber || undefined,
    email: email || undefined,
    mobile: cell(parts, indexByField.mobile) || undefined,
  };

  return row;
};

/** Parse CSV/text bulk enrollment input into student rows */
export const parseBulkCsv = (text) => {
  const lines = stripBom(text)
    .trim()
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (!lines.length) return [];

  const delimiter = detectDelimiter(lines[0]);
  const firstParts = splitLine(lines[0], delimiter);
  const indexByField = mapHeaders(firstParts);
  const start = indexByField ? 1 : 0;

  const rows = [];
  for (let i = start; i < lines.length; i++) {
    const parts = splitLine(lines[i], delimiter);

    if (!indexByField) {
      const positional = {
        displayName: 5,
        leetcodeUsername: 8,
        institute: 0,
        academicDepartment: 1,
        graduationYear: 2,
        division: 3,
        enrollmentNumber: 4,
        email: 6,
        mobile: 7,
      };
      const row = parseRow(parts, positional);
      if (row) rows.push(row);
      continue;
    }

    const row = parseRow(parts, indexByField);
    if (row) rows.push(row);
  }

  return rows;
};

export const SAMPLE_CSV = `Institute,Department,Graduation year,Division (optional),Enrollment number,Name,Parul mail ID,Mobile number (optional),Leetcode
PIET,IT,2027,A,2403031080119,SHINDE VAIBHAV SANJAY,2403031080119@paruluniversity.ac.in,,https://leetcode.com/u/Vaibhavx_9/
PIET,CSE,2027,,2403031080120,JANE DOE,jane@paruluniversity.ac.in,9876543210,janedoe
PIET,IT,2028,B,2403031080121,JOHN SMITH,john@paruluniversity.ac.in,,john_lc`;

export const SAMPLE_CSV_NOTES = `Optional columns:
- Division: leave empty for default section (or pick default below). If filled (e.g. A, B), students appear under that section filter.
- Mobile number: leave empty if unavailable — use consecutive commas with nothing between them.

Example with both optional fields empty:
PIET,IT,2027,,2403031080120,JANE DOE,jane@paruluniversity.ac.in,,janedoe
                              ^^ division empty          ^^ mobile empty`;
