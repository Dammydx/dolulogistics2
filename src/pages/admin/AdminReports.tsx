import { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-toastify';
import { supabase } from '../../lib/supabase';
import { Booking, Rider } from '../../types/database';
import {
  Download,
  Calendar,
  CheckCircle,
  XCircle,
  Package,
  User,
} from 'lucide-react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

import NairaIcon from '../../components/icons/NairaIcon';

const AdminReports = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  // Default to current month and year
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState<string>(
    `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`
  );
  const [riders, setRiders] = useState<Rider[]>([]);
  const [selectedRiderId, setSelectedRiderId] = useState<string>('all');

  useEffect(() => {
    fetchBookings();
    fetchRiders();
  }, []);

  const fetchRiders = async () => {
    try {
      const { data, error } = await supabase
        .from('riders')
        .select('*')
        .order('full_name', { ascending: true });
      if (error) throw error;
      setRiders(data || []);
    } catch (err) {
      console.error('Error fetching riders:', err);
    }
  };

  const fetchBookings = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBookings(data || []);
    } catch (err) {
      console.error('Error fetching bookings:', err);
      toast.error('Failed to load bookings');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter bookings based on selected month
  const filteredBookings = useMemo(() => {
    if (!selectedMonth) return bookings;

    const [year, month] = selectedMonth.split('-');
    
    return bookings.filter((booking) => {
      const date = new Date(booking.created_at);
      const matchesMonth = (
        date.getFullYear() === parseInt(year, 10) &&
        date.getMonth() + 1 === parseInt(month, 10)
      );
      
      const matchesRider = selectedRiderId === 'all' || booking.assigned_rider_id === selectedRiderId;
      
      return matchesMonth && matchesRider;
    });
  }, [bookings, selectedMonth, selectedRiderId]);

  // Derive metrics
  const metrics = useMemo(() => {
    let totalBookings = 0;
    let delivered = 0;
    let canceled = 0;
    let revenue = 0;

    filteredBookings.forEach((booking) => {
      totalBookings += 1;
      if (booking.status === 'delivered') {
        delivered += 1;
        revenue += booking.price_total;
      } else if (booking.status === 'cancelled' || booking.status === 'not_accepted') {
        canceled += 1;
      }
    });

    return { totalBookings, delivered, canceled, revenue };
  }, [filteredBookings]);

  // Get month name for display
  const getMonthName = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const handleDownloadReport = async (onlyDelivered: boolean = false) => {
    const bookingsToExport = onlyDelivered 
      ? filteredBookings.filter(b => b.status === 'delivered') 
      : filteredBookings;

    if (bookingsToExport.length === 0) {
      toast.warning(`No ${onlyDelivered ? 'delivered ' : ''}bookings to export for the selected month.`);
      return;
    }

    setIsExporting(true);

    try {
      // Fetch area names for clean route display
      const { data: areasData } = await supabase.from('locations_areas').select('id, name');
      const areaMap = new Map<string, string>();
      if (areasData) {
        areasData.forEach((a: { id: string; name: string }) => areaMap.set(a.id, a.name));
      }

      // Fetch item category names
      const { data: categoriesData } = await supabase.from('item_categories').select('id, name');
      const categoryMap = new Map<string, string>();
      if (categoriesData) {
        categoriesData.forEach((c: { id: string; name: string }) => categoryMap.set(c.id, c.name));
      }

      const monthLabel = getMonthName(selectedMonth);
      const reportType = onlyDelivered ? 'Delivered Report' : 'Monthly Report';
      const now = new Date();
      const generatedAt = now.toLocaleDateString('en-NG', {
        day: 'numeric', month: 'long', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
        hour12: true,
      });

      const selectedRider = riders.find(r => r.id === selectedRiderId);
      const riderSuffix = selectedRider ? ` — ${selectedRider.full_name}` : '';

      // ===== COLORS =====
      const brandPrimary = '1E3A5F';  // Deep navy
      const brandAccent = 'E8792F';   // Dolu orange
      const headerBg = '1E3A5F';
      const headerFont = 'FFFFFF';
      const summaryBg = 'F0F4F8';
      const altRowBg = 'F8FAFC';
      const totalBg = 'E8F5E9';
      const borderColor = 'D1D5DB';

      // ===== CREATE WORKBOOK =====
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Dolu Logistics LTD';
      workbook.created = now;

      const sheet = workbook.addWorksheet(reportType, {
        pageSetup: {
          paperSize: 9, // A4
          orientation: 'landscape',
          fitToPage: true,
          fitToWidth: 1,
          fitToHeight: 0,
          margins: { left: 0.4, right: 0.4, top: 0.5, bottom: 0.5, header: 0.3, footer: 0.3 },
        },
      });

      const hasStatusCol = !onlyDelivered;
      const totalCols = hasStatusCol ? 10 : 9;

      // ===== COLUMN WIDTHS =====
      const baseColumns = [
        { width: 4 },   // S/N
        { width: 14 },  // Date
        { width: 18 },  // Tracking ID
        { width: 20 },  // Customer
        { width: 16 },  // Phone
        { width: 22 },  // Pickup
        { width: 22 },  // Drop-off
        { width: 16 },  // Rider
        { width: 14 },  // Amount
      ];
      if (hasStatusCol) baseColumns.push({ width: 15 }); // Status
      sheet.columns = baseColumns;

      let rowNum = 1;

      // ===== ROW 1: Company Name =====
      sheet.mergeCells(rowNum, 1, rowNum, totalCols);
      const titleRow = sheet.getRow(rowNum);
      titleRow.getCell(1).value = 'DOLU LOGISTICS LTD';
      titleRow.getCell(1).font = { name: 'Calibri', size: 18, bold: true, color: { argb: brandPrimary } };
      titleRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
      titleRow.height = 32;
      rowNum++;

      // ===== ROW 2: Report Title =====
      sheet.mergeCells(rowNum, 1, rowNum, totalCols);
      const subtitleRow = sheet.getRow(rowNum);
      subtitleRow.getCell(1).value = `${reportType} — ${monthLabel}${riderSuffix}`;
      subtitleRow.getCell(1).font = { name: 'Calibri', size: 13, bold: true, color: { argb: brandAccent } };
      subtitleRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
      subtitleRow.height = 22;
      rowNum++;

      // ===== ROW 3: Generated Date =====
      sheet.mergeCells(rowNum, 1, rowNum, totalCols);
      const dateRow = sheet.getRow(rowNum);
      dateRow.getCell(1).value = `Generated: ${generatedAt}`;
      dateRow.getCell(1).font = { name: 'Calibri', size: 10, italic: true, color: { argb: '6B7280' } };
      dateRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
      dateRow.height = 18;
      rowNum++;

      // ===== ROW 4: Spacer =====
      sheet.getRow(rowNum).height = 8;
      rowNum++;

      // ===== ROW 5: Summary Header =====
      sheet.mergeCells(rowNum, 1, rowNum, totalCols);
      const summaryHeaderRow = sheet.getRow(rowNum);
      summaryHeaderRow.getCell(1).value = 'REPORT SUMMARY';
      summaryHeaderRow.getCell(1).font = { name: 'Calibri', size: 12, bold: true, color: { argb: brandPrimary } };
      summaryHeaderRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: summaryBg } };
      summaryHeaderRow.getCell(1).border = { bottom: { style: 'medium', color: { argb: brandPrimary } } };
      // Apply fill to all merged cells
      for (let c = 2; c <= totalCols; c++) {
        summaryHeaderRow.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: summaryBg } };
        summaryHeaderRow.getCell(c).border = { bottom: { style: 'medium', color: { argb: brandPrimary } } };
      }
      summaryHeaderRow.height = 24;
      rowNum++;

      // ===== ROW 6: Summary metrics line 1 =====
      const summaryRow1 = sheet.getRow(rowNum);
      summaryRow1.getCell(1).value = 'Total Bookings:';
      summaryRow1.getCell(1).font = { name: 'Calibri', size: 11, color: { argb: '374151' } };
      sheet.mergeCells(rowNum, 1, rowNum, 2);
      summaryRow1.getCell(3).value = metrics.totalBookings;
      summaryRow1.getCell(3).font = { name: 'Calibri', size: 12, bold: true, color: { argb: brandPrimary } };

      summaryRow1.getCell(4).value = 'Delivered:';
      summaryRow1.getCell(4).font = { name: 'Calibri', size: 11, color: { argb: '374151' } };
      summaryRow1.getCell(5).value = metrics.delivered;
      summaryRow1.getCell(5).font = { name: 'Calibri', size: 12, bold: true, color: { argb: '16A34A' } };

      summaryRow1.getCell(6).value = 'Cancelled:';
      summaryRow1.getCell(6).font = { name: 'Calibri', size: 11, color: { argb: '374151' } };
      summaryRow1.getCell(7).value = metrics.canceled;
      summaryRow1.getCell(7).font = { name: 'Calibri', size: 12, bold: true, color: { argb: 'DC2626' } };
      summaryRow1.height = 22;
      for (let c = 1; c <= totalCols; c++) {
        summaryRow1.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: summaryBg } };
      }
      rowNum++;

      // ===== ROW 7: Revenue =====
      const summaryRow2 = sheet.getRow(rowNum);
      summaryRow2.getCell(1).value = 'Total Revenue (Delivered):';
      summaryRow2.getCell(1).font = { name: 'Calibri', size: 11, color: { argb: '374151' } };
      sheet.mergeCells(rowNum, 1, rowNum, 2);
      summaryRow2.getCell(3).value = `₦${metrics.revenue.toLocaleString()}`;
      summaryRow2.getCell(3).font = { name: 'Calibri', size: 14, bold: true, color: { argb: '16A34A' } };
      sheet.mergeCells(rowNum, 3, rowNum, 4);
      summaryRow2.height = 24;
      for (let c = 1; c <= totalCols; c++) {
        summaryRow2.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: summaryBg } };
        summaryRow2.getCell(c).border = { bottom: { style: 'medium', color: { argb: brandPrimary } } };
      }
      rowNum++;

      // ===== ROW 8: Spacer =====
      sheet.getRow(rowNum).height = 12;
      rowNum++;

      // ===== ROW 9: Table Header =====
      const headers = ['S/N', 'Date', 'Tracking ID', 'Customer', 'Phone', 'Pickup', 'Drop-off', 'Rider', 'Amount (₦)'];
      if (hasStatusCol) headers.push('Status');
      const amountColIdx = 8; // 0-indexed position of Amount column
      const headerRow = sheet.getRow(rowNum);
      headers.forEach((header, idx) => {
        const cell = headerRow.getCell(idx + 1);
        cell.value = header;
        cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: headerFont } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: headerBg } };
        cell.alignment = { horizontal: idx === amountColIdx ? 'right' : 'left', vertical: 'middle' };
        cell.border = {
          top: { style: 'thin', color: { argb: headerBg } },
          bottom: { style: 'thin', color: { argb: headerBg } },
          left: { style: 'thin', color: { argb: headerBg } },
          right: { style: 'thin', color: { argb: headerBg } },
        };
      });
      headerRow.height = 26;
      rowNum++;

      // ===== DATA ROWS =====
      let totalAmount = 0;
      bookingsToExport.forEach((booking, index) => {
        const pickupAreaName = booking.pickup_area_id ? areaMap.get(booking.pickup_area_id) || '' : '';
        const dropoffAreaName = booking.dropoff_area_id ? areaMap.get(booking.dropoff_area_id) || '' : '';
        const isEven = index % 2 === 0;

        const row = sheet.getRow(rowNum);
        const rowData: (string | number)[] = [
          index + 1,
          new Date(booking.created_at).toLocaleDateString('en-NG', { day: '2-digit', month: 'short', year: 'numeric' }),
          booking.tracking_id,
          booking.sender_name,
          booking.sender_phone,
          pickupAreaName,
          dropoffAreaName,
          booking.rider_name || '—',
          booking.price_total,
        ];
        if (hasStatusCol) rowData.push(booking.status.replace('_', ' ').toUpperCase());

        rowData.forEach((val, idx) => {
          const cell = row.getCell(idx + 1);
          cell.value = val;
          cell.font = { name: 'Calibri', size: 10, color: { argb: '374151' } };
          
          if (isEven) {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: altRowBg } };
          }
          
          cell.border = {
            bottom: { style: 'hair', color: { argb: borderColor } },
          };

          // Amount column — right-align and format as number
          if (idx === amountColIdx) {
            cell.alignment = { horizontal: 'right', vertical: 'middle' };
            cell.numFmt = '#,##0';
            cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: '1F2937' } };
          } else if (idx === 0) {
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
            cell.font = { name: 'Calibri', size: 9, color: { argb: '9CA3AF' } };
          } else if (hasStatusCol && idx === rowData.length - 1) {
            // Status column styling
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
            const status = booking.status;
            const statusColor = status === 'delivered' ? '16A34A' : status === 'cancelled' || status === 'not_accepted' ? 'DC2626' : status === 'in_progress' ? '0891B2' : 'D97706';
            cell.font = { name: 'Calibri', size: 9, bold: true, color: { argb: statusColor } };
          } else {
            cell.alignment = { vertical: 'middle' };
          }
        });
        row.height = 22;
        totalAmount += booking.price_total;
        rowNum++;
      });

      // ===== TOTALS ROW (only for Delivered report) =====
      if (onlyDelivered) {
        const totalRow = sheet.getRow(rowNum);
        sheet.mergeCells(rowNum, 1, rowNum, 8);
        totalRow.getCell(1).value = 'TOTAL';
        totalRow.getCell(1).font = { name: 'Calibri', size: 12, bold: true, color: { argb: brandPrimary } };
        totalRow.getCell(1).alignment = { horizontal: 'right', vertical: 'middle' };
        
        totalRow.getCell(9).value = totalAmount;
        totalRow.getCell(9).numFmt = '#,##0';
        totalRow.getCell(9).font = { name: 'Calibri', size: 13, bold: true, color: { argb: brandPrimary } };
        totalRow.getCell(9).alignment = { horizontal: 'right', vertical: 'middle' };
        
        for (let c = 1; c <= totalCols; c++) {
          totalRow.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: totalBg } };
          totalRow.getCell(c).border = {
            top: { style: 'medium', color: { argb: brandPrimary } },
            bottom: { style: 'medium', color: { argb: brandPrimary } },
          };
        }
        totalRow.height = 28;
        rowNum++;
      }

      // ===== SPACER =====
      sheet.getRow(rowNum).height = 12;
      rowNum++;

      // ===== FOOTER =====
      sheet.mergeCells(rowNum, 1, rowNum, totalCols);
      const footerRow = sheet.getRow(rowNum);
      footerRow.getCell(1).value = 'Dolu Logistics LTD  •  No. 122 Rumuokwuta-Choba Road, Port Harcourt  •  +234 913 027 8580';
      footerRow.getCell(1).font = { name: 'Calibri', size: 9, italic: true, color: { argb: '9CA3AF' } };
      footerRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
      footerRow.height = 20;
      rowNum++;

      sheet.mergeCells(rowNum, 1, rowNum, totalCols);
      const footerRow2 = sheet.getRow(rowNum);
      footerRow2.getCell(1).value = 'You Order, We Deliver. — www.dolulogistics.com';
      footerRow2.getCell(1).font = { name: 'Calibri', size: 9, italic: true, color: { argb: 'B0B8C4' } };
      footerRow2.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
      footerRow2.height = 18;

      // ===== PRINT SETTINGS =====
      sheet.headerFooter = {
        oddFooter: '&C&8Page &P of &N',
      };

      // ===== GENERATE AND DOWNLOAD =====
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const fileName = onlyDelivered 
        ? `Dolu_Delivered_Report_${selectedMonth}${selectedRider ? '_' + selectedRider.username : ''}.xlsx` 
        : `Dolu_Report_${selectedMonth}${selectedRider ? '_' + selectedRider.username : ''}.xlsx`;
      saveAs(blob, fileName);
      toast.success('Report downloaded successfully!');
    } catch (err) {
      console.error('Error exporting report:', err);
      toast.error('Failed to export report');
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="h-12 w-12 mx-auto mb-4 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin"></div>
          <p className="text-gray-600">Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Reports
          </h1>
          <p className="text-gray-600 text-sm mt-1">
            View booking summaries and download monthly reports
          </p>
        </div>

        <div className="flex items-center gap-3 bg-white p-2 rounded-lg border border-gray-200 shadow-sm">
          <Calendar className="h-5 w-5 text-gray-500 ml-2" />
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="border-none focus:ring-0 text-sm font-bold text-gray-700 bg-transparent min-w-[150px] cursor-pointer"
          />
        </div>

        <div className="flex items-center gap-3 bg-white p-2 rounded-lg border border-gray-200 shadow-sm transition-all hover:border-primary-300">
          <User className="h-5 w-5 text-gray-500 ml-2" />
          <select
            value={selectedRiderId}
            onChange={(e) => setSelectedRiderId(e.target.value)}
            className="border-none focus:ring-0 text-sm font-bold text-gray-700 bg-transparent min-w-[180px] cursor-pointer appearance-none pr-8"
          >
            <option value="all">Company Report (All)</option>
            <optgroup label="Active Team">
              {riders.filter(r => r.status === 'active').map(r => (
                <option key={r.id} value={r.id}>{r.full_name}</option>
              ))}
            </optgroup>
            <optgroup label="Archived">
              {riders.filter(r => r.status === 'archived').map(r => (
                <option key={r.id} value={r.id}>{r.full_name} (Retired)</option>
              ))}
            </optgroup>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Bookings */}
        <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm flex items-center">
          <div className="bg-blue-100 p-3 rounded-xl mr-4">
            <Package className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total Bookings</p>
            <p className="text-2xl font-bold text-gray-900">
              {metrics.totalBookings}
            </p>
          </div>
        </div>

        {/* Delivered */}
        <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm flex items-center">
          <div className="bg-green-100 p-3 rounded-xl mr-4">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Delivered</p>
            <p className="text-2xl font-bold text-gray-900">
              {metrics.delivered}
            </p>
          </div>
        </div>

        {/* Canceled */}
        <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm flex items-center">
          <div className="bg-red-100 p-3 rounded-xl mr-4">
            <XCircle className="h-6 w-6 text-red-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Canceled</p>
            <p className="text-2xl font-bold text-gray-900">{metrics.canceled}</p>
          </div>
        </div>

        {/* Revenue */}
        <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm flex items-center">
          <div className="bg-yellow-100 p-3 rounded-xl mr-4">
            <NairaIcon className="h-6 w-6 text-yellow-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Revenue</p>
            <p className="text-2xl font-bold text-gray-900">
              ₦{metrics.revenue.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-800">
            Monthly Bookings Table
          </h2>
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={() => handleDownloadReport(true)}
              disabled={isExporting}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="h-4 w-4" />
              {isExporting ? 'Exporting...' : 'Delivered Only'}
            </button>
            <button
              onClick={() => handleDownloadReport(false)}
              disabled={isExporting}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="h-4 w-4" />
              {isExporting ? 'Exporting...' : 'All Reports'}
            </button>
          </div>
        </div>

        {filteredBookings.length === 0 ? (
          <div className="p-8 text-center text-gray-500 flex flex-col items-center">
            <Package className="h-12 w-12 text-gray-300 mb-3" />
            <p>No bookings found for the selected month.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white border-b border-gray-200">
                  <th className="px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Tracking ID
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Rider
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredBookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {new Date(booking.created_at).toLocaleDateString('en-NG', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true,
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                        {booking.tracking_id}
                      </code>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      <div className="font-medium">{booking.sender_name}</div>
                      <div className="text-xs text-gray-500">{booking.sender_phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {booking.rider_name || <span className="italic text-gray-400">Unassigned</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      ₦{booking.price_total.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        booking.status === 'delivered' ? 'bg-green-100 text-green-800' :
                        booking.status === 'cancelled' || booking.status === 'not_accepted' ? 'bg-red-100 text-red-800' :
                        booking.status === 'in_progress' ? 'bg-cyan-100 text-cyan-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {booking.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminReports;
