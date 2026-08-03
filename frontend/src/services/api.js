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

export default API;
