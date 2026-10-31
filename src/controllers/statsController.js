import { Booking } from '../models/Booking.js';
import { Payment } from '../models/Payment.js';
import { Service } from '../models/Service.js';
import { User } from '../models/User.js';
import { ContactEnquiry } from '../models/ContactEnquiry.js';
import { UserImageUpload } from '../models/UserImageUpload.js';
import { BOOKING_STATUS, PAYMENT_STATUS, ROLES } from '../config/constants.js';
import * as XLSX from 'xlsx';

export const getDashboardOverview = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        dateFilter.createdAt.$lte = end;
      }
    }

    // Parallel aggregate lookups
    const [
      totalCustomers,
      totalServices,
      activeServices,
      totalBookings,
      pendingBookings,
      confirmedBookings,
      inProgressBookings,
      completedBookings,
      cancelledBookings,
      totalEnquiries,
      revenueStats,
      recentBookings,
      recentCustomers,
      recentEnquiries,
    ] = await Promise.all([
      User.countDocuments({ role: ROLES.CUSTOMER }),
      Service.countDocuments(),
      Service.countDocuments({ isActive: true }),
      Booking.countDocuments(dateFilter),
      Booking.countDocuments({ ...dateFilter, status: BOOKING_STATUS.PENDING }),
      Booking.countDocuments({ ...dateFilter, status: BOOKING_STATUS.CONFIRMED }),
      Booking.countDocuments({ ...dateFilter, status: BOOKING_STATUS.IN_PROGRESS }),
      Booking.countDocuments({ ...dateFilter, status: BOOKING_STATUS.COMPLETED }),
      Booking.countDocuments({ ...dateFilter, status: BOOKING_STATUS.CANCELLED }),
      ContactEnquiry.countDocuments(dateFilter),
      Payment.aggregate([
        {
          $match: {
            ...dateFilter,
            status: { $in: [PAYMENT_STATUS.PAID, PAYMENT_STATUS.PENDING, PAYMENT_STATUS.REFUNDED] },
          },
        },
        {
          $group: {
            _id: '$status',
            totalAmount: { $sum: '$amount' },
            refundTotal: { $sum: '$refundAmount' },
            count: { $sum: 1 },
          },
        },
      ]),
      Booking.find(dateFilter)
        .populate('customer', 'name email avatar')
        .populate('service', 'name slug')
        .sort({ createdAt: -1 })
        .limit(5),
      User.find({ role: ROLES.CUSTOMER })
        .select('name email phone avatar createdAt')
        .sort({ createdAt: -1 })
        .limit(5),
      ContactEnquiry.find().sort({ createdAt: -1 }).limit(5),
    ]);

    let totalRevenue = 0;
    let pendingPaymentAmount = 0;
    let totalRefunds = 0;

    revenueStats.forEach((stat) => {
      if (stat._id === PAYMENT_STATUS.PAID) {
        totalRevenue = stat.totalAmount;
      } else if (stat._id === PAYMENT_STATUS.PENDING) {
        pendingPaymentAmount = stat.totalAmount;
      } else if (stat._id === PAYMENT_STATUS.REFUNDED) {
        totalRefunds = stat.refundTotal || stat.totalAmount;
      }
    });

    res.json({
      success: true,
      data: {
        summary: {
          totalCustomers,
          totalServices,
          activeServices,
          totalBookings,
          pendingBookings,
          confirmedBookings,
          inProgressBookings,
          completedBookings,
          cancelledBookings,
          totalRevenue,
          pendingPaymentAmount,
          totalRefunds,
          totalEnquiries,
        },
        recentBookings,
        recentCustomers,
        recentEnquiries,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getRevenueAndBookingCharts = async (req, res, next) => {
  try {
    // Last 6 months aggregated data
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const [monthlyRevenue, serviceDistribution, bookingStatusDistribution] = await Promise.all([
      Payment.aggregate([
        {
          $match: {
            status: PAYMENT_STATUS.PAID,
            createdAt: { $gte: sixMonthsAgo },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
            },
            revenue: { $sum: '$amount' },
            transactions: { $sum: 1 },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]),
      Booking.aggregate([
        {
          $group: {
            _id: '$serviceSnapshot.name',
            count: { $sum: 1 },
            revenue: { $sum: '$totalAmount' },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 6 },
      ]),
      Booking.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    // Format months for friendly rendering in Recharts
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const formattedMonthly = monthlyRevenue.map((item) => ({
      name: `${monthNames[item._id.month - 1]} ${item._id.year}`,
      revenue: Math.round(item.revenue),
      orders: item.transactions,
    }));

    res.json({
      success: true,
      data: {
        monthlyRevenue: formattedMonthly,
        serviceDistribution: serviceDistribution.map((item) => ({
          name: item._id || 'Unspecified Service',
          value: item.count,
          revenue: Math.round(item.revenue),
        })),
        bookingStatusDistribution: bookingStatusDistribution.map((item) => ({
          status: item._id,
          count: item.count,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const exportBookingsCSV = async (req, res, next) => {
  try {
    const bookings = await Booking.find()
      .populate('customer', 'name email phone')
      .sort({ createdAt: -1 });

    const rows = bookings.map((b) => ({
      BookingNumber: b.bookingNumber,
      CustomerName: b.customer?.name || 'N/A',
      CustomerEmail: b.customer?.email || 'N/A',
      CustomerPhone: b.customer?.phone || 'N/A',
      Service: b.serviceSnapshot?.name || 'N/A',
      Package: b.packageSnapshot?.name || 'N/A',
      TotalAmount: b.totalAmount,
      TaxAmount: b.taxAmount,
      Status: b.status,
      PaymentStatus: b.paymentStatus,
      Date: b.createdAt.toISOString().slice(0, 10),
    }));

    // CSV header
    const headers = Object.keys(rows[0] || {}).join(',');
    const csvContent = rows
      .map((row) =>
        Object.values(row)
          .map((val) => `"${String(val).replace(/"/g, '""')}"`)
          .join(',')
      )
      .join('\n');

    res.header('Content-Type', 'text/csv');
    res.attachment(`Bookings_Export_${Date.now()}.csv`);
    res.send(`${headers}\n${csvContent}`);
  } catch (error) {
    next(error);
  }
};

/**
 * Dynamic Report Generation System
 * Generates comprehensive multi-module reports with accurate totals in JSON, Excel (.xlsx), and printable formats.
 */
export const generateDynamicReport = async (req, res, next) => {
  try {
    const {
      reportType = 'comprehensive',
      modules = ['orders', 'payments', 'quotations', 'customers', 'uploads'],
      dateRange = 'all',
      startDate,
      endDate,
      status = 'all',
      format = 'json',
    } = req.body;

    // Build Date Filter
    const dateQuery = {};
    const now = new Date();

    if (dateRange === 'today') {
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      dateQuery.createdAt = { $gte: todayStart };
    } else if (dateRange === 'last7days') {
      const past7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      dateQuery.createdAt = { $gte: past7 };
    } else if (dateRange === 'last30days') {
      const past30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      dateQuery.createdAt = { $gte: past30 };
    } else if (dateRange === 'thisMonth') {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      dateQuery.createdAt = { $gte: monthStart };
    } else if (startDate || endDate) {
      dateQuery.createdAt = {};
      if (startDate) dateQuery.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        dateQuery.createdAt.$lte = end;
      }
    }

    const reportData = {
      generatedAt: new Date().toISOString(),
      reportType,
      dateRange,
      modulesIncluded: modules,
      summary: {},
      orders: [],
      payments: [],
      quotations: [],
      customers: [],
      uploads: [],
    };

    // 1. Orders & Bookings Module
    if (modules.includes('orders') || reportType === 'orders' || reportType === 'comprehensive') {
      const bookingQuery = { ...dateQuery };
      if (status && status !== 'all') {
        bookingQuery.status = status;
      }

      const bookings = await Booking.find(bookingQuery)
        .populate('customer', 'name email phone')
        .sort({ createdAt: -1 });

      let grossAmount = 0;
      let totalTax = 0;
      let confirmedCount = 0;
      let pendingCount = 0;

      reportData.orders = bookings.map((b) => {
        grossAmount += b.totalAmount || 0;
        totalTax += b.taxAmount || 0;
        if (b.status === BOOKING_STATUS.CONFIRMED || b.status === BOOKING_STATUS.COMPLETED) {
          confirmedCount++;
        } else if (b.status === BOOKING_STATUS.PENDING) {
          pendingCount++;
        }

        return {
          bookingNumber: b.bookingNumber,
          customerName: b.customer?.name || 'N/A',
          customerEmail: b.customer?.email || 'N/A',
          customerPhone: b.customer?.phone || 'N/A',
          serviceName: b.serviceSnapshot?.name || 'N/A',
          packageName: b.packageSnapshot?.name || 'N/A',
          baseAmount: b.baseAmount || 0,
          newUserSurcharge: b.newUserSurcharge || 0,
          discountAmount: b.coupon?.discountAmount || 0,
          taxAmount: b.taxAmount || 0,
          totalAmount: b.totalAmount || 0,
          status: b.status,
          paymentStatus: b.paymentStatus,
          date: b.createdAt.toISOString().slice(0, 10),
        };
      });

      reportData.summary.orders = {
        totalOrders: bookings.length,
        confirmedOrders: confirmedCount,
        pendingOrders: pendingCount,
        grossOrderValue: Math.round(grossAmount * 100) / 100,
        totalTaxCollected: Math.round(totalTax * 100) / 100,
      };
    }

    // 2. Financial & Payments Module
    if (modules.includes('payments') || reportType === 'financial' || reportType === 'comprehensive') {
      const paymentQuery = { ...dateQuery };
      const payments = await Payment.find(paymentQuery)
        .populate('customer', 'name email')
        .populate('booking', 'bookingNumber')
        .sort({ createdAt: -1 });

      let settledRevenue = 0;
      let pendingAmount = 0;
      let refundAmount = 0;

      reportData.payments = payments.map((p) => {
        if (p.status === PAYMENT_STATUS.PAID) settledRevenue += p.amount || 0;
        else if (p.status === PAYMENT_STATUS.PENDING) pendingAmount += p.amount || 0;
        else if (p.status === PAYMENT_STATUS.REFUNDED) refundAmount += p.refundAmount || p.amount || 0;

        return {
          paymentId: p._id,
          transactionId: p.transactionId,
          bookingNumber: p.booking?.bookingNumber || 'N/A',
          customerName: p.customer?.name || 'N/A',
          amount: p.amount || 0,
          status: p.status,
          provider: p.provider,
          paymentMethod: p.paymentMethod || 'Online',
          date: p.createdAt.toISOString().slice(0, 10),
        };
      });

      reportData.summary.financial = {
        totalTransactions: payments.length,
        settledRevenue: Math.round(settledRevenue * 100) / 100,
        pendingPayments: Math.round(pendingAmount * 100) / 100,
        totalRefunds: Math.round(refundAmount * 100) / 100,
      };
    }

    // 3. Quotations & RFQs Module
    if (modules.includes('quotations') || reportType === 'quotations' || reportType === 'comprehensive') {
      const qQuery = { ...dateQuery, enquiryType: { $in: ['rfq', 'bulk_order'] } };
      if (status && status !== 'all') {
        qQuery.status = status;
      }

      const quotations = await ContactEnquiry.find(qQuery).sort({ createdAt: -1 });

      let approvedCount = 0;
      let totalQuotedValue = 0;

      reportData.quotations = quotations.map((q) => {
        if (q.status === 'approved') approvedCount++;
        totalQuotedValue += q.approvedPrice || q.targetPrice || 0;

        return {
          quotationNumber: q.quotationNumber || 'N/A',
          clientName: q.name,
          email: q.email,
          phone: q.phone,
          companyName: q.companyName || 'N/A',
          gstin: q.gstin || 'N/A',
          partNumbers: q.partNumber || q.subject,
          brand: q.brand || 'Multi-brand',
          quantity: q.quantity || 1,
          targetPrice: q.targetPrice || 0,
          approvedPrice: q.approvedPrice || 0,
          status: q.status,
          date: q.createdAt.toISOString().slice(0, 10),
        };
      });

      reportData.summary.quotations = {
        totalRequests: quotations.length,
        approvedQuotations: approvedCount,
        pipelineValue: Math.round(totalQuotedValue * 100) / 100,
      };
    }

    // 4. Customers & Rates Module
    if (modules.includes('customers') || reportType === 'customers' || reportType === 'comprehensive') {
      const customers = await User.find({ role: ROLES.CUSTOMER }).sort({ createdAt: -1 });

      let newUsersCount = 0;
      let existingStandardCount = 0;

      reportData.customers = customers.map((c) => {
        const isNew = Boolean(c.isNewUser || c.pricingTier === 'new_user');
        if (isNew) newUsersCount++;
        else existingStandardCount++;

        return {
          customerId: c._id,
          name: c.name,
          email: c.email,
          phone: c.phone || 'N/A',
          city: c.address?.city || 'Not provided',
          pricingTier: c.pricingTier || (isNew ? 'new_user' : 'existing_standard'),
          assignedRateLabel: isNew ? `New User (+${c.markupPercentage ?? 5}%)` : 'Existing Standard (0% Extra)',
          markupPercentage: isNew ? (c.markupPercentage ?? 5) : 0,
          status: c.isActive ? 'Active' : 'Inactive',
          joinedDate: c.createdAt.toISOString().slice(0, 10),
        };
      });

      reportData.summary.customers = {
        totalCustomers: customers.length,
        newUsersOnboardingRate: newUsersCount,
        existingStandardRate: existingStandardCount,
      };
    }

    // 5. Uploaded Images Module
    if (modules.includes('uploads') || reportType === 'uploads' || reportType === 'comprehensive') {
      const uploads = await UserImageUpload.find(dateQuery).sort({ createdAt: -1 });

      reportData.uploads = uploads.map((u) => ({
        uploadId: u._id,
        customerName: u.customerName,
        customerEmail: u.customerEmail,
        customerPhone: u.customerPhone,
        city: u.city || 'Not specified',
        fileName: u.originalFileName,
        resolution: `${u.dimensions?.width}x${u.dimensions?.height} (${u.dimensions?.megapixels} MP)`,
        status: u.status,
        date: u.createdAt.toISOString().slice(0, 10),
      }));

      reportData.summary.uploads = {
        totalUploadedImages: uploads.length,
      };
    }

    // Export Excel Workbook if requested
    if (format === 'excel') {
      const wb = XLSX.utils.book_new();

      // Executive Summary Sheet
      const summaryRows = [
        ['BALUMUNI & ASSOCIATES - EXECUTIVE BUSINESS AUDIT REPORT'],
        ['Generated Date', new Date().toLocaleString()],
        ['Report Type', reportType.toUpperCase()],
        ['Date Range', dateRange],
        [''],
        ['METRIC', 'VALUE'],
      ];

      if (reportData.summary.orders) {
        summaryRows.push(['Total Bookings / Orders', reportData.summary.orders.totalOrders]);
        summaryRows.push(['Confirmed Active Orders', reportData.summary.orders.confirmedOrders]);
        summaryRows.push(['Gross Order Volume (INR)', reportData.summary.orders.grossOrderValue]);
        summaryRows.push(['GST Tax Collected (INR)', reportData.summary.orders.totalTaxCollected]);
      }
      if (reportData.summary.financial) {
        summaryRows.push(['Net Settled Revenue (INR)', reportData.summary.financial.settledRevenue]);
        summaryRows.push(['Pending Settlements (INR)', reportData.summary.financial.pendingPayments]);
      }
      if (reportData.summary.quotations) {
        summaryRows.push(['Total Quotation Inquiries', reportData.summary.quotations.totalRequests]);
        summaryRows.push(['Approved Quotations', reportData.summary.quotations.approvedQuotations]);
      }
      if (reportData.summary.customers) {
        summaryRows.push(['Total Customer Accounts', reportData.summary.customers.totalCustomers]);
        summaryRows.push(['New Users Assigned Rate (+5%)', reportData.summary.customers.newUsersOnboardingRate]);
        summaryRows.push(['Existing Standard Clients (0%)', reportData.summary.customers.existingStandardRate]);
      }

      const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
      XLSX.utils.book_append_sheet(wb, wsSummary, 'Executive Summary');

      if (reportData.orders.length > 0) {
        const wsOrders = XLSX.utils.json_to_sheet(reportData.orders);
        XLSX.utils.book_append_sheet(wb, wsOrders, 'Orders & Bookings');
      }

      if (reportData.payments.length > 0) {
        const wsPayments = XLSX.utils.json_to_sheet(reportData.payments);
        XLSX.utils.book_append_sheet(wb, wsPayments, 'Financial Ledger');
      }

      if (reportData.quotations.length > 0) {
        const wsQuotations = XLSX.utils.json_to_sheet(reportData.quotations);
        XLSX.utils.book_append_sheet(wb, wsQuotations, 'Quotations');
      }

      if (reportData.customers.length > 0) {
        const wsCustomers = XLSX.utils.json_to_sheet(reportData.customers);
        XLSX.utils.book_append_sheet(wb, wsCustomers, 'Customer Rates');
      }

      if (reportData.uploads.length > 0) {
        const wsUploads = XLSX.utils.json_to_sheet(reportData.uploads);
        XLSX.utils.book_append_sheet(wb, wsUploads, 'Uploaded Images');
      }

      const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=Balumuni_Report_${Date.now()}.xlsx`);
      return res.send(excelBuffer);
    }

    // Default JSON response
    res.json({
      success: true,
      data: reportData,
    });
  } catch (error) {
    next(error);
  }
};
