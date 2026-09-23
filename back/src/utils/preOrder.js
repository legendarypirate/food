import {
  addCalendarDays,
  formatUbDate,
  formatUbRelativeDate,
} from './ulaanbaatarTime.js';

export function validateScheduledDate(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;

  const [year, month, day] = dateStr.split('-').map(Number);
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;

  const todayStr = formatUbDate(new Date());
  const tomorrowStr = addCalendarDays(todayStr, 1);

  return dateStr === todayStr || dateStr === tomorrowStr;
}

export function validateScheduledTime(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') return false;
  if (!/^\d{2}:\d{2}$/.test(timeStr)) return false;
  const [h, m] = timeStr.split(':').map(Number);
  return h >= 0 && h <= 23 && m >= 0 && m <= 59;
}

export function validateFulfillmentType(type) {
  return type === 'delivery' || type === 'pickup';
}

export function formatScheduledLabel(scheduledDate, scheduledTime) {
  return formatUbRelativeDate(scheduledDate, scheduledTime);
}

export function fulfillmentTypeLabel(type) {
  return type === 'pickup' ? 'Очиж идэх' : 'Хүргэлтээр';
}

export function parsePreOrderFields(body) {
  const isPreOrder = body.isPreOrder === true || body.isPreOrder === 'true';

  if (!isPreOrder) {
    return {
      fulfillmentType: 'delivery',
      scheduledDate: '',
      scheduledTime: '',
      isPreOrder: false,
    };
  }

  const fulfillmentType = body.fulfillmentType === 'pickup' ? 'pickup' : 'delivery';
  const scheduledDate = String(body.scheduledDate || '').trim();
  const scheduledTime = String(body.scheduledTime || '').trim();

  return { fulfillmentType, scheduledDate, scheduledTime, isPreOrder: true };
}

export function validatePreOrder({ scheduledDate, scheduledTime, isPreOrder }) {
  if (!isPreOrder) return null;

  if (!scheduledDate || !scheduledTime) {
    return 'Урьдчилсан захиалгын огноо, цаг сонгоно уу';
  }
  if (!validateScheduledDate(scheduledDate)) {
    return 'Захиалгын огноо буруу байна (зөвхөн өнөөдөр эсвэл маргааш)';
  }
  if (!validateScheduledTime(scheduledTime)) {
    return 'Захиалгын цаг буруу байна';
  }
  return null;
}
