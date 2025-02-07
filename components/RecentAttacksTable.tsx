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
      { header: "Timestamp", accessorKey: "timestamp" },
      { header: "IP Address", accessorKey: "ipAddress" },
      { header: "Attack Type", accessorKey: "attackType" },
      { header: "Request Path", accessorKey: "requestPath" },
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
  });

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-all duration-300 hover:shadow-lg w-full overflow-x-auto">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4 text-center">
          Recent Attacks
        </h2>
        {/* Satu container untuk scrollable table yang stretched ke full card */}
        <div className="relative overflow-x-auto custom-scrollbar max-h-[400px]">
          <table className="min-w-full table-fixed border-collapse text-sm">
            <colgroup>
              <col className="w-1/4" />
              <col className="w-1/4" />
              <col className="w-1/4" />
              <col className="w-1/4" />
            </colgroup>
            <thead className="sticky top-0 z-10 bg-gradient-to-r from-blue-100 to-blue-200 dark:bg-gradient-to-r dark:from-gray-600 dark:to-gray-700 shadow">
              <tr>
                {table.getHeaderGroups()[0].headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-4 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider border border-gray-200 dark:border-gray-600 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div className="flex items-center space-x-1">
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                      {header.column.getIsSorted() && (
                        <span className="text-xs text-gray-400">
                          {header.column.getIsSorted() === "asc" ? "▲" : "▼"}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800">
              {table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="px-4 py-2 text-left border border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200"
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

      {/* Custom Scrollbar Styles */}
      <style jsx>{`
        /* Webkit browsers */
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        .custom-scrollbar:hover::-webkit-scrollbar {
          opacity: 1;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(100, 100, 100, 0.5);
          border-radius: 4px;
          border: 2px solid transparent;
          background-clip: content-box;
        }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb {
          background-color: rgba(100, 100, 100, 0.8);
        }
        /* Firefox */
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: rgba(100, 100, 100, 0.5) transparent;
        }
        .custom-scrollbar:hover {
          scrollbar-color: rgba(100, 100, 100, 0.8) transparent;
        }
      `}</style>
    </>
  );
}
