import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CONFIG_PATH = path.join(__dirname, '../config/systemConfig.json');

const DEFAULT_CONFIG = {
  systemMode: 'lite', // 'lite' | 'enterprise'
  multiLevelApproval: false,
  gpsTrackingEnabled: true,
  penaltyEngineEnabled: true,
  notificationsEnabled: true,
  auditLogsEnabled: true,
  branchManagementEnabled: false,
  updatedAt: new Date().toISOString(),
};

const readConfig = () => {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const raw = fs.readFileSync(CONFIG_PATH, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (e) {
    // Fall through to default
  }
  return { ...DEFAULT_CONFIG };
};

const writeConfig = (config) => {
  const dir = path.dirname(CONFIG_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');
};

// @desc    Get current system mode & feature toggles
// @route   GET /api/system/mode
// @access  Private
export const getSystemMode = async (req, res) => {
  try {
    const config = readConfig();
    return res.json(config);
  } catch (error) {
    return res.status(500).json({ message: 'Error reading system configuration', error: error.message });
  }
};

// @desc    Update system mode / feature toggles
// @route   PUT /api/system/mode
// @access  Private (Admin, super_admin)
export const setSystemMode = async (req, res) => {
  try {
    const {
      systemMode,
      multiLevelApproval,
      gpsTrackingEnabled,
      penaltyEngineEnabled,
      notificationsEnabled,
      auditLogsEnabled,
      branchManagementEnabled,
    } = req.body;

    const currentConfig = readConfig();

    const updatedConfig = {
      ...currentConfig,
      ...(systemMode !== undefined && { systemMode }),
      ...(multiLevelApproval !== undefined && { multiLevelApproval }),
      ...(gpsTrackingEnabled !== undefined && { gpsTrackingEnabled }),
      ...(penaltyEngineEnabled !== undefined && { penaltyEngineEnabled }),
      ...(notificationsEnabled !== undefined && { notificationsEnabled }),
      ...(auditLogsEnabled !== undefined && { auditLogsEnabled }),
      ...(branchManagementEnabled !== undefined && { branchManagementEnabled }),
      updatedAt: new Date().toISOString(),
    };

    writeConfig(updatedConfig);

    return res.json({
      message: `System mode updated to: ${updatedConfig.systemMode}`,
      config: updatedConfig,
    });
  } catch (error) {
    console.error('Error updating system config:', error);
    return res.status(500).json({ message: 'Error updating system configuration', error: error.message });
  }
};

// @desc    Get system health & version info
// @route   GET /api/system/health
// @access  Public
export const getSystemHealth = async (req, res) => {
  const config = readConfig();
  return res.json({
    status: 'OK',
    system: 'Microfinance Management System',
    version: '2.0.0',
    mode: config.systemMode,
    features: {
      multiLevelApproval: config.multiLevelApproval,
      gpsTracking: config.gpsTrackingEnabled,
      penaltyEngine: config.penaltyEngineEnabled,
      notifications: config.notificationsEnabled,
      auditLogs: config.auditLogsEnabled,
      branchManagement: config.branchManagementEnabled,
    },
    timestamp: new Date().toISOString(),
  });
};
