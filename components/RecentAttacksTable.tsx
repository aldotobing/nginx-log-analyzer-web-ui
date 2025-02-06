import React from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type SortingState,
} from "@tanstack/react-table";

interface RecentAttacksTableProps {
  data: Array<{
    timestamp: string;
    ipAddress: string;
    attackType: string;
    requestPath: string;
  }>;
}

export function RecentAttacksTable({ data }: RecentAttacksTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([]);

  const columns = React.useMemo(
    () => [
      {
        header: "Timestamp",
        accessorKey: "timestamp",
      },
      {
        header: "IP Address",
        accessorKey: "ipAddress",
      },
      {
        header: "Attack Type",
        accessorKey: "attackType",
      },
      {
        header: "Request Path",
        accessorKey: "requestPath",
      },
    ],
    []
  );

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 transition-all duration-300 hover:shadow-xl w-full overflow-hidden">
      <h2 className="text-2xl font-semibold text-blue-600 dark:text-blue-400 mb-6 text-center">
        Recent Attacks
      </h2>

      {/* Table container inside the same card */}
      <div className="overflow-hidden rounded-lg shadow-md border border-gray-200 dark:border-gray-700 w-full">
        {/* Table headers */}
        <table className="w-full table-auto text-sm">
          <thead className="bg-gradient-to-r from-blue-100 to-blue-200 dark:bg-gradient-to-r dark:from-blue-600 dark:to-blue-700">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider border-b border-gray-300 dark:border-gray-600 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-500"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div className="flex items-center justify-between">
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                      <span className="ml-2 text-xs text-gray-400">
                        {header.column.getIsSorted()
                          ? header.column.getIsSorted() === "asc"
                            ? "🔼"
                            : "🔽"
                          : null}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
        </table>

        {/* Scrollable container for the table */}
        <div className="max-h-[400px] overflow-y-auto scrollbar-custom">
          <table className="w-full table-auto text-sm">
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="hover:bg-blue-50 dark:hover:bg-blue-700 transition-colors duration-300"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-200"
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
