import axios from 'axios';

const API = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('mf_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for consistent error handling
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired — clear storage
      localStorage.removeItem('mf_token');
    }
    return Promise.reject(error);
  }
);

// ==========================================
// AUTH API
// ==========================================
export const loginApi = async (identifier, password, role = null) => {
  const isPhone = /^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\s./0-9]*$/.test(identifier) && !identifier.includes('@');
  const payload = {
    email: identifier,
    phone: identifier,
    identifier: identifier,
    password,
    role,
    loginType: isPhone ? 'phone' : 'email',
  };
  const response = await API.post('/auth/login', payload);
  return response.data;
};

export const registerApi = async (userData) => {
  const response = await API.post('/auth/register', userData);
  return response.data;
};

export const getMeApi = async () => {
  const response = await API.get('/auth/me');
  return response.data;
};

export const seedUsersApi = async () => {
  const response = await API.post('/auth/seed');
  return response.data;
};

// ==========================================
// EMPLOYEE API
// ==========================================
export const registerEmployeeApi = async (employeeData) => {
  const response = await API.post('/employees', employeeData);
  return response.data;
};

export const getEmployeesApi = async () => {
  const response = await API.get('/employees');
  return response.data;
};

export const getAgentsApi = async () => {
  const response = await API.get('/employees/agents');
  return response.data;
};

// ==========================================
// CUSTOMER API
// ==========================================
export const registerCustomerApi = async (customerData) => {
  const response = await API.post('/customers', customerData);
  return response.data;
};

export const getCustomersApi = async (filters = {}) => {
  const params = new URLSearchParams(filters).toString();
  const response = await API.get(`/customers${params ? `?${params}` : ''}`);
  return response.data;
};

export const updateCustomerApi = async (id, customerData) => {
  const response = await API.put(`/customers/${id}`, customerData);
  return response.data;
};

export const recalculateCreditScoreApi = async (id) => {
  const response = await API.post(`/customers/${id}/score`);
  return response.data;
};

export const getCustomerTimelineApi = async (id) => {
  const response = await API.get(`/customers/${id}/timeline`);
  return response.data;
};

// ==========================================
// POLICY API
// ==========================================
export const getPoliciesApi = async () => {
  const response = await API.get('/policies');
  return response.data;
};

export const createPolicyApi = async (policyData) => {
  const response = await API.post('/policies', policyData);
  return response.data;
};

// ==========================================
// LOAN API
// ==========================================
export const calculateLoanApi = async (policyId, principalAmount) => {
  const response = await API.post('/loans/calculate', { policyId, principalAmount });
  return response.data;
};

export const createLoanApi = async (loanData) => {
  const response = await API.post('/loans', loanData);
  return response.data;
};

export const getLoansApi = async (filters = {}) => {
  const params = new URLSearchParams(filters).toString();
  const response = await API.get(`/loans${params ? `?${params}` : ''}`);
  return response.data;
};

export const getLoanByIdApi = async (id) => {
  const response = await API.get(`/loans/${id}`);
  return response.data;
};

export const getAmortizationScheduleApi = async (id) => {
  const response = await API.get(`/loans/${id}/schedule`);
  return response.data;
};

export const approveLoanApi = async (id, approvalData) => {
  const response = await API.put(`/loans/${id}/approve`, approvalData);
  return response.data;
};

export const updatePARBucketsApi = async () => {
  const response = await API.post('/loans/update-par');
  return response.data;
};

// ==========================================
// REPAYMENT API
// ==========================================
export const addRepaymentApi = async (repaymentData) => {
  const response = await API.post('/repayments/add', repaymentData);
  return response.data;
};

export const onlinePaymentApi = async (paymentData) => {
  const response = await API.post('/repayments/online', paymentData);
  return response.data;
};

export const getRepaymentsApi = async (filters = {}) => {
  const params = new URLSearchParams(filters).toString();
  const response = await API.get(`/repayments${params ? `?${params}` : ''}`);
  return response.data;
};

export const bulkRepaymentApi = async (bulkData) => {
  const response = await API.post('/repayments/bulk', bulkData);
  return response.data;
};

// ==========================================
// NOTIFICATION API
// ==========================================
export const getNotificationsApi = async (filters = {}) => {
  const params = new URLSearchParams(filters).toString();
  const response = await API.get(`/notifications${params ? `?${params}` : ''}`);
  return response.data;
};

export const markNotificationReadApi = async (id) => {
  const response = await API.put(`/notifications/${id}/read`);
  return response.data;
};

export const markAllNotificationsReadApi = async () => {
  const response = await API.put('/notifications/mark-all-read');
  return response.data;
};

export const triggerOverdueAlertsApi = async () => {
  const response = await API.post('/notifications/trigger-overdue');
  return response.data;
};

export const deleteNotificationApi = async (id) => {
  const response = await API.delete(`/notifications/${id}`);
  return response.data;
};

// ==========================================
// AUDIT LOG API
// ==========================================
export const getAuditLogsApi = async (filters = {}) => {
  const params = new URLSearchParams(filters).toString();
  const response = await API.get(`/audit${params ? `?${params}` : ''}`);
  return response.data;
};

export const getAuditStatsApi = async () => {
  const response = await API.get('/audit/stats');
  return response.data;
};

// ==========================================
// SYSTEM API
// ==========================================
export const getSystemModeApi = async () => {
  const response = await API.get('/system/mode');
  return response.data;
};

export const setSystemModeApi = async (configData) => {
  const response = await API.put('/system/mode', configData);
  return response.data;
};

export const getSystemHealthApi = async () => {
  const response = await API.get('/system/health');
  return response.data;
};

// ==========================================
// HOLIDAY API
// ==========================================
export const getHolidaysApi = async (filters = {}) => {
  const params = new URLSearchParams(filters).toString();
  const response = await API.get(`/holidays${params ? `?${params}` : ''}`);
  return response.data;
};

export const createHolidayApi = async (holidayData) => {
  const response = await API.post('/holidays', holidayData);
  return response.data;
};

export const deleteHolidayApi = async (id) => {
  const response = await API.delete(`/holidays/${id}`);
  return response.data;
};

// ==========================================
// REPORTS API
// ==========================================
export const getLoanReportApi = async (filters = {}) => {
  const params = new URLSearchParams(filters).toString();
  const response = await API.get(`/reports/loans${params ? `?${params}` : ''}`);
  return response.data;
};

export const getCollectionReportApi = async (filters = {}) => {
  const params = new URLSearchParams(filters).toString();
  const response = await API.get(`/reports/collections${params ? `?${params}` : ''}`);
  return response.data;
};

export const getOutstandingReportApi = async (filters = {}) => {
  const params = new URLSearchParams(filters).toString();
  const response = await API.get(`/reports/outstanding${params ? `?${params}` : ''}`);
  return response.data;
};

export const getPnLReportApi = async (filters = {}) => {
  const params = new URLSearchParams(filters).toString();
  const response = await API.get(`/reports/pnl${params ? `?${params}` : ''}`);
  return response.data;
};

// ==========================================
// ACCOUNTING / GENERAL LEDGER API
// ==========================================
export const getAccountsApi = async (filters = {}) => {
  const params = new URLSearchParams(filters).toString();
  const response = await API.get(`/accounting/accounts${params ? `?${params}` : ''}`);
  return response.data;
};

export const createAccountApi = async (accountData) => {
  const response = await API.post('/accounting/accounts', accountData);
  return response.data;
};

export const getJournalEntriesApi = async (filters = {}) => {
  const params = new URLSearchParams(filters).toString();
  const response = await API.get(`/accounting/journal-entries${params ? `?${params}` : ''}`);
  return response.data;
};

export const createJournalEntryApi = async (entryData) => {
  const response = await API.post('/accounting/journal-entries', entryData);
  return response.data;
};

export const createManualEntryApi = async (entryData) => {
  const response = await API.post('/accounting/manual-entry', entryData);
  return response.data;
};

// ==========================================
// DASHBOARD ANALYTICS API
// ==========================================
export const getDashboardAnalyticsApi = async () => {
  const response = await API.get('/dashboard/analytics');
  return response.data;
};

// ==========================================
// CASH REGISTER API
// ==========================================
export const openRegisterApi = async (registerData) => {
  const response = await API.post('/registers/open', registerData);
  return response.data;
};

export const getActiveRegisterApi = async () => {
  const response = await API.get('/registers/active');
  return response.data;
};

export const closeRegisterApi = async (closingData) => {
  const response = await API.post('/registers/close', closingData);
  return response.data;
};

export const getAllRegistersApi = async (filters = {}) => {
  const params = new URLSearchParams(filters).toString();
  const response = await API.get(`/registers${params ? `?${params}` : ''}`);
  return response.data;
};

// ==========================================
// SAAS TENANT & SUBSCRIPTION API
// ==========================================
export const getTenantsApi = async (filters = {}) => {
  const params = new URLSearchParams(filters).toString();
  const response = await API.get(`/tenants${params ? `?${params}` : ''}`);
  return response.data;
};

export const getTenantByIdApi = async (id) => {
  const response = await API.get(`/tenants/${id}`);
  return response.data;
};

export const createTenantApi = async (tenantData) => {
  const response = await API.post('/tenants', tenantData);
  return response.data;
};

export const updateTenantApi = async (id, tenantData) => {
  const response = await API.put(`/tenants/${id}`, tenantData);
  return response.data;
};

export const deleteTenantApi = async (id) => {
  const response = await API.delete(`/tenants/${id}`);
  return response.data;
};

// ==========================================
// TENANT SETTINGS & LOCALIZATION API
// ==========================================
export const getSettingsApi = async () => {
  const response = await API.get('/settings');
  return response.data;
};

export const updateSettingsApi = async (settingsData) => {
  const response = await API.put('/settings', settingsData);
  return response.data;
};

export const exportBackupApi = async () => {
  const response = await API.get('/settings/backup');
  return response.data;
};

// ==========================================
// CUSTOMER PORTAL API
// ==========================================
export const getPortalProfileApi = async () => {
  const response = await API.get('/portal/profile');
  return response.data;
};

export const getPortalLoansApi = async () => {
  const response = await API.get('/portal/loans');
  return response.data;
};

export const getPortalSettlementsApi = async () => {
  const response = await API.get('/portal/settlements');
  return response.data;
};

export default API;
