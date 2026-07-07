git add package.json package-lock.json
git commit -m "chore: remove socket.io and socket.io-client dependencies"

git add src/context/PusherContext.tsx
git commit -m "feat(realtime): implement PusherProvider for global real-time events"

git add src/app/layout.tsx
git commit -m "refactor(layout): integrate PusherProvider into root layout"

git add src/hooks/useOrderPusher.ts src/hooks/useOrderWebSocket.ts
git commit -m "refactor(hooks): migrate useOrderWebSocket to useOrderPusher"

git add src/context/OrderContext.tsx
git commit -m "refactor(context): migrate OrderContext from WebSocket to Pusher"

git add src/components/orders/QwikBiteEliteTracker.tsx
git commit -m "refactor(orders): migrate Elite Tracker to Pusher channels"

git add src/components/admin/AdminNotifications.tsx
git commit -m "refactor(admin): migrate AdminNotifications to Pusher"

git add src/components/admin/MenuManagement.tsx
git commit -m "refactor(admin): migrate MenuManagement to Pusher broadcast channel"

git add src/components/admin/Payments.tsx
git commit -m "refactor(admin): migrate Payments real-time updates to Pusher"

git add src/components/customer/CustomerNotifications.tsx
git commit -m "refactor(customer): migrate CustomerNotifications to Pusher"

git add src/app/customer/menu/page.tsx
git commit -m "refactor(customer): remove dummy socket.emit from customer menu"

git add src/components/FoodMenu.tsx
git commit -m "refactor(menu): migrate FoodMenu global updates to Pusher broadcast channel"

git add src/app/customer/notifications/page.tsx
git commit -m "refactor(customer): migrate notifications page to usePusher"

git add src/app/api/orders/route.ts
git commit -m "refactor(api): remove socketManager dependency from orders API"

git add src/context/WebSocketContext.tsx src/components/WebSocketExample.tsx src/hooks/useAdminSocket.ts src/server/index.ts
git commit -m "chore: remove legacy WebSocket contexts and clean up dev server"

git push origin main
