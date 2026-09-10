import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as XLSX from 'xlsx';
import { parse } from 'csv-parse/sync';

interface ParsedExpense {
  date: string;
  description: string;
  amount: number; // in minor units
  currency: string;
  category?: string;
  paidBy?: string;
}

@Injectable()
export class ImportsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Parse and import expenses from an uploaded file. */
  async importFile(
    userId: string,
    file: Express.Multer.File,
    groupId?: string,
  ): Promise<{ imported: number; skipped: number; errors: string[] }> {
    const ext = file.originalname.split('.').pop()?.toLowerCase();
    let parsed: ParsedExpense[];

    switch (ext) {
      case 'csv':
        parsed = this.parseCsv(file.buffer);
        break;
      case 'xlsx':
      case 'xls':
        parsed = this.parseExcel(file.buffer);
        break;
      default:
        throw new BadRequestException(
          `Unsupported format: .${ext}. Supported: .csv, .xlsx, .xls`,
        );
    }

    if (parsed.length === 0) {
      throw new BadRequestException('No valid expenses found in file');
    }

    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (let i = 0; i < parsed.length; i++) {
      const row = parsed[i];
      try {
        if (!row.description || !row.amount || row.amount <= 0) {
          skipped++;
          errors.push(`Row ${i + 1}: missing description or invalid amount`);
          continue;
        }

        await this.prisma.expense.create({
          data: {
            description: row.description,
            amount: row.amount,
            currency: row.currency || 'INR',
            category: row.category || null,
            date: row.date ? new Date(row.date) : new Date(),
            splitMethod: 'EQUAL',
            createdById: userId,
            paidById: userId,
            groupId: groupId || null,
            splits: {
              create: [{ userId, shareAmount: row.amount }],
            },
          },
        });
        imported++;
      } catch (e) {
        skipped++;
        errors.push(`Row ${i + 1}: ${(e as Error).message}`);
      }
    }

    return { imported, skipped, errors: errors.slice(0, 20) };
  }

  /** Parse Splitwise-format CSV or generic CSV. */
  private parseCsv(buffer: Buffer): ParsedExpense[] {
    const content = buffer.toString('utf-8');
    const records = parse(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true,
    }) as Record<string, string>[];

    return records.map((row) => this.mapRow(row)).filter(Boolean) as ParsedExpense[];
  }

  /** Parse Excel file. */
  private parseExcel(buffer: Buffer): ParsedExpense[] {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet);

    return rows.map((row) => this.mapRow(row)).filter(Boolean) as ParsedExpense[];
  }

  /**
   * Map a row from CSV/Excel to a ParsedExpense.
   * Supports Splitwise format and generic columns.
   */
  private mapRow(row: Record<string, any>): ParsedExpense | null {
    // Normalize keys to lowercase
    const normalized: Record<string, string> = {};
    for (const [k, v] of Object.entries(row)) {
      normalized[k.toLowerCase().trim()] = String(v ?? '').trim();
    }

    // Try Splitwise columns first
    const description =
      normalized['description'] ||
      normalized['desc'] ||
      normalized['expense'] ||
      normalized['name'] ||
      normalized['item'];

    if (!description) return null;

    // Amount: try 'cost', 'amount', 'total'
    const amountStr =
      normalized['cost'] ||
      normalized['amount'] ||
      normalized['total'] ||
      normalized['price'];

    const amountNum = parseFloat(amountStr?.replace(/[^0-9.\-]/g, '') || '0');
    if (amountNum <= 0) return null;

    // Convert to minor units
    const amount = Math.round(amountNum * 100);

    // Date
    const dateStr =
      normalized['date'] || normalized['created'] || normalized['transaction date'];

    // Category
    const category =
      normalized['category'] || normalized['type'] || normalized['group'] || undefined;

    // Currency
    const currency =
      normalized['currency'] || normalized['currency code'] || 'INR';

    return { date: dateStr || new Date().toISOString(), description, amount, currency, category };
  }
}
