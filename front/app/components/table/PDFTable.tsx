// components/table/PDFTable.tsx
'use client';

import React, { JSX } from 'react';

type CellContent = string | number | JSX.Element;

type TableCell = CellContent | {
  content: CellContent;
  props?: React.TdHTMLAttributes<HTMLTableCellElement>;
};

interface PDFTableProps {
  headers?: string[];
  rows: TableCell[][];
  className?: string;
  striped?: boolean;
}

const PDFTable = ({ headers, rows, className = '', striped = true }: PDFTableProps) => {
  return (
    <table
      className={`w-full text-[12px] text-neutral-900 rounded-md overflow-hidden ${className}`}
      style={{ borderCollapse: 'separate', borderSpacing: '0', tableLayout: 'auto' }}
    >
      {headers && (
        <thead>
          <tr className="bg-slate-100 text-neutral-800">
            {headers.map((header, i) => (
              <th
                key={i}
                className="border border-slate-200 px-2 py-1 font-semibold text-center whitespace-nowrap"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
      )}
      <tbody>
        {rows.map((row, ri) => (
          <tr
            key={ri}
            className={striped && ri % 2 !== 0 ? 'bg-slate-50' : 'bg-white'}
          >
            {row.map((cell, ci) => {
              const isObj = typeof cell === 'object' && !React.isValidElement(cell);
              const content = isObj ? (cell as { content: CellContent }).content : cell;
              const props =
                isObj && 'props' in (cell as object)
                  ? (cell as { props?: React.TdHTMLAttributes<HTMLTableCellElement> }).props
                  : {};
              return (
                <td
                  key={ci}
                  className="border border-slate-200 px-2 py-1 align-top whitespace-pre-line text-neutral-900 text-center"
                  {...props}
                >
                  {content}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default PDFTable;