import { Well, System, ImportRule } from './types';

export const COLORS = {
  yale: '#1B4079',
  airforce: '#4D7C8A',
  cambridge: '#7F9C96',
  cambridge2: '#8FAD88',
  mindaro: '#CBDF90',
  danger: '#ef4444',
  success: '#10b981',
  warning: '#f59e0b'
};

export const MOCK_SYSTEMS: System[] = [
  { id: '1', name: 'Sistema Norte' },
  { id: '2', name: 'Sistema Sur' },
  { id: '3', name: 'Planta Central' },
];

export const MOCK_WELLS: Well[] = [
  { id: '1', name: 'TR-101', type: 'production', systemId: '1', status: 'open', createdAt: new Date().toISOString() },
  { id: '2', name: 'TR-102', type: 'production', systemId: '1', status: 'closed', createdAt: new Date().toISOString() },
  { id: '3', name: 'TR-201', type: 'reinjection', systemId: '2', status: 'open', createdAt: new Date().toISOString() },
  { id: '4', name: 'TR-305', type: 'production', systemId: '3', status: 'open', createdAt: new Date().toISOString() },
];

export const INITIAL_RULES: ImportRule[] = [
  { id: '1', sourceWellNamePattern: 'TR-101', action: 'split', targetWellIds: ['1', '2'], splitPercentage: 50 }
];
