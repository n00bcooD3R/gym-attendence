// ============================================================================
// ADMS Push Protocol Parser
// Parses data from ZKTeco/eSSL biometric devices
// ============================================================================

import { ADMSAttendanceRecord, ADMSOperationRecord } from './types';

/**
 * Parse attendance log data (ATTLOG) from device
 * Format: PIN\tTime\tStatus\tVerify\tWorkCode\tReserved1\tReserved2
 * Example: "1\t2025-06-11 09:30:00\t0\t15\t0\t0\t0"
 */
export function parseAttendanceLogs(rawData: string): ADMSAttendanceRecord[] {
  const records: ADMSAttendanceRecord[] = [];
  const lines = rawData.split('\n').filter(line => line.trim().length > 0);

  for (const line of lines) {
    const fields = line.trim().split('\t');
    if (fields.length >= 2) {
      records.push({
        pin: fields[0]?.trim() || '',
        time: fields[1]?.trim() || '',
        status: fields[2]?.trim() || '0',
        verify: fields[3]?.trim() || '0',
        workCode: fields[4]?.trim() || '',
        reserved1: fields[5]?.trim() || '',
        reserved2: fields[6]?.trim() || '',
      });
    }
  }

  return records;
}

/**
 * Parse operation log data (OPERLOG) from device
 * Format: OPERLOG OpCode\tTime\tAdminId\tObj1\tObj2\tObj3\tObj4
 */
export function parseOperationLogs(rawData: string): ADMSOperationRecord[] {
  const records: ADMSOperationRecord[] = [];
  const lines = rawData.split('\n').filter(line => line.trim().length > 0);

  for (const line of lines) {
    const cleanLine = line.replace('OPERLOG ', '').trim();
    const fields = cleanLine.split('\t');
    if (fields.length >= 2) {
      records.push({
        opCode: fields[0]?.trim() || '',
        opTime: fields[1]?.trim() || '',
        adminId: fields[2]?.trim() || '',
        object1: fields[3]?.trim() || '',
        object2: fields[4]?.trim() || '',
        object3: fields[5]?.trim() || '',
        object4: fields[6]?.trim() || '',
      });
    }
  }

  return records;
}

/**
 * Parse user info data from device
 * Used when device syncs user data
 */
export function parseUserInfo(rawData: string): Record<string, string>[] {
  const records: Record<string, string>[] = [];
  const lines = rawData.split('\n').filter(line => line.trim().length > 0);

  for (const line of lines) {
    const record: Record<string, string> = {};
    const pairs = line.trim().split('\t');
    for (const pair of pairs) {
      const [key, value] = pair.split('=');
      if (key) {
        record[key.trim()] = value?.trim() || '';
      }
    }
    if (Object.keys(record).length > 0) {
      records.push(record);
    }
  }

  return records;
}

/**
 * Build registry options response for device handshake
 * This configures what data the device should push
 */
export function buildRegistryOptions(serialNumber: string): string {
  return [
    `GET OPTION FROM: ${serialNumber}`,
    'Stamp=9999',
    'OpStamp=9999',
    'PhotoStamp=9999',
    'ErrorDelay=60',
    'Delay=10',
    'TransTimes=00:00;14:05',
    'TransInterval=1',
    'TransFlag=TransData AttLog\tOpLog\tAttPhoto\tEnrollUser\tChgUser\tEnrollFP\tChgFP\tFPImag',
    'TimeZone=5',
    'Realtime=1',
    'Encrypt=0',
    '',
  ].join('\n');
}

/**
 * Format a device command string for the getrequest response
 */
export function formatDeviceCommand(commandId: string, command: string): string {
  return `C:${commandId}:${command}`;
}
