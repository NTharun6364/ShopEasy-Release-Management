export const ORDER_STATUSES = ['Pending', 'Shipped', 'Delivered', 'Cancelled'];

export const normalizeOrderStatus = (status) => {
  if (ORDER_STATUSES.includes(status)) {
    return status;
  }

  if (status === 'Processing') {
    return 'Pending';
  }

  return 'Pending';
};

export const getOrderStatusBadgeClassName = (status) => {
  switch (normalizeOrderStatus(status)) {
    case 'Delivered':
      return 'bg-emerald-100 text-emerald-800';
    case 'Shipped':
      return 'bg-sky-100 text-sky-800';
    case 'Cancelled':
      return 'bg-rose-100 text-rose-800';
    case 'Pending':
    default:
      return 'bg-amber-100 text-amber-900';
  }
};