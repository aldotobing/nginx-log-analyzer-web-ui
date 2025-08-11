import React, { useState, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  flexRender,
  type SortingState,
  type ColumnDef,
} from "@tanstack/react-table";
import { motion } from "framer-motion";
import { Shield, ChevronsUpDown, ChevronLeft, ChevronRight, Search, X } from "lucide-react";

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

// Helper function to format relative time
const formatRelativeTime = (date: Date): string => {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  return `${Math.floor(diffInSeconds / 86400)}d ago`;
};

export function RecentAttacksTable({ data, className = "" }: RecentAttacksTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<any[]>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  
  // Get unique attack types for filter dropdown
  const attackTypes = useMemo(() => {
    return Array.from(new Set(data.map(item => item.attackType)));
  }, [data]);
  
  // Get unique IP addresses for filter dropdown
  const ipAddresses = useMemo(() => {
    return Array.from(new Set(data.map(item => item.ipAddress)));
  }, [data]);

  const columns = useMemo<ColumnDef<AttackEvent>[]>(
    () => [
      {
        accessorKey: "timestamp",
        header: ({ column }) => (
          <button 
            className="flex items-center gap-2 text-left w-full group" 
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            <span>Timestamp</span>
            <ChevronsUpDown className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        ),
        cell: ({ row }) => {
          const date = parseNginxTimestamp(row.getValue("timestamp"));
          if (!date) return <span className="text-gray-500">Invalid Date</span>;
          
          return (
            <div className="flex flex-col">
              <span className="font-medium text-gray-900 dark:text-white">
                {date.toLocaleDateString()}
              </span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-gray-500 dark:text-gray-400">
                  {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span className="text-xs px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-500 dark:text-gray-400">
                  {formatRelativeTime(date)}
                </span>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "ipAddress",
        header: "IP Address",
        cell: info => (
          <span className="font-mono px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm">
            {info.getValue<string>()}
          </span>
        ),
        filterFn: (row, id, value) => {
          return value.includes(row.getValue(id));
        }
      },
      {
        accessorKey: "attackType",
        header: "Attack Type",
        cell: info => {
          const attackType = info.getValue<string>();
          const color = attackType.includes("SQLi") 
            ? "bg-red-500/10 text-red-500 border border-red-500/20"
            : attackType.includes("XSS") 
            ? "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20"
            : "bg-purple-500/10 text-purple-500 border border-purple-500/20";
          
          return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${color}`}>
              {attackType}
            </span>
          );
        },
        filterFn: (row, id, value) => {
          return value.includes(row.getValue(id));
        }
      },
      {
        accessorKey: "requestPath",
        header: "Request Path",
        cell: info => (
          <span 
            className="font-mono text-sm break-all max-w-xs md:max-w-md truncate block"
            title={info.getValue<string>()}
          >
            {info.getValue<string>()}
          </span>
        ),
        filterFn: "includesString"
      },
    ],
    []
  );

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    initialState: {
      pagination: {
        pageSize: 8,
      },
      sorting: [
        {
          id: "timestamp",
          desc: true,
        },
      ],
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

  // Get current filters
  const attackTypeFilter = table.getColumn("attackType")?.getFilterValue() as string[] || [];
  const ipAddressFilter = table.getColumn("ipAddress")?.getFilterValue() as string[] || [];

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200/50 dark:border-gray-700/50 overflow-hidden ${className}`}>
      <div className="p-6 pb-4 border-b border-gray-200/50 dark:border-gray-700/50">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center space-x-2">
          <Shield className="h-5 w-5 text-red-500" />
          <span>Recent Security Events</span>
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Detected threats and suspicious activities from logs.
        </p>
      </div>

      {/* Filter Controls */}
      <div className="px-6 py-4 border-b border-gray-200/50 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-700/30">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Global Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search request paths..."
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition-all"
              value={globalFilter ?? ""}
              onChange={(e) => setGlobalFilter(e.target.value)}
            />
            {globalFilter && (
              <button
                onClick={() => setGlobalFilter("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 md:gap-3">
            {/* Attack Type Filter */}
            <div className="w-full sm:w-48">
              <div className="relative">
                <select
                  className="w-full py-2.5 px-3 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm appearance-none transition-all"
                  value={attackTypeFilter[0] || ""}
                  onChange={(e) => {
                    const value = e.target.value;
                    table.getColumn("attackType")?.setFilterValue(value ? [value] : undefined);
                  }}
                >
                  <option value="">All Attack Types</option>
                  {attackTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                  <ChevronsUpDown className="h-4 w-4 text-gray-400" />
                </div>
              </div>
            </div>
            
            {/* IP Address Filter */}
            <div className="w-full sm:w-48">
              <div className="relative">
                <select
                  className="w-full py-2.5 px-3 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm appearance-none transition-all"
                  value={ipAddressFilter[0] || ""}
                  onChange={(e) => {
                    const value = e.target.value;
                    table.getColumn("ipAddress")?.setFilterValue(value ? [value] : undefined);
                  }}
                >
                  <option value="">All IP Addresses</option>
                  {ipAddresses.map((ip) => (
                    <option key={ip} value={ip}>
                      {ip}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                  <ChevronsUpDown className="h-4 w-4 text-gray-400" />
                </div>
              </div>
            </div>
            
            {/* Clear Filters Button */}
            {(attackTypeFilter.length > 0 || ipAddressFilter.length > 0 || globalFilter) && (
              <div className="flex items-center">
                <button
                  onClick={() => {
                    setGlobalFilter("");
                    table.getColumn("attackType")?.setFilterValue(undefined);
                    table.getColumn("ipAddress")?.setFilterValue(undefined);
                  }}
                  className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200/50 dark:hover:bg-gray-700/50 px-3 py-2.5 rounded-lg transition-colors"
                >
                  <X className="h-4 w-4" />
                  <span>Clear filters</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="min-w-full text-sm">
            <thead className="border-b border-gray-200/50 dark:border-gray-700/50">
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <th 
                      key={header.id} 
                      className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                    >
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
              {table.getRowModel().rows.length ? (
                table.getRowModel().rows.map(row => (
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
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length} className="text-center py-8 text-gray-500 dark:text-gray-400">
                    No security events found matching your filters
                  </td>
                </tr>
              )}
            </motion.tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
          <span className="text-xs text-gray-600 dark:text-gray-400">
            Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{" "}
            {Math.min(
              (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
              table.getFilteredRowModel().rows.length
            )} of {table.getFilteredRowModel().rows.length} events
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="p-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="flex items-center">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
              </span>
            </div>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="p-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
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