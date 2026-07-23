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

// Auth Service API functions
export const loginApi = async (identifier, password, role = null) => {
  const isPhone = /^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\s\./0-9]*$/.test(identifier) && !identifier.includes('@');
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

// Employee API
export const registerEmployeeApi = async (employeeData) => {
  const response = await API.post('/employees', employeeData);
  return response.data;
};

export const getEmployeesApi = async () => {
  const response = await API.get('/employees');
  return response.data;
};

// Customer API
export const registerCustomerApi = async (customerData) => {
  const response = await API.post('/customers', customerData);
  return response.data;
};

export const getCustomersApi = async () => {
  const response = await API.get('/customers');
  return response.data;
};

// Policy API
export const getPoliciesApi = async () => {
  const response = await API.get('/policies');
  return response.data;
};

export const createPolicyApi = async (policyData) => {
  const response = await API.post('/policies', policyData);
  return response.data;
};

// Loan API
export const calculateLoanApi = async (policyId, principalAmount) => {
  const response = await API.post('/loans/calculate', { policyId, principalAmount });
  return response.data;
};

export const createLoanApi = async (loanData) => {
  const response = await API.post('/loans', loanData);
  return response.data;
};

export const getLoansApi = async () => {
  const response = await API.get('/loans');
  return response.data;
};

// Repayment API
export const addRepaymentApi = async (repaymentData) => {
  const response = await API.post('/repayments/add', repaymentData);
  return response.data;
};

export const getRepaymentsApi = async () => {
  const response = await API.get('/repayments');
  return response.data;
};

export default API;
