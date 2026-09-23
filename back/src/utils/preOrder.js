export function validateScheduledDate(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;

  const [year, month, day] = dateStr.split('-').map(Number);
  const scheduled = new Date(year, month - 1, day);
  if (
    scheduled.getFullYear() !== year ||
    scheduled.getMonth() !== month - 1 ||
    scheduled.getDate() !== day
  ) {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  scheduled.setHours(0, 0, 0, 0);

  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + 14);

  return scheduled >= today && scheduled <= maxDate;
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
  if (!scheduledDate || !scheduledTime) return null;

  const [year, month, day] = scheduledDate.split('-').map(Number);
  const scheduled = new Date(year, month - 1, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  scheduled.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  let datePart;
  if (scheduled.getTime() === today.getTime()) {
    datePart = 'Өнөөдөр';
  } else if (scheduled.getTime() === tomorrow.getTime()) {
    datePart = 'Маргааш';
  } else {
    datePart = `${month}-р сарын ${day}`;
  }

  return `${datePart} ${scheduledTime}`;
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
    return 'Захиалгын огноо буруу байна (өнөөдрөөс 14 хоногийн дотор)';
  }
  if (!validateScheduledTime(scheduledTime)) {
    return 'Захиалгын цаг буруу байна';
  }
  return null;
}
