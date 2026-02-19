import React, { useState } from 'react';
import Button from './Button';

const Table = ({
  columns,
  data,
  title,
  showSearch = false,
  showPagination = false,
  itemsPerPage = 10,
  onRowClick,
  selectable = false,
  onSelectionChange,
  actions,
  loading = false,
  emptyMessage = "No data available",
  className = ''
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRows, setSelectedRows] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  // Filter data based on search term
  const filteredData = data.filter(row => {
    if (!searchTerm) return true;
    return columns.some(column => {
      const value = row[column.accessor];
      return value && value.toString().toLowerCase().includes(searchTerm.toLowerCase());
    });
  });

  // Sort data
  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortConfig.key) return 0;
    
    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];
    
    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  // Paginate data
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const paginatedData = showPagination
    ? sortedData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
    : sortedData;

  // Handle sort
  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Handle row selection
  const handleRowSelect = (rowId) => {
    setSelectedRows(prev => {
      const newSelection = prev.includes(rowId)
        ? prev.filter(id => id !== rowId)
        : [...prev, rowId];
      
      if (onSelectionChange) {
        onSelectionChange(newSelection);
      }
      
      return newSelection;
    });
  };

  // Handle select all
  const handleSelectAll = () => {
    setSelectedRows(prev => {
      const newSelection = prev.length === paginatedData.length
        ? []
        : paginatedData.map(row => row.id);
      
      if (onSelectionChange) {
        onSelectionChange(newSelection);
      }
      
      return newSelection;
    });
  };

  // Sort icon component
  const SortIcon = ({ column }) => {
    if (sortConfig.key !== column.accessor) {
      return <span className="ml-1 text-gray-300">↕️</span>;
    }
    return sortConfig.direction === 'asc' 
      ? <span className="ml-1 text-blue-600">↑</span>
      : <span className="ml-1 text-blue-600">↓</span>;
  };

  // Loading skeleton
  const SkeletonRow = () => (
    <tr className="animate-pulse">
      {selectable && (
        <td className="px-6 py-4">
          <div className="w-4 h-4 bg-gray-200 rounded"></div>
        </td>
      )}
      {columns.map((column, idx) => (
        <td key={idx} className="px-6 py-4">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </td>
      ))}
      {actions && (
        <td className="px-6 py-4">
          <div className="h-8 bg-gray-200 rounded w-16"></div>
        </td>
      )}
    </tr>
  );

  return (
    <div className={`bg-white rounded-lg border border-gray-200 overflow-hidden ${className}`}>
      {/* Table Header with Search */}
      {(title || showSearch) && (
        <div className="px-6 py-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {title && (
            <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
          )}
          
          {showSearch && (
            <div className="relative">
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
              />
              <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
            </div>
          )}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-600">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50">
            <tr>
              {/* Select All Checkbox */}
              {selectable && (
                <th className="px-6 py-3">
                  <input
                    type="checkbox"
                    checked={selectedRows.length === paginatedData.length && paginatedData.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
              )}

              {/* Column Headers */}
              {columns.map((column, index) => (
                <th
                  key={index}
                  className={`px-6 py-3 font-medium ${column.sortable !== false ? 'cursor-pointer hover:bg-gray-100' : ''}`}
                  onClick={() => column.sortable !== false && handleSort(column.accessor)}
                >
                  <div className="flex items-center">
                    {column.header}
                    {column.sortable !== false && <SortIcon column={column} />}
                  </div>
                </th>
              ))}

              {/* Actions Column */}
              {actions && <th className="px-6 py-3 font-medium">Actions</th>}
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200">
            {loading ? (
              // Loading State
              Array.from({ length: 5 }).map((_, index) => (
                <SkeletonRow key={index} />
              ))
            ) : paginatedData.length > 0 ? (
              // Data Rows
              paginatedData.map((row, rowIndex) => (
                <tr
                  key={row.id || rowIndex}
                  onClick={() => onRowClick && onRowClick(row)}
                  className={`
                    ${onRowClick ? 'cursor-pointer hover:bg-gray-50' : ''}
                    ${selectedRows.includes(row.id) ? 'bg-blue-50' : ''}
                    transition-colors duration-150
                  `}
                >
                  {/* Selection Checkbox */}
                  {selectable && (
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedRows.includes(row.id)}
                        onChange={() => handleRowSelect(row.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                  )}

                  {/* Row Data */}
                  {columns.map((column, colIndex) => {
                    const value = row[column.accessor];
                    return (
                      <td key={colIndex} className="px-6 py-4">
                        {column.render ? column.render(value, row) : value}
                      </td>
                    );
                  })}

                  {/* Row Actions */}
                  {actions && (
                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                      {typeof actions === 'function' ? actions(row) : actions}
                    </td>
                  )}
                </tr>
              ))
            ) : (
              // Empty State
              <tr>
                <td
                  colSpan={columns.length + (selectable ? 1 : 0) + (actions ? 1 : 0)}
                  className="px-6 py-12 text-center"
                >
                  <div className="flex flex-col items-center justify-center text-gray-400">
                    <span className="text-4xl mb-3">📭</span>
                    <p className="text-sm">{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {showPagination && totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <p className="text-sm text-gray-600">
            Showing {((currentPage - 1) * itemsPerPage) + 1} to{' '}
            {Math.min(currentPage * itemsPerPage, sortedData.length)} of{' '}
            {sortedData.length} entries
          </p>
          
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`
                      w-8 h-8 text-sm font-medium rounded-lg
                      ${currentPage === pageNum
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                      }
                    `}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Selected Items Info */}
      {selectable && selectedRows.length > 0 && (
        <div className="px-6 py-3 bg-blue-50 border-t border-blue-100">
          <p className="text-sm text-blue-600">
            {selectedRows.length} item{selectedRows.length > 1 ? 's' : ''} selected
          </p>
        </div>
      )}
    </div>
  );
};

// Compact Table Component for small datasets
export const CompactTable = ({ columns, data, className = '' }) => {
  return (
    <div className={`bg-white rounded-lg border border-gray-200 overflow-hidden ${className}`}>
      <table className="w-full text-sm text-left text-gray-600">
        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
          <tr>
            {columns.map((column, index) => (
              <th key={index} className="px-4 py-2 font-medium">
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {data.map((row, rowIndex) => (
            <tr key={rowIndex} className="hover:bg-gray-50">
              {columns.map((column, colIndex) => {
                const value = row[column.accessor];
                return (
                  <td key={colIndex} className="px-4 py-2">
                    {column.render ? column.render(value, row) : value}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Simple Stats Table for dashboard
export const StatsTable = ({ data, className = '' }) => {
  return (
    <div className={`bg-white rounded-lg border border-gray-200 divide-y divide-gray-200 ${className}`}>
      {data.map((item, index) => (
        <div key={index} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50">
          <span className="text-sm text-gray-600">{item.label}</span>
          <span className="text-sm font-semibold text-gray-800">{item.value}</span>
        </div>
      ))}
    </div>
  );
};

export default Table;