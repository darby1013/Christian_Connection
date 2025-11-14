import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreHorizontal } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export default function EnterpriseTable({ 
  columns, 
  data, 
  onRowClick,
  actions = []
}) {
  return (
    <div className="rounded-xl border border-slate-700/50 overflow-hidden bg-slate-900/30">
      <Table>
        <TableHeader>
          <TableRow className="border-slate-700/50 hover:bg-slate-800/30">
            {columns.map((col, idx) => (
              <TableHead key={idx} className="text-slate-300 font-bold text-xs uppercase tracking-wider">
                {col.header}
              </TableHead>
            ))}
            {actions.length > 0 && <TableHead className="w-12"></TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, rowIdx) => (
            <TableRow 
              key={rowIdx} 
              className="border-slate-800/30 hover:bg-slate-800/30 cursor-pointer transition-colors"
              onClick={() => onRowClick?.(row)}
            >
              {columns.map((col, colIdx) => (
                <TableCell key={colIdx} className="text-slate-300 font-medium">
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </TableCell>
              ))}
              {actions.length > 0 && (
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-slate-800 border-slate-700">
                      {actions.map((action, idx) => (
                        <DropdownMenuItem 
                          key={idx} 
                          onClick={() => action.onClick(row)}
                          className="text-slate-300 hover:text-white hover:bg-slate-700 cursor-pointer"
                        >
                          {action.icon && <action.icon className="w-4 h-4 mr-2" />}
                          {action.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}