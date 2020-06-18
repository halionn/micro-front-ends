import { PREFIX } from './constant';

export const setGlobalData = <T>(key: string, value: T): void => {
  if (!window[PREFIX]) {
    window[PREFIX] = {};
  }
  window[PREFIX][key] = value;
};

export const getGlobalData = <T>(key: string): T => window[PREFIX] && window[PREFIX][key];

export const setMicroData = <T>(microId: string, key: string, value: T): void => {
  const microData = getGlobalData<Record<string, any> | undefined>(microId);
  if (!microData) {
    setGlobalData(microId, {
      [key]: value,
    });
    return;
  }
  microData[key] = value;
};

export const getMicroData = <T>(microId: string, key: string): T => {
  const microData = getGlobalData<Record<string, any> | undefined>(microId);
  if (microData) {
    return microData[key];
  }
};
