export function getDeliveryStatus(message) {
  if (message.pending) {
    return "pending";
  }

  if (message.deliveryStatus) {
    return message.deliveryStatus;
  }

  if (message.isDelivered) {
    return "delivered";
  }

  return "sent";
}