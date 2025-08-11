import React, { useState, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  type SortingState,
  type ColumnDef,
} from "@tanstack/react-table";
import { motion } from "framer-motion";
import { Shield, ChevronsUpDown, ChevronLeft, ChevronRight } from "lucide-react";

interface AttackEvent {
  timestamp: string;
  ipAddress: string;
  attackType: string;
  requestPath: string;
}

interface RecentAttacksTableProps {
  data: AttackEvent[];
  className?: string;
}

// Helper function to parse Nginx timestamp
const parseNginxTimestamp = (timestamp: string): Date | null => {
  const monthMap: { [key: string]: number } = {
    Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
    Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11
  };
  
  const parts = timestamp.match(/(\d{2})\/(\w{3})\/(\d{4}):(\d{2}):(\d{2}):(\d{2})/);
  if (!parts) return null;

  const [, day, month, year, hour, minute, second] = parts;
  const monthIndex = monthMap[month];

  if (monthIndex === undefined) return null;

  return new Date(Date.UTC(Number(year), monthIndex, Number(day), Number(hour), Number(minute), Number(second)));
};


export function RecentAttacksTable({ data, className = "" }: RecentAttacksTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const columns = useMemo<ColumnDef<AttackEvent>[]>(
    () => [
      {
        accessorKey: "timestamp",
        header: ({ column }) => (
          <button className="flex items-center gap-2" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Timestamp
            <ChevronsUpDown className="h-4 w-4" />
          </button>
        ),
        cell: ({ row }) => {
          const date = parseNginxTimestamp(row.getValue("timestamp"));
          return date ? <span className="font-mono text-xs">{date.toLocaleString()}</span> : "Invalid Date";
        },
      },
      {
        accessorKey: "ipAddress",
        header: "IP Address",
        cell: info => <span className="font-mono">{info.getValue<string>()}</span>,
      },
      {
        accessorKey: "attackType",
        header: "Attack Type",
        cell: info => {
          const attackType = info.getValue<string>();
          const color = attackType.includes("SQLi") ? "bg-red-500/10 text-red-500"
                      : attackType.includes("XSS") ? "bg-yellow-500/10 text-yellow-500"
                      : "bg-purple-500/10 text-purple-500";
          return <span className={`px-2 py-1 rounded-full text-xs font-medium ${color}`}>{attackType}</span>;
        }
      },
      {
        accessorKey: "requestPath",
        header: "Request Path",
        cell: info => <span className="font-mono break-all">{info.getValue<string>()}</span>,
      },
    ],
    []
  );

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 8,
      },
    },
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: { y: 10, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
    }
  };

  return (
    <div className={className}>
      <div className="p-6 pb-4 border-b border-gray-200/50 dark:border-gray-700/50">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center space-x-2">
          <Shield className="h-5 w-5 text-red-500" />
          <span>Recent Security Events</span>
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Detected threats and suspicious activities from logs.
        </p>
      </div>

      <div className="p-6">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="min-w-full text-sm">
            <thead className="border-b border-gray-200/50 dark:border-gray-700/50">
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <th key={header.id} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <motion.tbody
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {table.getRowModel().rows.map(row => (
                <motion.tr 
                  key={row.id}
                  variants={itemVariants}
                  className="border-b border-gray-200/50 dark:border-gray-700/50 hover:bg-gray-50/50 dark:hover:bg-gray-700/20"
                >
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id} className="px-4 py-3 text-gray-700 dark:text-gray-300 align-top">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </motion.tr>
              ))}
            </motion.tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4">
          <span className="text-xs text-gray-600 dark:text-gray-400">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="p-1 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="p-1 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(156, 163, 175, 0.5);
          border-radius: 3px;
        }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb {
          background-color: rgba(156, 163, 175, 0.8);
        }
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: rgba(156, 163, 175, 0.5) transparent;
        }
      `}</style>
    </div>
  );
}