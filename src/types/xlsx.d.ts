declare module 'xlsx' {
  export interface WorkBook {
    SheetNames: string[];
    Sheets: { [sheet: string]: WorkSheet };
  }
  
  export interface WorkSheet {
    [key: string]: any;
  }
  
  export interface ParsingOptions {
    type?: 'base64' | 'binary' | 'buffer' | 'file' | 'array' | 'string';
    raw?: boolean;
  }
  
  export interface Sheet2JSONOpts {
    header?: 'A' | number | string[] | 1;
    dateNF?: string;
    defval?: any;
    blankrows?: boolean;
    raw?: boolean;
    rawNumbers?: boolean;
  }
  
  export function read(data: any, opts?: ParsingOptions): WorkBook;
  
  export const utils: {
    sheet_to_json<T = any>(worksheet: WorkSheet, opts?: Sheet2JSONOpts): T[];
    json_to_sheet<T>(data: T[], opts?: any): WorkSheet;
    aoa_to_sheet<T>(data: T[][], opts?: any): WorkSheet;
    book_new(): WorkBook;
    book_append_sheet(workbook: WorkBook, worksheet: WorkSheet, name?: string): void;
  };
  
  export function writeFile(workbook: WorkBook, filename: string, opts?: any): void;
}
