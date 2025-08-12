// papaparse.d.ts
declare module 'papaparse' {
    interface ParseResult<T> {
      data: T[];
      errors: any[];
      meta: {
        delimiter: string;
        linebreak: string;
        aborted: boolean;
        truncated: boolean;
        cursor: number;
      };
    }
  
    interface ParseConfig {
      header?: boolean;
      dynamicTyping?: boolean;
      delimiter?: string;
      skipEmptyLines?: boolean | 'greedy';
      preview?: number;
      encoding?: string;
      comments?: string | boolean;
      download?: boolean;
      complete?: (result: ParseResult<any>) => void;
      error?: (error: any) => void;
      step?: (result: ParseResult<any>, parser: any) => void;
      chunkSize?: number;
      chunk?: (result: ParseResult<any>) => void;
    }
  
    function parse<T>(input: string | File, config?: ParseConfig): void;
  
    export default {
      parse
    };
  }
  