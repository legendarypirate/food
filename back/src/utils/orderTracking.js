import { formatUbTime } from './ulaanbaatarTime.js';

const DEFAULT_STEPS = [
  { label: 'Баталгаажсан', icon: 'check' },
  { label: 'Бэлтгэгдсэн', icon: 'soup_kitchen' },
  { label: 'Хүргэлтэнд гарсан', icon: 'delivery_dining', subtitle: 'Замдаа явна' },
  { label: 'Хүргэгдсэн', icon: 'home', subtitle: 'Хүлээгдэж буй' },
];

function nowTime() {
  return formatUbTime(new Date());
}

export function ensureTracking(order) {
  if (order.tracking?.steps?.length) {
    return JSON.parse(JSON.stringify(order.tracking));
  }

  const time = nowTime();
  return {
    orderNumber: order.orderNumber,
    steps: DEFAULT_STEPS.map((step, index) => ({
      ...step,
      state: index === 0 ? 'completed' : 'pending',
      time: index === 0 ? time : undefined,
    })),
  };
}

/** Mark steps 0..completedIndex as completed; next step active. */
export function advanceTracking(tracking, completedIndex) {
  const time = nowTime();
  const steps = tracking.steps.map((step, index) => {
    if (index <= completedIndex) {
      return { ...step, state: 'completed', time: step.time || time };
    }
    if (index === completedIndex + 1) {
      return { ...step, state: 'active' };
    }
    return { ...step, state: 'pending' };
  });
  return { ...tracking, steps };
}

/** Set a specific step as active; earlier steps completed, later pending. */
export function setTrackingStep(tracking, activeIndex) {
  const time = nowTime();
  const steps = tracking.steps.map((step, index) => {
    if (index < activeIndex) {
      return { ...step, state: 'completed', time: step.time || time };
    }
    if (index === activeIndex) {
      return { ...step, state: 'active', time: step.time || time };
    }
    return { ...step, state: 'pending', time: undefined };
  });
  return { ...tracking, steps };
}

export function completeTracking(tracking) {
  const time = nowTime();
  const steps = tracking.steps.map((step) => ({
    ...step,
    state: 'completed',
    time: step.time || time,
  }));
  return { ...tracking, steps };
}

export function createInitialTracking(orderNumber, restaurantName, deliveryAddress) {
  const time = nowTime();
  return {
    orderNumber,
    restaurantLabel: restaurantName,
    destinationLabel: deliveryAddress,
    etaRange: '25–35 минутын дараа хүрнэ',
    estimatedArrival: time,
    steps: DEFAULT_STEPS.map((step, index) => ({
      ...step,
      state: index === 0 ? 'completed' : index === 1 ? 'active' : 'pending',
      time: index === 0 ? time : undefined,
      subtitle: step.subtitle,
    })),
    courier: {
      name: 'Б. Бат-Эрдэнэ',
      rating: 4.9,
      vehicle: 'Toyota Prius 30',
      plateNumber: 'Мөнгөлөг (12-34 УББ)',
      deliveryCount: 1120,
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80',
      distanceKm: 1.2,
    },
  };
}

export function getCurrentStepLabel(tracking) {
  if (!tracking?.steps?.length) return null;
  const active = tracking.steps.find((s) => s.state === 'active');
  if (active) return active.label;
  const lastCompleted = [...tracking.steps].reverse().find((s) => s.state === 'completed');
  return lastCompleted?.label ?? tracking.steps[0].label;
}
