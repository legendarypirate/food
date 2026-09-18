export function serializeRestaurant(r) {
  const json = r.toJSON ? r.toJSON() : r;
  const categories = (json.Categories || json.categories || []).map((c) => c.name);
  return {
    id: String(json.id),
    slug: json.slug,
    name: json.name,
    imageUrl: json.imageUrl,
    rating: Number(json.rating),
    reviewCount: json.reviewCount,
    deliveryTime: json.deliveryTime,
    hours: json.hours,
    deliveryFee: json.deliveryFee,
    badge: json.badge,
    location: json.location,
    categories,
    freeDelivery: json.freeDelivery,
    isFavorite: false,
    isActive: json.isActive,
  };
}

export function serializeDish(d) {
  const json = d.toJSON ? d.toJSON() : d;
  const category = json.category || json.Category;
  return {
    id: String(json.id),
    slug: json.slug,
    name: json.name,
    price: json.price,
    imageUrl: json.imageUrl,
    badge: json.badge || '',
    badgeType: json.badgeType,
    servings: json.servings,
    likes: json.likes,
    category: category?.name || '',
    categoryId: json.categoryId,
    restaurantId: String(json.restaurantId),
    isActive: json.isActive,
  };
}

export function serializeOrder(o) {
  const json = o.toJSON ? o.toJSON() : o;
  const restaurant = json.restaurant || json.Restaurant;
  return {
    id: String(json.id),
    orderNumber: json.orderNumber,
    restaurantName: restaurant?.name || '',
    restaurantImage: restaurant?.imageUrl || '',
    restaurantId: String(json.restaurantId),
    items: (json.items || json.OrderItems || []).map((item) => ({
      name: item.name,
      quantity: item.quantity,
      price: item.price,
    })),
    total: json.total,
    status: json.status,
    date: json.dateLabel,
    deliveryAddress: json.deliveryAddress,
    estimatedMinutes: json.estimatedMinutes,
    tracking: json.tracking,
  };
}

export function serializeUser(u) {
  const json = u.toJSON ? u.toJSON() : u;
  return {
    id: json.id,
    name: json.name,
    phone: json.phone,
    email: json.email,
    role: json.role,
    membershipLevel: json.membershipLevel,
    points: json.points,
    orderCount: json.orderCount,
    avatarUrl: json.avatarUrl,
    deliveryAddress: json.deliveryAddress || null,
    isActive: json.isActive,
    createdAt: json.createdAt,
  };
}

export function serializeQPayPayment(p) {
  const json = p.toJSON ? p.toJSON() : p;
  const order = json.order || json.Order;
  return {
    id: json.id,
    invoiceId: json.invoiceId,
    senderInvoiceNo: json.senderInvoiceNo,
    orderId: json.orderId,
    orderNumber: order?.orderNumber || null,
    amount: json.amount,
    description: json.description,
    status: json.status,
    qpayShortUrl: json.qpayShortUrl,
    qrText: json.qrText,
    callbackUrl: json.callbackUrl,
    paidAt: json.paidAt,
    expiresAt: json.expiresAt,
    isActive: json.isActive,
    createdAt: json.createdAt,
  };
}

export function serializeCategory(c) {
  const json = c.toJSON ? c.toJSON() : c;
  return {
    id: json.id,
    slug: json.slug,
    name: json.name,
    icon: json.icon,
    gradientStart: json.gradientStart,
    gradientEnd: json.gradientEnd,
    sortOrder: json.sortOrder,
  };
}
