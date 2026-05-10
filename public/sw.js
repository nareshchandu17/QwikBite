// Service Worker for handling push notifications

self.addEventListener('push', (event) => {
  if (!(self.Notification && self.Notification.permission === 'granted')) {
    return;
  }

  const data = event.data?.json();
  
  const title = data?.title || 'New Update';
  const options = {
    body: data?.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    data: data?.data
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const orderId = event.notification.data?.orderId;
  
  if (orderId) {
    // Open the order status page when notification is clicked
    event.waitUntil(
      clients.openWindow(`/order/status?orderId=${orderId}`)
    );
  } else {
    // Default behavior if no orderId
    event.waitUntil(
      clients.openWindow('/orders')
    );
  }
});
