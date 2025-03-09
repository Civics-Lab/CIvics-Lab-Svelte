// src/lib/services.ts
export type ServiceName = 'Compass' | 'Help Desk' | 'Engage' | 'Pathway' | 'Advocacy Ink';

export const serviceColors: Record<ServiceName, string> = {
  'Compass': 'text-cyan-500',
  'Help Desk': 'text-violet-500',
  'Engage': 'text-teal-500',
  'Pathway': 'text-lime-500',
  'Advocacy Ink': 'text-amber-500'
};