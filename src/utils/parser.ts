/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Transaction, ColumnMapping } from '../types';

/**
 * Normalizes payment methods into clear standard values
 */
export function normalizePaymentMethod(method: string): string {
  const m = method.trim().toUpperCase();
  if (['DANA', 'DN'].includes(m)) return 'DANA';
  if (['GOPAY', 'GO-PAY', 'GP'].includes(m)) return 'GOPAY';
  if (['OVO', 'OV'].includes(m)) return 'OVO';
  if (['SHOPEEPAY', 'SPAY', 'SP'].includes(m)) return 'SHOPEEPAY';
  if (['LINKAJA', 'LA'].includes(m)) return 'LINKAJA';
  if (['SEABANK', 'SEA BANK', 'SEA'].includes(m)) return 'SEABANK';
  if (['BCA', 'BANK CENTRAL ASIA'].includes(m)) return 'BCA';
  if (['BRI', 'BANK RAKYAT INDONESIA'].includes(m)) return 'BRI';
  if (['BNI', 'BANK NEGARA INDONESIA'].includes(m)) return 'BNI';
  if (['MANDIRI', 'BANK MANDIRI'].includes(m)) return 'MANDIRI';
  if (['CIMB', 'CIMB NIAGA'].includes(m)) return 'CIMB';
  return m;
}

/**
 * Cleans monetary string formatted values e.g. "200,000.00" -> 200000
 */
export function parseAmountString(amountStr: string): number {
  if (!amountStr) return 0;
  // Remove currency prefixes like Rp, USD, IDR
  let cleaned = amountStr.replace(/(Rp|rp|Rp\.|IDR|USD)/g, '').trim();
  
  // Decide whether dot is decimal or thousand separator
  // Indonesian format: 200.000,00 -> we replace dots with nothing and commas with dots
  // US format: 200,000.00 -> we replace commas with nothing
  
  // Check if we have both dot and comma
  const hasComma = cleaned.includes(',');
  const hasDot = cleaned.includes('.');
  
  if (hasComma && hasDot) {
    const commaIndex = cleaned.lastIndexOf(',');
    const dotIndex = cleaned.lastIndexOf('.');
    if (commaIndex > dotIndex) {
      // Indonesian format: dots are thousands, commas are decimals 
      cleaned = cleaned.replace(/\./g, '').replace(/,/g, '.');
    } else {
      // US format: commas are thousands, dots are decimals
      cleaned = cleaned.replace(/,/g, '');
    }
  } else if (hasComma) {
    // Only commas. Check if it's thousands separator or decimal.
    // e.g. "200,000" -> thousands separator (200000)
    // "15,5" -> decimal separator (15.5)
    const afterComma = cleaned.substring(cleaned.lastIndexOf(',') + 1);
    if (afterComma.length === 3) {
      // Thousand separator
      cleaned = cleaned.replace(/,/g, '');
    } else {
      // Decimal separator
      cleaned = cleaned.replace(/,/g, '.');
    }
  } else if (hasDot) {
    // Only dots. Check if it's thousands separator or decimal.
    // e.g. "200.000" -> thousands separator (200000 in IDR format)
    // "15.50" -> decimal separator (US format)
    const afterDot = cleaned.substring(cleaned.lastIndexOf('.') + 1);
    if (afterDot.length === 3) {
      // Thousand separator (Indonesian style, like 70.000)
      cleaned = cleaned.replace(/\./g, '');
    } else {
      // Decimal separator or single thousands separator in large numbers
      // e.g. 1.500.000 is multiple dots. If multiple dots are present, they are thousands!
      const dotCount = (cleaned.match(/\./g) || []).length;
      if (dotCount > 1) {
        cleaned = cleaned.replace(/\./g, '');
      } else {
        // Just one dot. Let's see if 3 digits after dot, or 2 digits.
        if (afterDot.length === 2 || afterDot.length === 1) {
          // e.g. 150.50 -> 150.5
          // or 150.5 -> 150.5
        } else {
          // If it's e.g. "70.000" it is thousands
          cleaned = cleaned.replace(/\./g, '');
        }
      }
    }
  }
  
  const val = parseFloat(cleaned);
  return isNaN(val) ? 0 : val;
}

/**
 * Regex patterns for auto-detection scoring
 */
const PATTERNS = {
  pastedIndex: /^\d+$/,
  uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  dateTime: /^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}$/,
  accountNumber: /^\d{10,20}$|^\d{4}\d{4}\d{4}\d{4}$|^08\d{9,12}$/, // Includes Indo phone numbers 
  paymentMethod: /^(BCA|BNI|BRI|MANDIRI|DANA|GOPAY|OVO|LINKAJA|SEABANK|CIMB|PERMATA|ALFAMART|INDOMARET)$/i,
  status: /^(wait\sfor\spayment|success|failed|pending|paid|expired|processing|batal|cancel|proses|settled|settlement)$/i,
  trxCode: /^[A-Z0-9]+-[A-Z0-9]+$|^[A-Z0-9]{8,15}$/i, // LGBDT-MW727604 style or long alphanumeric
  amountInIDR: /^\d{1,3}(,\d{3})*(\.\d{2})?$|^\d{1,3}(\.\d{3})*(,\d{2})?$/ // e.g. 200,000.00 or 70.000,00
};

/**
 * Performs column-by-column scoring to identify fields in a rectangular array of cells
 */
export function autoDetectColumns(rows: string[][]): ColumnMapping {
  // Initialize scores: index i -> field name -> weight score
  const scoreBoard: Record<keyof ColumnMapping, number[]> = {
    pastedIndex: [],
    username: [],
    fullName: [],
    accountNumber: [],
    paymentMethod: [],
    trxCode: [],
    uuid1: [],
    dateTime: [],
    amount: [],
    status: [],
    uuid2: []
  };

  if (rows.length === 0) {
    return createEmptyMapping();
  }

  const maxCols = Math.max(...rows.map(r => r.length));
  
  // Initialize score board arrays for each column
  const fields = Object.keys(scoreBoard) as (keyof ColumnMapping)[];
  fields.forEach(f => {
    scoreBoard[f] = Array(maxCols).fill(0);
  });

  // Calculate scores based on matching characteristics
  rows.forEach(row => {
    row.forEach((col, idx) => {
      if (!col) return;

      // 1. pastedIndex - matches single simple integer, usually first non-empty
      if (PATTERNS.pastedIndex.test(col)) {
        const val = parseInt(col, 10);
        if (val > 0 && val < 50000) {
          scoreBoard.pastedIndex[idx] += 3;
        }
      }

      // 2. dateTime - matches regex
      if (PATTERNS.dateTime.test(col)) {
        scoreBoard.dateTime[idx] += 6;
      }

      // 3. paymentMethod - matches Indonesian banks/wallets
      if (PATTERNS.paymentMethod.test(col) || normalizePaymentMethod(col) !== col.toUpperCase()) {
        scoreBoard.paymentMethod[idx] += 6;
      }

      // 4. status - matches payment status terms
      if (PATTERNS.status.test(col)) {
        scoreBoard.status[idx] += 6;
      }

      // 5. UUIDs
      if (PATTERNS.uuid.test(col)) {
        // Can be uuid1 or uuid2. Let's score UUIDs.
        // Usually, uuid1 comes earlier than date, uuid2 comes after status (at the very end).
        if (idx < maxCols / 2) {
          scoreBoard.uuid1[idx] += 4;
        } else {
          scoreBoard.uuid2[idx] += 4;
        }
      }

      // 6. trxCode - matches LGBDT-MW727604, LGBDT- etc
      if (PATTERNS.trxCode.test(col) && col.includes('-')) {
        scoreBoard.trxCode[idx] += 4;
      }

      // 7. accountNumber - digits of high length, or Indo phone 0812...
      if (PATTERNS.accountNumber.test(col.replace(/\s/g, ''))) {
        scoreBoard.accountNumber[idx] += 4;
      }

      // 8. Amount in IDR - is valid number formatting with decimals or thousands
      if (PATTERNS.amountInIDR.test(col) && (col.includes(',') || col.includes('.'))) {
        // Check if parsing it as float gives a substantial number (usually > 100)
        const parsed = parseAmountString(col);
        if (parsed > 100) {
          scoreBoard.amount[idx] += 5;
        }
      } else {
        // Try parsing anyways. If parsed value is > 100 and has digits only or digits with separator
        const rawNumStr = col.replace(/[^\d.,]/g, '');
        if (rawNumStr.length > 3) {
          const parsed = parseAmountString(col);
          if (parsed >= 1000 && parsed < 1000000000) {
            scoreBoard.amount[idx] += 1.5;
          }
        }
      }

      // 9. Username vs FullName
      // Username is usually single word, lowercase alphanumeric, length 3-15
      // Full name contains spaces, alphabetic, mixed casing
      if (/^[a-z0-9_]{3,18}$/i.test(col)) {
        scoreBoard.username[idx] += 2.5;
      } else if (/^[a-zA-Z]+(\s+[a-zA-Z]+)+$/.test(col)) {
        scoreBoard.fullName[idx] += 3.5;
      }
    });
  });

  // Decide mapping by matching each field to the column with the highest score
  const mapping = createEmptyMapping();
  const assignedCols = new Set<number>();

  // Resolution priority order: most unique/identifiable elements first
  const resolutionPriority: (keyof ColumnMapping)[] = [
    'dateTime',
    'status',
    'paymentMethod',
    'amount',
    'uuid1',
    'uuid2',
    'trxCode',
    'accountNumber',
    'fullName',
    'username',
    'pastedIndex'
  ];

  resolutionPriority.forEach(field => {
    let topScore = -1;
    let topColIdx = -1;

    for (let c = 0; c < maxCols; c++) {
      if (assignedCols.has(c)) continue;
      const score = scoreBoard[field][c] || 0;
      if (score > topScore && score > 0) {
        topScore = score;
        topColIdx = c;
      }
    }

    if (topColIdx !== -1) {
      mapping[field] = topColIdx;
      assignedCols.add(topColIdx);
    }
  });

  // Fallback defaults if the scoring failed to resolve some columns
  // Standard copy paste layout mapper fallback
  if (mapping.pastedIndex === -1 && maxCols > 0) {
    if (!assignedCols.has(0)) mapping.pastedIndex = 0;
  }
  if (mapping.username === -1 && maxCols > 2) {
    if (!assignedCols.has(2)) mapping.username = 2;
  }
  if (mapping.fullName === -1 && maxCols > 3) {
    if (!assignedCols.has(3)) mapping.fullName = 3;
  }
  if (mapping.accountNumber === -1 && maxCols > 4) {
    if (!assignedCols.has(4)) mapping.accountNumber = 4;
  }
  if (mapping.paymentMethod === -1 && maxCols > 5) {
    if (!assignedCols.has(5)) mapping.paymentMethod = 5;
  }
  if (mapping.trxCode === -1 && maxCols > 6) {
    if (!assignedCols.has(6)) mapping.trxCode = 6;
  }
  if (mapping.uuid1 === -1 && maxCols > 7) {
    // If we have single uuid, uuid1 is often unassigned. Keep at -1 if not scored
  }
  if (mapping.dateTime === -1 && maxCols > 8) {
    if (!assignedCols.has(8)) mapping.dateTime = 8;
  }
  if (mapping.amount === -1 && maxCols > 10) {
    if (!assignedCols.has(10)) mapping.amount = 10;
  }
  if (mapping.status === -1 && maxCols > 11) {
    if (!assignedCols.has(11)) mapping.status = 11;
  }
  if (mapping.uuid2 === -1 && maxCols > 12) {
    if (!assignedCols.has(12)) mapping.uuid2 = 12;
  }

  // Double check duplicates. Ensure everything goes to distinct columns
  return mapping;
}

function createEmptyMapping(): ColumnMapping {
  return {
    pastedIndex: -1,
    username: -1,
    fullName: -1,
    accountNumber: -1,
    paymentMethod: -1,
    trxCode: -1,
    uuid1: -1,
    dateTime: -1,
    amount: -1,
    status: -1,
    uuid2: -1
  };
}

/**
 * Splits raw pasted text into a 2D grid of elements
 */
export function textToGrid(text: string): string[][] {
  const lines = text.split(/\r?\n/);
  const grid: string[][] = [];

  for (let line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    let cols: string[] = [];
    if (trimmed.includes('\t')) {
      cols = trimmed.split('\t').map(c => c.trim());
    } else {
      // split by 2 or more spaces
      cols = trimmed.split(/\s{2,}/).map(c => c.trim());
    }
    
    // Clean trailing empty spaces or empty columns (except the ones in middle)
    if (cols.length > 0) {
      grid.push(cols);
    }
  }

  return grid;
}

/**
 * Parses a 2D grid according to a specific column mapping
 */
export function parseGridWithMapping(grid: string[][], mapping: ColumnMapping): Transaction[] {
  return grid.map((cols, index) => {
    const getField = (mapIdx: number): string => {
      if (mapIdx === -1 || mapIdx >= cols.length) return '';
      return cols[mapIdx] || '';
    };

    const rawIndexStr = getField(mapping.pastedIndex);
    const parsedInd = parseInt(rawIndexStr, 10);
    const pastedIndex = isNaN(parsedInd) ? (index + 1) : parsedInd;

    const rawAmount = getField(mapping.amount);
    // If nominal is empty/missing, parseAmountString automatically returns 0
    const amount = parseAmountString(rawAmount);

    return {
      id: `m-trx-${index}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      pastedIndex,
      username: getField(mapping.username) || `user-${pastedIndex}`,
      fullName: getField(mapping.fullName) || 'No Name',
      accountNumber: getField(mapping.accountNumber) || '-',
      paymentMethod: normalizePaymentMethod(getField(mapping.paymentMethod)) || 'Lainnya',
      trxCode: getField(mapping.trxCode) || '', // Keep it empty empty instead of '-' if it doesn't exist
      uuid1: getField(mapping.uuid1) || '-',
      dateTime: getField(mapping.dateTime) || new Date().toISOString().slice(0, 19).replace('T', ' '),
      amount: amount,
      status: getField(mapping.status).trim() || 'wait for payment',
      uuid2: getField(mapping.uuid2) || '-',
      rawLine: cols.join('\t')
    };
  });
}

/**
 * Super robust parsing method. Tries to auto detect AND parse,
 * but falls back immediately to safe values if columns are sparse.
 * Enforces:
 * 1. Filter only status "wait for payment"
 * 2. Ignore dry transactions (or other statuses)
 * 3. Ignore if Third ID is empty
 * 4. Remove duplicate entries based on Third ID
 */
export function parsePastedText(text: string, customMapping?: ColumnMapping): Transaction[] {
  const grid = textToGrid(text);
  if (grid.length === 0) return [];

  const mapping = customMapping || autoDetectColumns(grid);
  const rawTransactions = parseGridWithMapping(grid, mapping);

  // 1. Filter: "wait for payment" only, ignore empty Third IDs, handle nominal (which is already 0 if empty)
  const filtered = rawTransactions.filter(t => {
    // Jika Third ID (trxCode) kosong: abaikan data
    const thirdId = t.trxCode.trim();
    if (!thirdId || thirdId === '-' || thirdId === '') {
      return false;
    }

    // Jika status bukan: "wait for payment", jangan ditampilkan
    const status = t.status.trim().toLowerCase();
    if (status !== 'wait for payment') {
      return false;
    }

    return true;
  });

  // 2. Hilangkan data duplikat berdasarkan Third ID
  const uniqueList: Transaction[] = [];
  const seenThirdIds = new Set<string>();

  for (const item of filtered) {
    const normId = item.trxCode.trim().toLowerCase();
    if (!seenThirdIds.has(normId)) {
      seenThirdIds.add(normId);
      uniqueList.push(item);
    }
  }

  return uniqueList;
}

/**
 * Default sample text to display for demo or onboarding purposes
 */
export const DEFAULT_SAMPLE_TEXT = `7\t\tsemogahoki1221\tifnu juliawan\t081264183559\tDANA\tLGBDT-MW727604\t019eea3f-1a8c-72c6-9ecc-80501474a2a5\t2026-06-21 19:54:25\t-\t200,000.00\twait for payment\tfa660f3a-c4e0-4e91-9b0b-e8990d1e6379\t
8\t\tfmsaja\tRudi pratono\t680401034271532\tBRI\tLGBDT-MW722170\t019ee5c9-ed40-72d6-91e7-327ce626e4ca\t2026-06-20 23:07:56\t-\t3,000,000.00\twait for payment\t73abd04a-1203-4613-97f9-cf602f59cb45\t
9\t\tfanloxx\tmaulana alfan nashrullah\t901117812947\tSEABANK\tLGBDT-MW716849\t019ee168-0edf-7160-915f-94b2f4ba746a\t2026-06-20 02:42:34\t-\t5,800,000.00\twait for payment\t60e4caf8-b658-49ee-80cd-d561742fb980\t
10\t\tpanda29\tRokki Azisia Rachman\t2454088378\tBCA\tLGBDT-MW711080\t019edde8-2420-700f-ac74-be8ff6d8f5cf\t2026-06-19 10:23:59\t-\t2,178,000.00\twait for payment\tc634b8a5-e1d5-425e-a49b-d431076f0bc4\t
11\t\tmitra91\tDiki fikriansyah\t085294941153\tDANA\tLGBDT-MW469961\t019e56ba-108e-7147-8f6e-b85edb00de99\t2026-05-24 04:24:55\t-\t70,000.00\twait for payment\t8447e79b-fe90-45f9-a7e0-9488e7eb4151\t
12\t\tokiww99\toki wahyu wijayanto\t082385501048\tDANA\tLGBDT-MW469796\t-\t2026-05-24 03:58:07\t-\t157,000.00\twait for payment\tfd9e5056-8fda-40aa-ab6e-f6ff16d366ad\t
13\t\tmbetu123\theru susanto\t082328282729\tDANA\tLGBDT-MW468994\t019e5637-9157-7131-9298-a9b512d2445d\t2026-05-24 02:02:23\t-\t110,000.00\twait for payment\ta2e1d1f8-2c5c-491a-947f-3c51cb538bd6\t
14\t\tsidsinghong\tDwi Siswoyo\t2039922824\tBNI\tLGBDT-MW468991\t019e5637-8da0-72c9-bef5-4aa96b7139b3\t2026-05-24 02:02:22\t-\t80,000.00\twait for payment\t09d18bf3-e48f-4a54-9003-e9841635b45f\t
15\t\tsupriadi003\tSupriadi\t081351954122\tDANA\tLGBDT-MW468992\t019e5637-8ee4-71da-9f34-c0b4c290dd47\t2026-05-24 02:02:22\t-\t300,000.00\twait for payment\t5fd5a70c-23e6-4c83-9643-9646bb9a4bbc\t
16\t\ttunggek14\trozi januarta\t082170103421\tGOPAY\tLGBDT-MW448686\t019e4b8f-c508-71a7-a5a8-6d493426aa8b\t2026-05-22 00:22:54\t-\t200,000.00\twait for payment\t24c3ea71-81ab-45af-b470-04a1257143d5\t
17\t\tbandit101\tAnggono\t087776216936\tGOPAY\tLGBDT-MW448685\t019e4b8f-c3c9-721e-a74b-d1eca1f53ff3\t2026-05-22 00:22:53 \t-\t780,000.00\twait for payment\t1d3db302-a8c2-47a5-aa2b-9eb860227e6c\t`;
